import requests
import re

url = "https://universitystudy.ca/wp-content/themes/uc-study/assets/dist/js/univstudy/programs.e6a964bc12cd5dde.js"
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
res = requests.get(url, headers={"User-Agent": UA}, timeout=20)
content = res.text

print(f"JS Length: {len(content)}")
# Let's search for keywords like page, limit, pagination, post, headers, external-api
keywords = ["page", "page_number", "pageNumber", "keyword", "limit", "pageSize", "page_size", "post", "payload", "body:", "JSON.stringify"]
for kw in keywords:
    matches = [m.start() for m in re.finditer(re.escape(kw), content, re.IGNORECASE)]
    print(f"Keyword '{kw}': {len(matches)} occurrences")

# Find occurrences of '/programs' or 'external-api'
for m in re.finditer(r"programs|schools|external-api", content, re.IGNORECASE):
    idx = m.start()
    print(f"\nContext around {content[idx:idx+15]} at {idx}:")
    print(content[max(0, idx-100):min(len(content), idx+150)])
    print("-" * 50)
