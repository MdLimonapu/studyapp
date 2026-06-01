#!/usr/bin/env python3
import requests
import json
import os
import time
from datetime import date

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DATA_DIR = os.path.join(ROOT, "data")
TODAY = date.today().isoformat()
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"

def main():
    print("🇨🇭 Starting Comprehensive Switzerland studyprogrammes.ch Scraper...")
    url = "https://api.studyprogrammes.ch/list_studyprogrammes"
    courses = []
    seen = set()
    
    # We saw total page count is 220
    total_pages = 220
    
    for page in range(1, total_pages + 1):
        print(f"Fetching page {page}/{total_pages}...")
        try:
            res = requests.get(url, params={"page": page}, headers={"User-Agent": UA, "Origin": "https://studyprogrammes.ch"}, timeout=40)
            res.raise_for_status()
            
            items = res.json().get("data", [])
            if not items:
                break
                
            page_added = 0
            for item in items:
                lang = item.get("language", "").lower()
                # We filter for English ('en') taught programmes
                if lang != "en":
                    continue
                    
                title = item.get("name", "")
                inst = item.get("institute", {})
                uni_name = inst.get("name", "")
                level_obj = item.get("degree_level", {})
                level_name = level_obj.get("name", "") if level_obj else ""
                
                # Assign degree level
                degree = "Bachelor" if "bachelor" in level_name.lower() else "Master" if "master" in level_name.lower() else "Bachelor"
                if "doctor" in level_name.lower() or "phd" in level_name.lower():
                    degree = "PhD"
                    
                city = item.get("location", "")
                link = f"https://studyprogrammes.ch/en/studyprogramme/{item.get('id')}"
                
                key = (uni_name.lower(), title.lower(), degree.lower(), link)
                if uni_name and title and key not in seen:
                    seen.add(key)
                    courses.append({
                        "country": "Switzerland",
                        "uni": uni_name,
                        "course": title,
                        "degree": degree,
                        "city": city,
                        "link": link,
                        "fee": "",
                        "source": "swissuniversities studyprogrammes.ch",
                        "source_url": f"https://studyprogrammes.ch/en/studyprogramme/{item.get('id')}",
                        "verified_at": TODAY
                    })
                    page_added += 1
            
            print(f"  Added {page_added} English courses on page {page}. Total Swiss courses: {len(courses)}")
            time.sleep(0.1)
        except Exception as e:
            print(f"  ⚠️ Error on page {page}: {e}")
            time.sleep(2)
            
    # Save to data directory
    output_path = os.path.join(DATA_DIR, "switzerland.json")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(courses, f, indent=2, ensure_ascii=False)
    print(f"Saved {len(courses)} Switzerland English courses to {output_path}")

if __name__ == "__main__":
    main()
