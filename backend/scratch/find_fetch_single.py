import requests
import re

url = "https://universitystudy.ca/wp-content/themes/uc-study/assets/dist/js/univstudy/program-single.d2e9c16c9f34fb93.js"
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
res = requests.get(url, headers={"User-Agent": UA}, timeout=20)
content = res.text

# Find occurrences of fetch or api or POST/GET
print(f"JS Length: {len(content)}")
matches = list(re.finditer(r"fetch\s*\(", content))
print(f"Total fetch calls: {len(matches)}")
for m in matches:
    idx = m.start()
    print(f"\nPosition {idx}:")
    print(content[max(0, idx-250):min(len(content), idx+300)])
    print("=" * 60)
