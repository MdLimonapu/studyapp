import requests
import re

url = "https://universitystudy.ca/wp-content/themes/uc-study/assets/dist/js/univstudyapp.js"
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"

res = requests.get(url, headers={"User-Agent": UA}, timeout=20)
if res.status_code == 200:
    content = res.text
    print(f"JS length: {len(content)} characters.")
    # Find index of wp-json
    pos = 0
    while True:
        pos = content.find("wp-json", pos)
        if pos == -1:
            break
        print(f"\nFound wp-json at position {pos}:")
        start = max(0, pos - 150)
        end = min(len(content), pos + 150)
        print(content[start:end])
        pos += len("wp-json")
else:
    print(f"Failed to fetch JS, status: {res.status_code}")
