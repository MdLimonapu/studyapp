import requests

url_program = "https://universitystudy.ca/wp-json/custom/v1/external-api/program"
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"

headers = {
    "User-Agent": UA,
    "Origin": "https://universitystudy.ca",
    "Referer": "https://universitystudy.ca/programs/"
}

# Test POST to /program with body {"id": "33237"}
res = requests.post(url_program, headers=headers, json={"id": "33237"}, timeout=10)
print(f"/program POST Status: {res.status_code}")
try:
    print(res.json() if isinstance(res.json(), dict) else str(res.json())[:300])
except Exception as e:
    print(f"Error parsing json: {e}, text: {res.text[:300]}")
