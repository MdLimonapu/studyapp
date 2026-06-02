import requests
from bs4 import BeautifulSoup

url = "https://www.educanada.ca/programs-programmes/search-recherche.aspx?lang=eng"
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"

res = requests.get(url, headers={"User-Agent": UA}, timeout=15)
print(f"Status code: {res.status_code}")
print(f"Final URL: {res.url}")
print(f"Content-Type: {res.headers.get('Content-Type')}")

soup = BeautifulSoup(res.text, "html.parser")
print(f"Title: {soup.title.string if soup.title else 'No Title'}")
print("First 500 chars of body:")
print(soup.body.get_text()[:500] if soup.body else res.text[:500])
