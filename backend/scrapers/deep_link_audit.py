import os
import json
import urllib.request
import urllib.error
import urllib.parse
from concurrent.futures import ThreadPoolExecutor, as_completed
import ssl
import argparse
import socket
import time
import re

DATA_DIR = "/Users/mdlimonapu/studyapp/backend/data"
TIMEOUT = 10.0
MAX_WORKERS = 40

ssl_context = ssl._create_unverified_context()

def get_homepage_url(url):
    try:
        parsed = urllib.parse.urlparse(url)
        if parsed.scheme and parsed.netloc:
            return f"{parsed.scheme}://{parsed.netloc}"
    except Exception:
        pass
    return url

def test_url(url):
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": "https://www.google.com/"
    }
    
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=TIMEOUT, context=ssl_context) as response:
            status = response.getcode()
            if 200 <= status < 400:
                # Detect soft-404s by inspecting the HTML body
                content_type = response.headers.get("Content-Type", "")
                if "text/html" in content_type.lower():
                    html_bytes = response.read(8192)
                    html_text = html_bytes.decode("utf-8", errors="ignore").lower()
                    soft_404_markers = [
                        "page not found", "seite nicht gefunden", 
                        "no site configuration found", "404 - file or directory not found",
                        "<title>404", "error 404"
                    ]
                    if any(marker in html_text for marker in soft_404_markers):
                        return url, False, "Soft 404 (Page Not Found in HTML content)"
                return url, True, f"HTTP {status}"
            return url, False, f"HTTP {status}"
    except urllib.error.HTTPError as e:
        if e.code in [404, 410]:
            return url, False, f"HTTP {e.code}"
        else:
            return url, True, f"HTTP {e.code} (Assumed valid to prevent false positive)"
    except urllib.error.URLError as e:
        reason_str = str(e.reason)
        if isinstance(e.reason, socket.timeout):
            return url, False, "Timeout"
        if "timed out" in reason_str.lower():
            return url, False, "Timeout"
        if "name or service not known" in reason_str.lower() or "nodename nor servname provided" in reason_str.lower():
            return url, False, "DNS Lookup Failed"
        if "connection refused" in reason_str.lower():
            return url, False, "Connection Refused"
        return url, False, f"URL Error: {reason_str}"
    except socket.timeout:
        return url, False, "Timeout"
    except Exception as e:
        return url, False, f"Exception: {str(e)}"

def test_url_with_retry(url):
    for attempt in range(3):
        url, is_valid, reason = test_url(url)
        if is_valid:
            return url, True, reason
        # Do not retry on definite 404, 410, DNS, or soft 404 failures
        if "HTTP 404" in reason or "HTTP 410" in reason or "DNS Lookup Failed" in reason or "Soft 404" in reason:
            return url, False, reason
        time.sleep(1.0 * (attempt + 1))
    return url, False, reason

def main():
    parser = argparse.ArgumentParser(description="Deep Link Audit & Healing")
    parser.add_argument("--test-sample", action="store_true", help="Test a small sample of 50 links")
    args = parser.parse_args()

    print("🚀 Starting Deep Link Audit and Healing Protocol (Robust Mode with Soft-404 Detection)...")
    
    unique_links = set()
    sample_links = []
    
    for filename in sorted(os.listdir(DATA_DIR)):
        if not filename.endswith(".json") or filename in ["news_cache.json", "resolved_links_cache.json", "source_manifest.json"]:
            continue
        filepath = os.path.join(DATA_DIR, filename)
        with open(filepath, 'r', encoding='utf-8') as f:
            courses = json.load(f)
        for item in courses:
            link = item.get("link")
            if link:
                unique_links.add(link)
                if args.test_sample and filename == "germany.json" and len(sample_links) < 50:
                    sample_links.append(link)

    if args.test_sample:
        links_to_test = list(set(sample_links[:50]))
        print(f"🧪 Test mode active. Testing {len(links_to_test)} sample links from Germany...")
    else:
        links_to_test = list(unique_links)
        print(f"📊 Found {len(links_to_test)} unique links to check. Starting audit with {MAX_WORKERS} workers...")

    # 2. Audit
    link_results = {}
    checked_count = 0
    total_to_test = len(links_to_test)
    
    with ThreadPoolExecutor(max_workers=MAX_WORKERS if not args.test_sample else 5) as executor:
        futures = {executor.submit(test_url_with_retry, url): url for url in links_to_test}
        for future in as_completed(futures):
            url, is_valid, reason = future.result()
            link_results[url] = (is_valid, reason)
            checked_count += 1
            if args.test_sample:
                status_str = "✅ VALID" if is_valid else "❌ BROKEN"
                print(f"  [{status_str}] {url} -> {reason}")
            elif checked_count % 500 == 0 or checked_count == total_to_test:
                valid_cnt = sum(1 for val in link_results.values() if val[0])
                broken_cnt = total_to_test - valid_cnt
                print(f"  Audit Progress: {checked_count}/{total_to_test} links tested. Valid: {valid_cnt}, Broken: {broken_cnt}")

    # 3. Create mapping
    healed_mapping = {}
    fallback_count = 0
    for url, (is_valid, reason) in link_results.items():
        if is_valid:
            healed_mapping[url] = url
        else:
            homepage = get_homepage_url(url)
            healed_mapping[url] = homepage
            if homepage != url:
                fallback_count += 1

    print(f"\n==================================================")
    print(f"📊 AUDIT REPORT SUMMARY:")
    print(f"  - Total unique links tested: {total_to_test}")
    print(f"  - Valid direct links: {sum(1 for val in link_results.values() if val[0])}")
    print(f"  - Broken/unreachable direct links: {sum(1 for val in link_results.values() if not val[0])}")
    print(f"  - Redirected to university homepage: {fallback_count}")
    print(f"==================================================")

    if args.test_sample:
        print("🧪 Test sample run complete. No files modified in test mode.")
        return

    # 4. Apply
    print("\n💾 Updating database files with healed links...")
    total_updated_courses = 0
    
    for filename in os.listdir(DATA_DIR):
        if not filename.endswith(".json") or filename in ["news_cache.json", "resolved_links_cache.json", "source_manifest.json"]:
            continue
        filepath = os.path.join(DATA_DIR, filename)
        with open(filepath, 'r', encoding='utf-8') as f:
            courses = json.load(f)
            
        modified = False
        for item in courses:
            link = item.get("link")
            if link in healed_mapping:
                healed_link = healed_mapping[link]
                if link != healed_link:
                    item["link"] = healed_link
                    total_updated_courses += 1
                    modified = True
                    
        if modified:
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(courses, f, indent=2, ensure_ascii=False)
            print(f"  ✓ Healed database file: {filename}")

    print(f"\n✅ All database files successfully healed! Updated {total_updated_courses} course entries.")

if __name__ == "__main__":
    main()
