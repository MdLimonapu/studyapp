import subprocess
import json

url_single = "https://universitystudy.ca/wp-json/custom/v1/external-api/programs-single"
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"

payload = {
    "program_id": "33237",
    "site_lang": "en"
}

cmd = [
    "curl", "-s", "-X", "POST",
    "-H", "Content-Type: application/json",
    "-H", "Origin: https://universitystudy.ca",
    "-H", "Referer: https://universitystudy.ca/programs/",
    "-d", json.dumps(payload),
    url_single
]

print("Running curl command using subprocess...")
res = subprocess.run(cmd, capture_output=True, text=True, timeout=15)
print(f"Subprocess return code: {res.returncode}")
if res.returncode == 0:
    try:
        data = json.loads(res.stdout)
        print("Success! Keys in response:")
        print(data.keys())
        print(f"Program: {data['program'][0]['program_name']}")
    except Exception as e:
        print(f"Error parsing JSON: {e}, raw output length: {len(res.stdout)}")
        print(f"Raw output start: {res.stdout[:200]}")
else:
    print(f"Error: stderr={res.stderr}")
