import requests

url = "https://universitystudy.ca/wp-json"
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"

res = requests.get(url, headers={"User-Agent": UA}, timeout=15)
if res.status_code == 200:
    data = res.json()
    routes = data.get("routes", {})
    print("Registered routes containing 'custom':")
    found = False
    for route in routes:
        if "custom" in route:
            print(f"  Route: {route}")
            print(f"    Methods: {routes[route].get('methods')}")
            found = True
    if not found:
        print("  No custom routes found.")
else:
    print(f"Failed to fetch WordPress API index, status: {res.status_code}")
