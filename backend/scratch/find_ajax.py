import requests
import re

url = "https://universitystudy.ca/wp-content/themes/uc-study/assets/dist/js/univstudyapp.js"
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
res = requests.get(url, headers={"User-Agent": UA}, timeout=20)
content = res.text

# Let's search for keywords in the JS file
keywords = ["url", "ajax", "post", "get", "data", "query", "search", "page", "page_size", "limit", "programs", "schools", "external-api", "headers"]
for kw in keywords:
    matches = [m.start() for m in re.finditer(re.escape(kw), content, re.IGNORECASE)]
    print(f"Keyword '{kw}': {len(matches)} occurrences")

# Find occurrences of '/programs' or 'programs' near ajax or API calls
for m in re.finditer(r"programs|schools|external-api", content, re.IGNORECASE):
    idx = m.start()
    print(f"\nContext around {content[idx:idx+15]} at {idx}:")
    print(content[max(0, idx-100):min(len(content), idx+150)])
    print("-" * 50)
