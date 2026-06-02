import requests
from bs4 import BeautifulSoup

url = "https://www.universitystudy.ca/"
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"

res = requests.get(url, headers={"User-Agent": UA}, timeout=15)
soup = BeautifulSoup(res.text, "html.parser")

print("All links containing search or program:")
for a in soup.find_all("a"):
    href = a.get("href", "")
    text = a.get_text(strip=True)
    if any(k in href.lower() or k in text.lower() for k in ["search", "program"]):
        print(f"  {text} -> {href}")
