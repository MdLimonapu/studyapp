import requests
from bs4 import BeautifulSoup

url = "https://universitystudy.ca/programs/"
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"

res = requests.get(url, headers={"User-Agent": UA}, timeout=15)
soup = BeautifulSoup(res.text, "html.parser")

print("All script tags on page:")
for tag in soup.find_all("script"):
    src = tag.get("src")
    if src:
        if any(k in src.lower() for k in ["search", "app", "main", "bundle", "algolia", "elastic"]):
            print(f"  External script matching keyword: {src}")
        else:
            print(f"  External script: {src[:100]}")
    else:
        text = tag.string or ""
        if any(k in text.lower() for k in ["algolia", "elastic", "search", "api", "host"]):
            print(f"  Inline script snippet: {text[:200]}...")
