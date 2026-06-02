import requests

url = "https://universitystudy.ca/wp-json/custom/v1/external-api"
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"

# Let's test a simple GET request
res = requests.get(url, headers={"User-Agent": UA}, timeout=15)
print(f"GET Status: {res.status_code}")
try:
    print(res.json()[:3] if isinstance(res.json(), list) else str(res.json())[:300])
except Exception as e:
    print(f"Error parsing json: {e}, text sample: {res.text[:300]}")

# Let's test a POST request
res_post = requests.post(url, headers={"User-Agent": UA}, timeout=15)
print(f"POST Status: {res_post.status_code}")
try:
    print(res_post.json()[:3] if isinstance(res_post.json(), list) else str(res_post.json())[:300])
except Exception as e:
    print(f"Error parsing json: {e}, text sample: {res_post.text[:300]}")
