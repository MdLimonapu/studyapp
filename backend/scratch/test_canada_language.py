import requests

url_programs = "https://universitystudy.ca/wp-json/custom/v1/external-api/programs"
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"

headers = {
    "User-Agent": UA,
    "Origin": "https://universitystudy.ca",
    "Referer": "https://universitystudy.ca/programs/"
}

# Test 1: Language = "en"
payload1 = {
    "p_number": 1,
    "language": "en",
    "site_lang": "en"
}
res1 = requests.post(url_programs, headers=headers, json=payload1, timeout=10)
data1 = res1.json()
print("Language 'en' pagination:")
print(data1.get("pagination"))

# Test 2: Program level = Bachelor's (Let's check if we can find program level values)
# Let's inspect filters from the initial response keys
res_initial = requests.post(url_programs, headers=headers, json={"p_number": 1}, timeout=10)
filters = res_initial.json().get("filters", {})
print("\nAvailable Filters:")
for k, v in filters.items():
    print(f"Filter '{k}': type={type(v)}, items count={len(v) if hasattr(v, '__len__') else 'N/A'}")
    if isinstance(v, list) and v:
        print(f"  Sample items: {v[:3]}")
