import requests
from bs4 import BeautifulSoup

base = "https://studyinjapan.go.jp/en/search-for-schools/school_search.php"
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"

# Fetch page 1 (offset 0, go=go)
res0 = requests.get(base, params={"lang": "en", "limit": "25", "offset": "0", "go": "go", "course": "1"}, headers={"User-Agent": UA}, timeout=10)
soup0 = BeautifulSoup(res0.text, "html.parser")
items0 = [item.select_one(".school-name").get_text(strip=True) for item in soup0.select("a.school-result-item") if item.select_one(".school-name")]

# Fetch page 2 (offset 25, go=ofs)
res25 = requests.get(base, params={"lang": "en", "limit": "25", "offset": "25", "go": "ofs", "course": "1"}, headers={"User-Agent": UA}, timeout=10)
soup25 = BeautifulSoup(res25.text, "html.parser")
items25 = [item.select_one(".school-name").get_text(strip=True) for item in soup25.select("a.school-result-item") if item.select_one(".school-name")]

print("Offset 0 schools:")
for i, name in enumerate(items0):
    print(f"  {i+1}. {name}")

print("\nOffset 25 schools:")
for i, name in enumerate(items25):
    print(f"  {i+1}. {name}")

print(f"\nAre they identical? {items0 == items25}")
