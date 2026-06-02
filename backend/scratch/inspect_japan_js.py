import requests
import re
from bs4 import BeautifulSoup

base = "https://studyinjapan.go.jp/en/search-for-schools/school_search.php"
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"

res = requests.get(base, params={"lang": "en", "course": "1"}, headers={"User-Agent": UA}, timeout=10)
soup = BeautifulSoup(res.text, "html.parser")

# 1. Print all script content that contains ajax, post, or fetch
print("Scripts with AJAX / post / offset / pagination details:")
for script in soup.find_all("script"):
    src = script.get("src")
    if src:
        print(f"External script: {src}")
    else:
        text = script.get_text()
        if any(w in text.lower() for w in ["ajax", "post", "offset", "page", "search", "click", "function"]):
            # print first 1000 chars of matching inline script
            print(f"Inline script snippet:\n{text[:1000]}\n---")

# 2. Look for any hidden input fields in forms
print("\nForms and input fields:")
for form in soup.find_all("form"):
    print(f"Form action: {form.get('action')}, method: {form.get('method')}")
    for input_el in form.find_all("input"):
        print(f"  Input name: {input_el.get('name')}, type: {input_el.get('type')}, value: {input_el.get('value')}")
