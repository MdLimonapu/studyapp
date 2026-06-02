import requests

url_programs = "https://universitystudy.ca/wp-json/custom/v1/external-api/programs"
url_single = "https://universitystudy.ca/wp-json/custom/v1/external-api/programs-single"
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"

headers = {
    "User-Agent": UA,
    "Origin": "https://universitystudy.ca",
    "Referer": "https://universitystudy.ca/programs/"
}

# Fetch page 1 list
res = requests.post(url_programs, headers=headers, json={"p_number": 1, "site_lang": "en"}, timeout=10)
results = res.json().get("search_results", [])

# Let's get details for the first 5 programs
for item in results[:5]:
    prog_id = item.get("id")
    name = item.get("program_name")
    uni = item.get("university")
    
    # Get single details
    res_s = requests.post(url_single, headers=headers, json={"program_id": prog_id, "site_lang": "en"}, timeout=10)
    s_data = res_s.json()
    prog_detail = s_data.get("program", [{}])[0]
    uni_detail = s_data.get("university", [{}])[0]
    
    p_url = prog_detail.get("program_url")
    u_url = uni_detail.get("url")
    fees = uni_detail.get("tuition_fees", {})
    
    print(f"ID: {prog_id}")
    print(f"  Program: {name}")
    print(f"  University: {uni}")
    print(f"  Program URL: {p_url}")
    print(f"  University URL: {u_url}")
    print(f"  Fees: {fees}")
    print("-" * 40)
