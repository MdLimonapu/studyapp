import json
import urllib.request
import urllib.error
import ssl
from concurrent.futures import ThreadPoolExecutor, as_completed

def check_url(url):
    # Ignore ssl verification for speed and safety
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
    
    req = urllib.request.Request(url, headers=headers)
    try:
        # Use HEAD request for speed
        req.get_method = lambda: 'HEAD'
        with urllib.request.urlopen(req, timeout=5, context=ctx) as response:
            return url, response.status, None
    except urllib.error.HTTPError as e:
        # If HEAD fails, try GET to make sure it's actually a 404
        try:
            req.get_method = lambda: 'GET'
            with urllib.request.urlopen(req, timeout=5, context=ctx) as response:
                return url, response.status, None
        except urllib.error.HTTPError as e2:
            return url, e2.code, str(e2.reason)
        except Exception as e2:
            return url, 999, str(e2)
    except Exception as e:
        return url, 999, str(e)

def main():
    print("Loading canada.json...")
    with open('/Users/mdlimonapu/studyapp/backend/data/canada.json', 'r') as f:
        data = json.load(f)
        
    urls = set()
    url_to_unis = {}
    for entry in data:
        link = entry.get('link')
        uni = entry.get('uni')
        if link:
            urls.add(link)
            url_to_unis.setdefault(link, set()).add(uni)
            
    print(f"Found {len(urls)} distinct links to check. Running checks concurrently...")
    
    broken = []
    with ThreadPoolExecutor(max_workers=20) as executor:
        futures = {executor.submit(check_url, url): url for url in urls}
        for future in as_completed(futures):
            url = futures[future]
            try:
                url, status, err = future.result()
                if status >= 400:
                    broken.append((url, status, err))
                    print(f"❌ Broken: {url} | Status: {status} | Error: {err} | Unis: {url_to_unis[url]}")
                else:
                    pass
            except Exception as e:
                broken.append((url, 999, str(e)))
                print(f"❌ Exception checking: {url} | {e}")
                
    print("\n--- Summary ---")
    print(f"Total checked: {len(urls)}")
    print(f"Total broken/invalid: {len(broken)}")
    
    # Save results to a text file
    with open('/Users/mdlimonapu/studyapp/backend/data/broken_canada_links.json', 'w') as out:
        json.dump(broken, out, indent=2)

if __name__ == '__main__':
    main()
