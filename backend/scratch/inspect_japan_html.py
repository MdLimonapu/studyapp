import requests
from bs4 import BeautifulSoup

base = "https://studyinjapan.go.jp/en/search-for-schools/school_search.php"
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"

res = requests.get(base, params={"lang": "en", "course": "1"}, headers={"User-Agent": UA}, timeout=10)
soup = BeautifulSoup(res.text, "html.parser")

# Find pagination elements
print("Pagination buttons:")
pagination = soup.select(".pagination a, .pager a, [class*='page'] a, [class*='pag'] a")
for a in pagination:
    print(f"  Href: {a.get('href')} | Text: {a.get_text(strip=True)}")

# Let's search all hrefs containing 'school_search.php'
print("\nAll school_search.php links:")
all_links = soup.find_all("a")
for a in all_links:
    href = a.get("href", "")
    if "school_search.php" in href:
        print(f"  {a.get_text(strip=True)} -> {href}")
