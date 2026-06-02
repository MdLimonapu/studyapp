import requests

url_single = "https://universitystudy.ca/wp-json/custom/v1/external-api/programs-single"
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"

headers = {
    "User-Agent": UA,
    "Origin": "https://universitystudy.ca",
    "Referer": "https://universitystudy.ca/programs/"
}

# Test POST to /programs-single with body {"site_lang": "en", "program_id": "33237"}
res = requests.post(url_single, headers=headers, json={"site_lang": "en", "program_id": "33237"}, timeout=10)
print(f"Status: {res.status_code}")
try:
    print(res.json())
except Exception as e:
    print(f"Error parsing JSON: {e}, response text: {res.text[:300]}")
