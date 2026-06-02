import requests
from bs4 import BeautifulSoup

base = "https://studyinjapan.go.jp/en/search-for-schools/school_search.php"
params = {"lang": "en", "limit": "25", "offset": "1000", "go": "go", "course": "1"}
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"

res = requests.get(base, params=params, headers={"User-Agent": UA}, timeout=10)
soup = BeautifulSoup(res.text, "html.parser")
items = soup.select("a.school-result-item")
print(f"Offset 1000 returned {len(items)} items")

params["offset"] = "0"
res0 = requests.get(base, params=params, headers={"User-Agent": UA}, timeout=10)
soup0 = BeautifulSoup(res0.text, "html.parser")
items0 = soup0.select("a.school-result-item")
print(f"Offset 0 returned {len(items0)} items")
