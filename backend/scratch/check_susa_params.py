import requests

url = "https://api.skolverket.se/susa-navet/susa-navet-emil3.yaml"
res = requests.get(url, timeout=15)
if res.status_code == 200:
    content = res.text
    # Print lines containing educationEvents parameters
    lines = content.splitlines()
    in_events = False
    for i, line in enumerate(lines):
        if "/educationEvents:" in line:
            in_events = True
            print("Found /educationEvents endpoint section:")
        if in_events and line.startswith("  /"):
            if "/educationEvents:" not in line:
                in_events = False
        if in_events:
            print(line)
else:
    print(f"Failed to fetch YAML, status code: {res.status_code}")
