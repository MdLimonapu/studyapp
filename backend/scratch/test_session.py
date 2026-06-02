import requests

url_home = "https://universitystudy.ca/programs/"
url_programs = "https://universitystudy.ca/wp-json/custom/v1/external-api/programs"
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

session = requests.Session()
session.headers.update({
    "User-Agent": UA,
    "Origin": "https://universitystudy.ca",
    "Referer": "https://universitystudy.ca/programs/",
    "Accept": "application/json, text/plain, */*"
})

print("1. Making GET request to home page to obtain Cloudflare cookies...")
res_home = session.get(url_home, timeout=20)
print(f"Home page status: {res_home.status_code}")
print(f"Cookies obtained: {session.cookies.get_dict()}")

print("\n2. Making POST request to programs API...")
payload = {
    "p_number": 1,
    "language": "en",
    "site_lang": "en"
}
try:
    res = session.post(url_programs, json=payload, timeout=20)
    print(f"Programs API status: {res.status_code}")
    print(f"Pagination: {res.json().get('pagination')}")
except Exception as e:
    print(f"Failed: {e}")
