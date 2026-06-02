import requests
import re

url = "https://universitystudy.ca/wp-content/themes/uc-study/assets/dist/js/univstudyapp.js"
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"

res = requests.get(url, headers={"User-Agent": UA}, timeout=20)
content = res.text

# Let's search for fetch calls
matches = re.finditer(r"fetch\s*\(", content)
print("Fetch calls:")
for m in list(matches)[:10]:
    start = max(0, m.start() - 100)
    end = min(len(content), m.end() + 150)
    print(f"Position {m.start()}:\n{content[start:end]}\n---")
