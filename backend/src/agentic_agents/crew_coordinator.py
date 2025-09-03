from typing import Any, Dict, List
import statistics
from services.amadeus_service import search_flights
from functools import lru_cache
from database import db_manager
import datetime

try:
    from src.agentic_models.groq_manager import GroqLLMManager
except Exception:
    GroqLLMManager = None  # type: ignore


class TravelCrewCoordinator:
    """Coordinator skeleton. Wire CrewAI agents later."""

    def __init__(self) -> None:
        # Defer heavy imports until implementation step
        self.version = "0.1.0"

    async def execute_travel_analysis(self, request: Dict[str, Any], user: Dict[str, Any] | None = None) -> Dict[str, Any]:
        origin = request.get("origin")
        destination = request.get("destination")
        departure_date = request.get("departure_date")
        return_date = request.get("return_date")
        travelers = int(request.get("travelers", 1))
        target_currency = (request.get("currency") or "USD").upper()
        preferences = request.get("preferences") or {}
        max_stops = int(preferences.get("max_stops", 1)) if isinstance(preferences, dict) else 1
        preferred_carriers = set(map(str.upper, preferences.get("preferred_carriers", []))) if isinstance(preferences, dict) else set()
        exclude_redeye = bool(preferences.get("exclude_redeye", False)) if isinstance(preferences, dict) else False
        min_layover_minutes = int(preferences.get("min_layover_minutes", 0)) if isinstance(preferences, dict) else 0
        max_total_travel_minutes = int(preferences.get("max_total_travel_minutes", 0)) if isinstance(preferences, dict) else 0
        cabin_class = (preferences.get("cabin_class") or "ANY").upper() if isinstance(preferences, dict) else "ANY"

        # Simple in-memory cache key
        cache_key = (
            origin,
            destination,
            departure_date,
            return_date or "",
            travelers,
        )
        results = cached_search_sweep(*cache_key)

        prices: List[float] = []
        offers: List[Dict[str, Any]] = []
        if isinstance(results, list):
            for offer in results:
                try:
                    price_obj = offer.get("price", {}) or {}
                    total_str = price_obj.get("total") or price_obj.get("grandTotal") or 0.0
                    total = float(total_str)
                    currency = (price_obj.get("currency") or "USD").upper()

                    itineraries = offer.get("itineraries", []) or []
                    # Cabin filter (if pricing includes fare details in the response, skip if mismatch)
                    if cabin_class != "ANY":
                        fare_details = offer.get("travelerPricings", []) or []
                        if fare_details:
                            fare_cabin = (fare_details[0].get("fareDetailsBySegment", [{}])[0].get("cabin") or "").upper()
                            if fare_cabin and fare_cabin != cabin_class:
                                continue
                    # Filters
                    if not passes_filters(
                        itineraries,
                        max_stops=max_stops,
                        exclude_redeye=exclude_redeye,
                        preferred_carriers=preferred_carriers,
                        min_layover_minutes=min_layover_minutes,
                        max_total_travel_minutes=max_total_travel_minutes,
                    ):
                        continue

                    # Normalize currency
                    normalized_price = convert_currency(total, from_currency=currency, to_currency=target_currency)

                    if normalized_price > 0:
                        prices.append(normalized_price)
                        offers.append({
                            "id": offer.get("id"),
                            "price": normalized_price,
                            "currency": target_currency,
                            "itineraries": itineraries,
                            "highlights": build_highlights(itineraries),
                        })
                except Exception:
                    continue

        summary: Dict[str, Any] = {}
        if prices:
            prices_sorted = sorted(prices)
            summary = {
                "count": len(prices),
                "min": min(prices),
                "p25": percentile(prices_sorted, 25),
                "median": statistics.median(prices),
                "p75": percentile(prices_sorted, 75),
                "max": max(prices),
            }

        recommendations: List[Dict[str, Any]] = []
        recommendation = None
        if offers:
            target = summary.get("median") if summary else None
            ranked = []
            for o in offers:
                score = o["price"]
                if target is not None:
                    score = abs(o["price"] - target) + 0.01 * o["price"]
                ranked.append((score, o))
            ranked.sort(key=lambda x: x[0])
            top = [o for _, o in ranked[:3]]
            recommendation = top[0] if top else None
            recommendations = [annotate_pros_cons(x, target) for x in top]

        explanation = None
        if GroqLLMManager and recommendation:
            try:
                llm = GroqLLMManager()
                explanation = llm.generate_explanation(
                    agent_name="Heuristic Travel Coordinator",
                    decision_data={
                        "summary": summary,
                        "recommendation_price": recommendation.get("price") if recommendation else None,
                        "filters": {
                            "max_stops": max_stops,
                            "exclude_redeye": exclude_redeye,
                            "preferred_carriers": list(preferred_carriers),
                        },
                        "date_window": "+/- 3 days",
                        "target_currency": target_currency,
                    },
                )
            except Exception:
                explanation = None

        if explanation is None:
            explanation = basic_explanation(
                summary=summary,
                recommendation=recommendation,
                filters={
                    "max_stops": max_stops,
                    "exclude_redeye": exclude_redeye,
                    "preferred_carriers": list(preferred_carriers),
                },
                date_window="+/- 3 days",
                currency=target_currency,
            )

        result_obj = {
            "summary": summary,
            "recommendation": recommendation,
            "top_recommendations": recommendations,
            "offers_considered": len(offers),
            "inputs": request,
            "version": self.version,
            "notes": "Heuristic-based analysis (no ML). Prices normalized to target currency. Includes +/- 3-day sweep.",
            "explanation": explanation,
        }

        # Persist simple history document (best-effort)
        try:
            if db_manager and db_manager.database:
                coll = db_manager.get_collection("agentic_search_history")
                doc = {
                    "ts": datetime.datetime.utcnow().isoformat() + "Z",
                    "route": {"origin": origin, "destination": destination},
                    "dates": {"departure": departure_date, "return": return_date},
                    "prefs": {
                        "max_stops": max_stops,
                        "exclude_redeye": exclude_redeye,
                        "preferred_carriers": list(preferred_carriers),
                        "min_layover_minutes": min_layover_minutes,
                        "max_total_travel_minutes": max_total_travel_minutes,
                        "cabin_class": cabin_class,
                    },
                    "summary": summary,
                    "recommendation_price": recommendation.get("price") if recommendation else None,
                }
                coll.insert_one(doc)
        except Exception:
            pass

        return result_obj


def percentile(sorted_values: List[float], pct: float) -> float:
    if not sorted_values:
        return 0.0
    k = (len(sorted_values) - 1) * (pct / 100.0)
    f = int(k)
    c = min(f + 1, len(sorted_values) - 1)
    if f == c:
        return sorted_values[int(k)]
    d0 = sorted_values[f] * (c - k)
    d1 = sorted_values[c] * (k - f)
    return d0 + d1


def passes_filters(
    itineraries: List[Dict[str, Any]],
    max_stops: int,
    exclude_redeye: bool,
    preferred_carriers: set[str],
    min_layover_minutes: int,
    max_total_travel_minutes: int,
) -> bool:
    # Stop count filter
    for itin in itineraries:
        segments = itin.get("segments", []) or []
        total_stops = 0
        for seg in segments:
            total_stops += int(seg.get("numberOfStops", 0))
        if total_stops > max_stops:
            return False

    # Red-eye filter (departure between 00:00–05:00 local time)
    if exclude_redeye:
        for itin in itineraries:
            for seg in (itin.get("segments", []) or []):
                dep_time = seg.get("departure", {}).get("at")
                if dep_time:
                    try:
                        # naive parse; timestamps are ISO8601, ignore tz for heuristic
                        t = datetime.datetime.fromisoformat(dep_time.replace("Z", "+00:00"))
                        if 0 <= t.hour < 5:
                            return False
                    except Exception:
                        pass

    # Preferred carriers (if provided, every segment should match one)
    if preferred_carriers:
        for itin in itineraries:
            for seg in (itin.get("segments", []) or []):
                carrier = (seg.get("operating", {}).get("carrierCode") or seg.get("carrierCode") or "").upper()
                if carrier and carrier not in preferred_carriers:
                    return False

    # Layover rule (min layover minutes)
    if min_layover_minutes > 0:
        for itin in itineraries:
            segments = itin.get("segments", []) or []
            for i in range(1, len(segments)):
                prev_arr = segments[i - 1].get("arrival", {}).get("at")
                dep_next = segments[i].get("departure", {}).get("at")
                try:
                    if prev_arr and dep_next:
                        a = datetime.datetime.fromisoformat(prev_arr.replace("Z", "+00:00"))
                        d = datetime.datetime.fromisoformat(dep_next.replace("Z", "+00:00"))
                        layover = (d - a).total_seconds() / 60.0
                        if layover < min_layover_minutes:
                            return False
                except Exception:
                    continue

    # Max total travel time
    if max_total_travel_minutes > 0:
        total_minutes = 0
        for itin in itineraries:
            for seg in (itin.get("segments", []) or []):
                # prefer using ISO duration if available, else compute
                dur = seg.get("duration")
                if dur and dur.startswith("PT"):
                    minutes = parse_iso_duration_minutes(dur)
                    total_minutes += minutes
                else:
                    dep = seg.get("departure", {}).get("at")
                    arr = seg.get("arrival", {}).get("at")
                    try:
                        if dep and arr:
                            d = datetime.datetime.fromisoformat(dep.replace("Z", "+00:00"))
                            a = datetime.datetime.fromisoformat(arr.replace("Z", "+00:00"))
                            total_minutes += (a - d).total_seconds() / 60.0
                    except Exception:
                        continue
        if total_minutes > max_total_travel_minutes:
            return False

    return True


_FX = {
    ("EUR", "USD"): 1.08,
    ("USD", "EUR"): 0.93,
}


def convert_currency(amount: float, from_currency: str, to_currency: str) -> float:
    if from_currency == to_currency:
        return amount
    rate = _FX.get((from_currency, to_currency))
    if rate is None:
        # Try live FX if available, else 1:1
        try:
            live_rate = fetch_live_fx(from_currency, to_currency)
            if live_rate:
                return round(amount * live_rate, 2)
        except Exception:
            pass
        return amount
    return round(amount * rate, 2)


def expand_dates(departure_date: str, return_date: str | None, window_days: int = 3) -> List[tuple[str, str | None]]:
    def parse(d: str) -> datetime.date:
        return datetime.date.fromisoformat(d)

    dd = parse(departure_date)
    rd = parse(return_date) if return_date else None
    out: List[tuple[str, str | None]] = []
    for offset in range(-window_days, window_days + 1):
        d = dd + datetime.timedelta(days=offset)
        if rd:
            r = rd + datetime.timedelta(days=offset)
            out.append((d.isoformat(), r.isoformat()))
        else:
            out.append((d.isoformat(), None))
    return out


def basic_explanation(
    summary: Dict[str, Any],
    recommendation: Dict[str, Any] | None,
    filters: Dict[str, Any],
    date_window: str,
    currency: str,
) -> str:
    if not summary:
        return "No price summary available. Try different dates or relaxing filters."
    min_v = summary.get('min')
    max_v = summary.get('max')
    med_v = summary.get('median')
    stats = (
        f"We evaluated {summary.get('count', 0)} offers over {date_window}. "
        f"Price range: {min_v:.2f}-{max_v:.2f} {currency}. "
        f"Median: {med_v:.2f} {currency}."
    )
    carriers = filters.get('preferred_carriers') or []
    carriers_str = ",".join(carriers) if carriers else "none"
    filt = (
        f" Filters applied: max_stops={filters.get('max_stops')}, "
        f"exclude_redeye={filters.get('exclude_redeye')}, "
        f"preferred_carriers=[{carriers_str}]."
    )
    rec = ""
    if recommendation:
        rec_price = recommendation.get('price')
        try:
            rec = f" Recommended option balances cost near median ({float(rec_price):.2f} {currency}) and constraints."
        except Exception:
            rec = f" Recommended option balances cost near median and constraints."
    return stats + filt + rec


def parse_iso_duration_minutes(iso: str) -> int:
    # very small parser for like PT5H35M
    hours = 0
    minutes = 0
    try:
        s = iso.replace("PT", "")
        if "H" in s:
            parts = s.split("H")
            hours = int(parts[0])
            s = parts[1] if len(parts) > 1 else ""
        if "M" in s:
            minutes = int(s.split("M")[0])
    except Exception:
        pass
    return hours * 60 + minutes


def annotate_pros_cons(offer: Dict[str, Any], median_price: float | None) -> Dict[str, Any]:
    pros: List[str] = []
    cons: List[str] = []
    price = offer.get("price")
    if median_price is not None and price is not None:
        if price <= median_price:
            pros.append("priced at or below median")
        else:
            cons.append("priced above median")
    # Non-stop detection
    nonstop = True
    for itin in (offer.get("itineraries", []) or []):
        for seg in (itin.get("segments", []) or []):
            if int(seg.get("numberOfStops", 0)) > 0:
                nonstop = False
    if nonstop:
        pros.append("non-stop segments")
    else:
        cons.append("one or more stops")
    return {
        **offer,
        "pros": pros,
        "cons": cons,
    }


def build_highlights(itineraries: List[Dict[str, Any]]) -> Dict[str, Any]:
    # Extract quick highlights for UI
    total_stops = 0
    carriers: List[str] = []
    first_dep = None
    last_arr = None
    for itin in itineraries:
        for seg in (itin.get("segments", []) or []):
            total_stops += int(seg.get("numberOfStops", 0))
            carrier = seg.get("operating", {}).get("carrierCode") or seg.get("carrierCode")
            if carrier and carrier not in carriers:
                carriers.append(carrier)
            dep = seg.get("departure", {}).get("at")
            arr = seg.get("arrival", {}).get("at")
            if dep and (first_dep is None or dep < first_dep):
                first_dep = dep
            if arr and (last_arr is None or arr > last_arr):
                last_arr = arr
    return {
        "stops": total_stops,
        "carriers": carriers,
        "depart_at": first_dep,
        "arrive_at": last_arr,
    }


def fetch_live_fx(from_currency: str, to_currency: str) -> float | None:
    import os
    import requests
    # Try a free-ish endpoint if configured, else None
    fx_url = os.getenv("FX_API_URL")  # e.g., https://api.exchangerate.host/convert
    if not fx_url:
        return None
    try:
        # exchangerate.host example: /convert?from=EUR&to=USD
        if "exchangerate.host" in fx_url:
            url = f"{fx_url}?from={from_currency}&to={to_currency}"
            r = requests.get(url, timeout=5)
            r.raise_for_status()
            data = r.json()
            rate = data.get("info", {}).get("rate") or data.get("result")
            return float(rate) if rate else None
    except Exception:
        return None
    return None


@lru_cache(maxsize=64)
def cached_search_sweep(origin: str, destination: str, departure_date: str, return_date: str, travelers: int) -> List[Dict[str, Any]]:
    dates = expand_dates(departure_date, return_date if return_date else None, window_days=3)
    aggregated: List[Dict[str, Any]] = []
    for dd, rd in dates:
        res = search_flights(origin, destination, dd, rd, travelers)
        if isinstance(res, list):
            aggregated.extend(res)
    return aggregated


