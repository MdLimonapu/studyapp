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

# 1. GET to get cookies
req_get = urllib.request.Request(url_home, headers={"User-Agent": UA})
cookie_header = ""
try:
    with urllib.request.urlopen(req_get, context=ctx, timeout=15) as response:
        headers = response.info()
        set_cookies = headers.get_all("Set-Cookie") or []
        print(f"Set-Cookie headers count: {len(set_cookies)}")
        cookie_parts = []
        for sc in set_cookies:
            # Extract name=value part
            cookie_parts.append(sc.split(";")[0])
        cookie_header = "; ".join(cookie_parts)
        print(f"Constructed Cookie header: {cookie_header}")
except Exception as e:
    print(f"GET failed: {e}")

# 2. POST with cookies
if cookie_header:
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
            "Content-Type": "application/json",
            "Cookie": cookie_header
        }
    )
    try:
        with urllib.request.urlopen(req_post, context=ctx, timeout=15) as response:
            print(f"POST Status: {response.status}")
            res_data = json.loads(response.read().decode("utf-8"))
            print(f"Pagination: {res_data.get('pagination')}")
            print(f"First result: {res_data.get('search_results', [])[0]['program_name']}")
    except Exception as e:
        print(f"POST Failed: {e}")
