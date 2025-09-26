import os
from typing import Dict, Any, List, Optional
import requests
from config import settings


SERPAPI_BASE = "https://serpapi.com/search.json"


class SerpApiClient:
    def __init__(self, api_key: Optional[str] = None, default_gl: Optional[str] = None, default_hl: Optional[str] = None, default_currency: Optional[str] = None):
        # Prefer configured settings over raw env
        self.api_key = api_key or settings.serpapi_api_key or os.getenv("SERPAPI_API_KEY", "")
        self.default_gl = default_gl or settings.serpapi_gl or "us"
        self.default_hl = default_hl or settings.serpapi_hl or "en"
        self.default_currency = default_currency or settings.serpapi_currency or "USD"

    def _get(self, params: Dict[str, Any]) -> Dict[str, Any]:
        if not self.api_key:
            return {"error": "SERPAPI_API_KEY is not configured on the server.", "status_code": 500}
        merged = {
            **params,
            "api_key": self.api_key,
        }
        try:
            resp = requests.get(SERPAPI_BASE, params=merged, timeout=20)
            if resp.status_code >= 400:
                try:
                    body = resp.json()
                except Exception:
                    body = {"error": resp.text}
                return {"error": body.get("error") or body, "status_code": resp.status_code}
            return resp.json()
        except requests.RequestException as e:
            return {"error": f"SerpApi request failed: {e}", "status_code": 502}

    def hotels_autocomplete(self, q: str, gl: Optional[str] = None, hl: Optional[str] = None, currency: Optional[str] = None) -> Dict[str, Any]:
        result = self._get({
            "engine": "google_hotels_autocomplete",
            "q": q,
            "gl": gl or self.default_gl,
            "hl": hl or self.default_hl,
            "currency": currency or self.default_currency,
        })
        if not isinstance(result, dict):
            return {"suggestions": []}
        return result

    def hotels_search(self, params: Dict[str, Any]) -> Dict[str, Any]:
        base_params = {
            "engine": "google_hotels",
            "gl": params.get("gl") or self.default_gl,
            "hl": params.get("hl") or self.default_hl,
            "currency": params.get("currency") or self.default_currency,
        }
        base_params.update({
            "q": params["q"],
            "check_in_date": params["check_in_date"],
            "check_out_date": params["check_out_date"],
        })

        optional_keys = [
            "adults", "children", "children_ages", "sort_by", "min_price", "max_price",
            "property_types", "amenities", "rating", "brands", "hotel_class", "free_cancellation",
            "special_offers", "eco_certified", "vacation_rentals", "next_page_token"
        ]
        for k in optional_keys:
            if params.get(k) not in (None, ""):
                base_params[k] = params[k]

        result = self._get(base_params)
        if not isinstance(result, dict):
            return {"properties": []}
        return result

    def hotel_property_details(self, params: Dict[str, Any]) -> Dict[str, Any]:
        base_params = {
            "engine": "google_hotels",
            "gl": params.get("gl") or self.default_gl,
            "hl": params.get("hl") or self.default_hl,
            "currency": params.get("currency") or self.default_currency,
        }
        # required context
        base_params.update({
            "q": params["q"],
            "check_in_date": params["check_in_date"],
            "check_out_date": params["check_out_date"],
            "adults": params.get("adults", 2),
            "property_token": params["property_token"],
        })
        result = self._get(base_params)
        if not isinstance(result, dict):
            return {"error": "Invalid details response"}
        return result


def map_serp_properties_to_hotel_offers(properties: List[Dict[str, Any]], check_in: str, check_out: str, currency: str, guests: Optional[int] = None, rooms: Optional[int] = None) -> List[Dict[str, Any]]:
    mapped: List[Dict[str, Any]] = []
    for p in properties or []:
        hotel_id = p.get("property_token") or p.get("link") or p.get("name")
        rate = (p.get("total_rate") or {}).get("extracted_lowest")
        if rate is None:
            rate = (p.get("rate_per_night") or {}).get("extracted_lowest")

        # Images & amenities
        thumb = None
        full = None
        imgs = p.get("images") or []
        if imgs:
            thumb = imgs[0].get("thumbnail")
            full = imgs[0].get("original_image")
        amenities = p.get("amenities") or []

        offers = []
        if rate is not None:
            offers.append({
                "price": {
                    "total": rate,
                    "currency": currency,
                },
                "checkInDate": check_in,
                "checkOutDate": check_out,
                "guests": guests,
                "rooms": rooms,
            })

        mapped.append({
            "hotel": {
                "hotelId": str(hotel_id),
                "name": p.get("name"),
                "chainCode": (p.get("prices") or [{}])[0].get("source", ""),
                "cityCode": "",
                "distance": {},
                "thumbnail": thumb,
                "image": full,
                "amenities": amenities,
            },
            "offers": offers,
            "serpapi": {
                "overall_rating": p.get("overall_rating"),
                "reviews": p.get("reviews"),
                "hotel_class": p.get("extracted_hotel_class") or p.get("hotel_class"),
            }
        })
    return mapped


