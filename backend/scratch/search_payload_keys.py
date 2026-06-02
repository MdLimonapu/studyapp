import requests
import re

url = "https://universitystudy.ca/wp-content/themes/uc-study/assets/dist/js/univstudyapp.js"
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"

res = requests.get(url, headers={"User-Agent": UA}, timeout=20)
content = res.text

# Let's search for keywords inside the JS
keywords = ["page", "page_number", "pageNumber", "keyword", "search", "limit", "pageSize", "page_size", "province", "language"]
print("Matching snippets:")
for kw in keywords:
    pos = 0
    matches = 0
    while True:
        pos = content.find(kw, pos)
        if pos == -1 or matches >= 5:
            break
        # Print surrounding context if it looks like an object key, e.g., "keyword:" or keyword: or "page":
        context = content[max(0, pos-40):min(len(content), pos+40)]
        if ":" in context:
            print(f"  Keyword '{kw}': ... {context.strip()} ...")
            matches += 1
        pos += len(kw)
