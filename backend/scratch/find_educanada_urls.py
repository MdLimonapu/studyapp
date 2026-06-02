import requests
from bs4 import BeautifulSoup

url = "https://www.educanada.ca/index.aspx?lang=eng"
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"

res = requests.get(url, headers={"User-Agent": UA}, timeout=15)
soup = BeautifulSoup(res.text, "html.parser")

print("All links containing program, search, cost, or study:")
for a in soup.find_all("a"):
    href = a.get("href", "")
    text = a.get_text(strip=True)
    if any(k in href.lower() or k in text.lower() for k in ["program", "search", "cost", "study", "college", "uni"]):
        print(f"  {text} -> {href}")
