import urllib.request
import xml.etree.ElementTree as ET
import html
import re
import ssl

ssl._create_default_https_context = ssl._create_unverified_context

url = "https://news.google.com/rss/search?q=student+visa+study+abroad+Germany&hl=en-US&gl=US&ceid=US:en"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req) as response:
    xml_data = response.read()

root = ET.fromstring(xml_data)
for item in root.findall('.//item')[:3]:
    title = item.find('title').text
    desc = item.find('description').text if item.find('description') is not None else ""
    # Clean HTML
    clean_desc = re.sub(r'<[^>]+>', '', desc)
    clean_desc = html.unescape(clean_desc)
    clean_desc = re.sub(r'\s+', ' ', clean_desc).strip()
    print("TITLE:", title)
    print("RAW DESC:", desc[:200])
    print("CLEAN DESC:", clean_desc[:200])
    print("-" * 50)
