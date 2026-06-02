import urllib.request
import urllib.parse
import json
import ssl

url_home = "https://universitystudy.ca/programs/"
url_programs = "https://universitystudy.ca/wp-json/custom/v1/external-api/programs"
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

print("1. Testing GET using urllib...")
req = urllib.request.Request(url_home, headers={"User-Agent": UA})
try:
    with urllib.request.urlopen(req, context=ctx, timeout=15) as response:
        print(f"GET Status: {response.status}")
        cookies = response.headers.get("Set-Cookie")
        print(f"Set-Cookie header: {cookies}")
except Exception as e:
    print(f"GET Failed: {e}")

print("\n2. Testing POST using urllib...")
payload = {
    "p_number": 1,
    "language": "en",
    "site_lang": "en"
}
data_bytes = json.dumps(payload).encode("utf-8")
req_post = urllib.request.Request(
    url_programs, 
    data=data_bytes,
    headers={
        "User-Agent": UA,
        "Origin": "https://universitystudy.ca",
        "Referer": "https://universitystudy.ca/programs/",
        "Content-Type": "application/json"
    }
)
try:
    with urllib.request.urlopen(req_post, context=ctx, timeout=15) as response:
        print(f"POST Status: {response.status}")
        res_data = json.loads(response.read().decode("utf-8"))
        print(f"Pagination: {res_data.get('pagination')}")
except Exception as e:
    print(f"POST Failed: {e}")
