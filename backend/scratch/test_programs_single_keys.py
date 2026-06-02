import requests
import json

url_single = "https://universitystudy.ca/wp-json/custom/v1/external-api/programs-single"
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"

headers = {
    "User-Agent": UA,
    "Origin": "https://universitystudy.ca",
    "Referer": "https://universitystudy.ca/programs/"
}

# Test POST to /programs-single
res = requests.post(url_single, headers=headers, json={"site_lang": "en", "program_id": "33237"}, timeout=10)
data = res.json()

for key in ["program", "university"]:
    val = data.get(key)
    print(f"\n=== {key} (type: {type(val)}) ===")
    if isinstance(val, list):
        print(f"List length: {len(val)}")
        if val:
            item = val[0]
            if isinstance(item, dict):
                for k, v in item.items():
                    print(f"  {k}: {str(v)[:300]}")
            else:
                print(item)
    elif isinstance(val, dict):
        for k, v in val.items():
            print(f"  {k}: {str(v)[:300]}")
