import requests
import re

url = "https://universitystudy.ca/wp-content/themes/uc-study/assets/dist/js/univstudy/programs.e6a964bc12cd5dde.js"
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
res = requests.get(url, headers={"User-Agent": UA}, timeout=20)
content = res.text

idx = 76697
print(content[idx-1000:idx+200])
