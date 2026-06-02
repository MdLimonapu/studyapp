import requests

url = "https://api.studyprogrammes.ch/list_studyprogrammes"
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"

# Fetch page 1
res1 = requests.get(url, params={"page": 1}, headers={"User-Agent": UA, "Origin": "https://studyprogrammes.ch"}, timeout=10)
data1 = res1.json().get("data", [])
ids1 = [item.get("id") for item in data1]

# Fetch page 2
res2 = requests.get(url, params={"page": 2}, headers={"User-Agent": UA, "Origin": "https://studyprogrammes.ch"}, timeout=10)
data2 = res2.json().get("data", [])
ids2 = [item.get("id") for item in data2]

print(f"Page 1 returned {len(data1)} items, first few IDs: {ids1[:5]}")
print(f"Page 2 returned {len(data2)} items, first few IDs: {ids2[:5]}")
print(f"Are page 1 and page 2 identical? {ids1 == ids2}")
