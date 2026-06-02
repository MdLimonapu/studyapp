import requests

url_programs = "https://universitystudy.ca/wp-json/custom/v1/external-api/programs"
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"

headers = {
    "User-Agent": UA,
    "Origin": "https://universitystudy.ca",
    "Referer": "https://universitystudy.ca/programs/"
}

# Test 1: Query p_number = 2
payload = {
    "p_number": 2,
    "site_lang": "en"
}
res = requests.post(url_programs, headers=headers, json=payload, timeout=10)
print(f"Status: {res.status_code}")
data = res.json()
print("Pagination info:")
print(data.get("pagination"))
results = data.get("search_results", [])
print(f"Loaded {len(results)} results from page 2.")
if results:
    print(f"First result on page 2: {results[0]['program_name']} at {results[0]['university']} (ID: {results[0]['id']})")

# Test 2: Try querying p_number = 3
payload2 = {
    "p_number": 3,
    "site_lang": "en"
}
res2 = requests.post(url_programs, headers=headers, json=payload2, timeout=10)
data2 = res2.json()
results2 = data2.get("search_results", [])
print(f"Loaded {len(results2)} results from page 3.")
if results2:
    print(f"First result on page 3: {results2[0]['program_name']} at {results2[0]['university']} (ID: {results2[0]['id']})")
