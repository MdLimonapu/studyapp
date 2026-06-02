import requests
import re

url = "https://universitystudy.ca/wp-content/themes/uc-study/assets/dist/js/univstudy/programs.e6a964bc12cd5dde.js"
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
res = requests.get(url, headers={"User-Agent": UA}, timeout=20)
content = res.text

# Let's search for fetch calls or api calls
matches = list(re.finditer(r"fetch\s*\(", content))
print(f"Total fetch calls: {len(matches)}")
for m in matches:
    idx = m.start()
    print(f"\nPosition {idx}:")
    print(content[max(0, idx-200):min(len(content), idx+300)])
    print("=" * 60)
