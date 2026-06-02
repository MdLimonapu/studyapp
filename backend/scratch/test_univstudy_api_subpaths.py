import requests

url_programs = "https://universitystudy.ca/wp-json/custom/v1/external-api/programs"
url_search = "https://universitystudy.ca/wp-json/custom/v1/external-api/search"
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"

# Test /programs
res_prog = requests.get(url_programs, headers={"User-Agent": UA}, timeout=10)
print(f"/programs Status: {res_prog.status_code}")
print(f"/programs Content: {res_prog.text[:300]}")

# Test /search
res_search = requests.get(url_search, headers={"User-Agent": UA}, timeout=10)
print(f"/search Status: {res_search.status_code}")
print(f"/search Content: {res_search.text[:300]}")
