import os
import json
import urllib.request
import urllib.parse
from concurrent.futures import ThreadPoolExecutor, as_completed
import socket
import ssl

DATA_DIR = "/Users/mdlimonapu/studyapp/backend/data"
TIMEOUT = 3.0
MAX_WORKERS = 60

# Unverified SSL context to prevent failing on bad/expired certificates
ssl_context = ssl._create_unverified_context()

def check_single_url(uni_name, url):
    """Pings a single URL and returns status. (True if online, False if broken)"""
    try:
        req = urllib.request.Request(
            url, 
            headers={"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"}
        )
        # Use HTTP GET/HEAD request with timeout
        with urllib.request.urlopen(req, timeout=TIMEOUT, context=ssl_context) as response:
            status = response.getcode()
            # If 200-399, it is online
            if 200 <= status < 400:
                return uni_name, url, True
            else:
                return uni_name, url, False
    except Exception:
        # Timeout, DNS resolution failure, SSL errors, 404, etc.
        return uni_name, url, False

def main():
    print("🚀 Starting University Domain Health Scan...")
    
    # 1. Gather all unique universities and their links
    uni_links = {}
    for filename in os.listdir(DATA_DIR):
        if not filename.endswith(".json") or filename in ["news_cache.json", "resolved_links_cache.json", "source_manifest.json"]:
            continue
        filepath = os.path.join(DATA_DIR, filename)
        with open(filepath, 'r', encoding='utf-8') as f:
            courses = json.load(f)
        for item in courses:
            uni = item.get("uni")
            link = item.get("link")
            if uni and link:
                uni_links[uni] = link

    total_unis = len(uni_links)
    print(f"🔍 Found {total_unis} unique university domains. Beginning parallel checks...")

    # 2. Parallel Ping
    broken_unis = {}
    checked_count = 0
    
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = {executor.submit(check_single_url, uni, url): uni for uni, url in uni_links.items()}
        
        for future in as_completed(futures):
            uni_name, url, is_online = future.result()
            checked_count += 1
            if not is_online:
                broken_unis[uni_name] = url
                
            if checked_count % 100 == 0 or checked_count == total_unis:
                print(f"  Pinger progress: {checked_count}/{total_unis} checked. Broken detected so far: {len(broken_unis)}")

    print(f"\n==================================================")
    print(f"📊 HEALTH REPORT: {len(broken_unis)} / {total_unis} domains are unreachable (DNS error, timeout, or 404).")
    print(f"==================================================")

    # 3. Auto-Heal Databases: For unreachable domains, swap URL with fallback Google Search
    if broken_unis:
        print("\n🏥 Auto-healing broken links with search queries...")
        healed_count = 0
        
        for filename in os.listdir(DATA_DIR):
            if not filename.endswith(".json") or filename in ["news_cache.json", "resolved_links_cache.json", "source_manifest.json"]:
                continue
            filepath = os.path.join(DATA_DIR, filename)
            with open(filepath, 'r', encoding='utf-8') as f:
                courses = json.load(f)
                
            modified = False
            for item in courses:
                uni = item.get("uni")
                if uni in broken_unis:
                    query = f"{uni} official website"
                    fallback_url = f"https://www.google.com/search?q={urllib.parse.quote_plus(query)}"
                    item["link"] = fallback_url
                    healed_count += 1
                    modified = True
                    
            if modified:
                with open(filepath, 'w', encoding='utf-8') as f:
                    json.dump(courses, f, indent=2, ensure_ascii=False)
                print(f"  ✓ Saved auto-healed courses in {filename}")
                
        print(f"Successfully auto-healed {healed_count} course entries across databases!")
    else:
        print("\n✅ All domains are online! No healing needed.")

if __name__ == "__main__":
    main()
