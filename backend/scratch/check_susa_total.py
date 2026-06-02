import requests

BASE_URL = "https://api.skolverket.se/susa-navet/emil3"
res = requests.get(f"{BASE_URL}/educationEvents", params={"schoolType": "HS", "size": 1}, timeout=10)
print(res.json())
