import requests
import re
from bs4 import BeautifulSoup

url = "https://universitystudy.ca/programs/"
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"

res = requests.get(url, headers={"User-Agent": UA}, timeout=15)
soup = BeautifulSoup(res.text, "html.parser")

# Search all script tag texts for 'nonce'
print("Inline script lines containing 'nonce':")
for tag in soup.find_all("script"):
    text = tag.string or ""
    for line in text.splitlines():
        if "nonce" in line.lower():
            print(f"  {line.strip()[:200]}")

# Search for any hidden inputs with name containing 'nonce'
print("\nForm fields containing 'nonce':")
for form in soup.find_all("form"):
    for ipt in form.find_all("input"):
        name = ipt.get("name", "")
        if "nonce" in name.lower():
            print(f"  Form input: {name} = {ipt.get('value')}")
