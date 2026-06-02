import requests
import re

url = "https://universitystudy.ca/wp-content/themes/uc-study/assets/dist/js/univstudyapp.js"
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
res = requests.get(url, headers={"User-Agent": UA}, timeout=20)
content = res.text

# Let's search for the hash map:
# e.g., {0:"e6a964bc12cd5dde",44:"190be... or whatever
pos = content.find('assets/dist/js/univstudy/')
if pos != -1:
    print(content[pos:pos+500])
