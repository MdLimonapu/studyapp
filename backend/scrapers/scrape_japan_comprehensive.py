#!/usr/bin/env python3
import requests
import json
import os
import time
import urllib.parse
from datetime import date

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DATA_DIR = os.path.join(ROOT, "data")
TODAY = date.today().isoformat()
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"

def main():
    print("🇯🇵 Starting Comprehensive Study in Japan Scraper...")
    base = "https://studyinjapan.go.jp/en/search-for-schools/school_search.php"
    courses = []
    seen = set()
    page = 0
    
    while True:
        offset = page * 25
        print(f"Fetching page {page+1} (offset {offset})...")
        go_val = "go" if page == 0 else "ofs"
        params = {"lang": "en", "limit": "25", "offset": str(offset), "go": go_val, "course": "1"}
        
        try:
            res = requests.get(base, params=params, headers={"User-Agent": UA}, timeout=30)
            res.raise_for_status()
            
            from bs4 import BeautifulSoup
            soup = BeautifulSoup(res.text, "html.parser")
            items = soup.select("a.school-result-item")
            
            if not items:
                print(f"No results found on page {page+1}. Stopping.")
                break
                
            new_added = 0
            for item in items:
                href = urllib.parse.urljoin("https://studyinjapan.go.jp", item.get("href", ""))
                name_el = item.select_one(".school-name") or item.select_one("h3") or item
                uni_name = name_el.get_text(" ", strip=True)
                
                meta = item.get_text(" ", strip=True)
                degree = "Bachelor" if "Undergraduate" in meta else "Master" if "Graduate" in meta else "Bachelor"
                
                # Check for other degree levels mentioned in tags
                if "Doctor" in meta or "Ph.D" in meta or "PhD" in meta:
                    degree = "PhD"
                
                # Deduplicate
                key = (uni_name.lower(), degree.lower(), href.lower())
                if uni_name and key not in seen:
                    seen.add(key)
                    courses.append({
                        "country": "Japan",
                        "uni": uni_name,
                        "course": f"{degree} Program" if degree != "PhD" else "PhD Program",
                        "degree": degree,
                        "city": "", # Will be filled or empty
                        "link": href,
                        "fee": "",
                        "source": "Study in Japan official school search",
                        "source_url": res.url,
                        "verified_at": TODAY
                    })
                    new_added += 1
            
            print(f"  Added {new_added} new items (Total unique Japan courses: {len(courses)})")
            if new_added == 0:
                print("No new courses found on this page. Stopping.")
                break
                
            page += 1
            time.sleep(0.25)
        except Exception as e:
            print(f"  ⚠️ Error on page {page+1}: {e}")
            break
            
    # Save to data folder
    output_path = os.path.join(DATA_DIR, "japan.json")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(courses, f, indent=2, ensure_ascii=False)
    print(f"Saved {len(courses)} Japan courses to {output_path}")

if __name__ == "__main__":
    main()
