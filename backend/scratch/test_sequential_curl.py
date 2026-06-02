import subprocess
import json
import time

url_programs = "https://universitystudy.ca/wp-json/custom/v1/external-api/programs"

for p in range(1, 6):
    payload = {
        "p_number": p,
        "language": "en",
        "site_lang": "en"
    }
    cmd = [
        "curl", "-s", "-X", "POST",
        "-H", "Content-Type: application/json",
        "-H", "Origin: https://universitystudy.ca",
        "-H", "Referer: https://universitystudy.ca/programs/",
        "-d", json.dumps(payload),
        url_programs
    ]
    print(f"Fetching page {p}...")
    try:
        res = subprocess.run(cmd, capture_output=True, text=True, timeout=12)
        if res.returncode == 0:
            data = json.loads(res.stdout)
            print(f"  Success: found {len(data.get('search_results', []))} items")
            if data.get('search_results'):
                print(f"  First: {data['search_results'][0]['program_name']}")
        else:
            print(f"  Failed: returncode {res.returncode}")
    except Exception as e:
        print(f"  Error: {e}")
    time.sleep(2)
