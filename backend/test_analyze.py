import json
import urllib.request
import urllib.error

body = json.dumps({
    "portfolio": [{
        "scheme": "Test Fund",
        "current_value": 100000,
        "invested": 90000,
        "units": 1000,
        "nav": 100,
        "expense_ratio": 1.0,
        "category": "Large Cap",
        "purchase_date": "2023-01-01"
    }]
}).encode()

req = urllib.request.Request(
    "http://127.0.0.1:8001/api/portfolio/analyze",
    data=body,
    headers={"Content-Type": "application/json"}
)

try:
    with urllib.request.urlopen(req) as resp:
        print("Status: 200")
        print("Response:", resp.read().decode())
except urllib.error.HTTPError as e:
    print(f"Status: {e.code}")
    print(f"Response: {e.read().decode()}")
except Exception as e:
    print(f"Error: {type(e).__name__}: {e}")
