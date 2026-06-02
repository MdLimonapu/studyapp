import requests

url_by_id = "https://universitystudy.ca/wp-json/custom/v1/external-api/programs-by-id"
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"

headers = {
    "User-Agent": UA,
    "Origin": "https://universitystudy.ca",
    "Referer": "https://universitystudy.ca/programs/"
}

# Test POST to /programs-by-id with a list of IDs
payload = {
    "program_ids": ["33237", "931", "932"],
    "site_lang": "en"
}
res = requests.post(url_by_id, headers=headers, json=payload, timeout=10)
print(f"Status: {res.status_code}")
try:
    data = res.json()
    print("Response keys:", data.keys())
    for k, v in data.items():
        print(f"  {k}: type={type(v)}, len={len(v) if hasattr(v, '__len__') else 'N/A'}")
        if isinstance(v, list) and v:
            print("  First item keys:", v[0].keys() if hasattr(v[0], 'keys') else 'No keys')
            print("  First item content sample:", str(v[0])[:300])
except Exception as e:
    print(f"Error parsing JSON: {e}, text: {res.text[:300]}")
