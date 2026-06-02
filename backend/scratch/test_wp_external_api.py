import requests

url_programs = "https://universitystudy.ca/wp-json/custom/v1/external-api/programs"
url_schools = "https://universitystudy.ca/wp-json/custom/v1/external-api/schools"
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"

# Test POST to /programs with referer headers
headers = {
    "User-Agent": UA,
    "Origin": "https://universitystudy.ca",
    "Referer": "https://universitystudy.ca/programs/"
}
res_prog = requests.post(url_programs, headers=headers, timeout=10)
print(f"/programs POST Status: {res_prog.status_code}")
try:
    res_data = res_prog.json()
    print(f"Keys: {res_data.keys()}")
    if "pagination" in res_data:
        print(f"Pagination: {res_data['pagination']}")
    if "search_results" in res_data:
        sr = res_data["search_results"]
        print(f"search_results type: {type(sr)}")
        if isinstance(sr, list):
            print(f"Found {len(sr)} search results.")
            if sr:
                print(f"First search result item keys: {sr[0].keys()}")
                print(f"First search result item: {sr[0]}")
        elif isinstance(sr, dict):
            print(f"search_results keys: {sr.keys()}")
except Exception as e:
    print(f"Error parsing json: {e}, text: {res_prog.text[:300]}")

# Test POST to /schools
res_school = requests.post(url_schools, headers={"User-Agent": UA}, timeout=10)
print(f"/schools POST Status: {res_school.status_code}")
try:
    print(res_school.json()[:3] if isinstance(res_school.json(), list) else str(res_school.json())[:300])
except Exception as e:
    print(f"Error parsing json: {e}, text: {res_school.text[:300]}")
