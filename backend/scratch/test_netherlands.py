import requests
import json

url = "http://127.0.0.1:5001/api/search"
payload = {
    "country": "Netherlands",
    "degree": "master",
    "field": "Data Science"
}

try:
    response = requests.post(url, json=payload)
    response.raise_for_status()
    data = response.json()
    print("Total results:", data.get("total"))
    print("Returned results count:", len(data.get("results", [])))
    print("\nFirst 5 course search results:")
    for i, res in enumerate(data.get("results", [])[:5]):
        print(f"\n[{i+1}] {res.get('course')} ({res.get('degree')})")
        print(f"    Uni: {res.get('university')}")
        print(f"    City: {res.get('city')}")
        print(f"    Link: {res.get('link')}")
        print(f"    Source: {res.get('source')} | Verified At: {res.get('verified_at')}")
except Exception as e:
    print("Error querying backend API:", e)
