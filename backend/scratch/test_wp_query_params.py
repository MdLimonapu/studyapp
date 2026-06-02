import requests

url_programs = "https://universitystudy.ca/wp-json/custom/v1/external-api/programs"
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"

headers = {
    "User-Agent": UA,
    "Origin": "https://universitystudy.ca",
    "Referer": "https://universitystudy.ca/programs/"
}

# Test 1: Query page 2, page_size 20
payload1 = {"page": 2, "limit": 20}
res1 = requests.post(url_programs, headers=headers, json=payload1, timeout=10)
print(f"Test 1 status: {res1.status_code}")
data1 = res1.json()
print(f"Pagination: {data1.get('pagination')}")
print(f"Results count: {len(data1.get('search_results', []))}")

# Test 2: Search for "Computer Science"
payload2 = {"search": "Computer Science", "limit": 5}
res2 = requests.post(url_programs, headers=headers, json=payload2, timeout=10)
print(f"\nTest 2 status: {res2.status_code}")
data2 = res2.json()
print(f"Pagination: {data2.get('pagination')}")
results2 = data2.get('search_results', [])
print(f"Results count: {len(results2)}")
if results2:
    print(f"First result: {results2[0]}")
