import requests


SUPPORTED_DIRECT = {
    # Commonly supported by Google Hotels. Extend as needed.
    'USD', 'EUR', 'GBP', 'INR', 'AUD', 'CAD', 'MYR'
}


def is_direct_supported(code: str) -> bool:
    return code.upper() in SUPPORTED_DIRECT


def fetch_conversion_rate(from_code: str, to_code: str) -> float:
    """Fetch FX rate using exchangerate.host. Returns multiplier to convert from -> to.
    Falls back to 1.0 on error.
    """
    try:
        url = f"https://api.exchangerate.host/convert?from={from_code.upper()}&to={to_code.upper()}"
        resp = requests.get(url, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            result = data.get('result')
            if isinstance(result, (int, float)) and result > 0:
                return float(result)
    except Exception:
        pass
    return 1.0


