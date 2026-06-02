import requests
from bs4 import BeautifulSoup

url = "https://universitystudy.ca/programs/"
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"

res = requests.get(url, headers={"User-Agent": UA}, timeout=15)
soup = BeautifulSoup(res.text, "html.parser")

for tag in soup.find_all("script"):
    text = tag.string or ""
    if "api_proxy_base_url" in text:
        print("Found matching script tag:")
        print(text)
        print("="*40)
