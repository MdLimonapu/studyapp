import requests
from bs4 import BeautifulSoup

url = "https://w05.educanada.ca/index.aspx?action=programsearch-rechercheprogramme&lang=eng"
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"

res = requests.get(url, headers={"User-Agent": UA}, timeout=10)
soup = BeautifulSoup(res.text, "html.parser")

print("Forms on page:")
for i, form in enumerate(soup.find_all("form")):
    print(f"Form {i+1} action: {form.get('action')}, method: {form.get('method')}")
    for ipt in form.find_all(["input", "select", "button"]):
        name = ipt.get("name")
        ipt_type = ipt.get("type") or ipt.name
        value = ipt.get("value")
        print(f"  - {name} ({ipt_type}) = {value}")
