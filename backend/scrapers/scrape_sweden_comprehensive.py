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
BASE_URL = "https://api.skolverket.se/susa-navet/emil3"

def extract_text(value, lang="eng"):
    if not value:
        return ""
    if isinstance(value, str):
        return value.strip()
    if isinstance(value, dict):
        for key in ("value", "name", "title"):
            if key in value:
                return extract_text(value[key], lang)
        strings = value.get("strings") or value.get("urls")
        if isinstance(strings, list):
            for item in strings:
                if item.get("lang") == lang:
                    return extract_text(item.get("value", ""))
            if strings:
                # Fallback to first available language
                return extract_text(strings[0].get("value", ""))
    return ""

def degree_from_title(title):
    value = title.lower()
    if any(k in value for k in ["phd", "doctor", "doctoral"]):
        return "PhD"
    if any(k in value for k in ["master", "msc", "m.sc", "m.a.", "m.s."]):
        return "Master"
    if any(k in value for k in ["bachelor", "bsc", "b.sc", "b.a.", "b.s.", "beng"]):
        return "Bachelor"
    return ""

def main():
    print("🇸🇪 Starting Comprehensive Sweden Skolverket Scraper...")
    
    # 1. Fetch all higher education providers (HS = Högskola/University)
    print("Fetching higher education providers...")
    prov_res = requests.get(f"{BASE_URL}/educationProviders", params={"schoolType": "HS", "size": 250}, timeout=30).json()
    providers = {}
    for p in prov_res.get("educationProviders", []):
        providers[p.get("id")] = p.get("content", {})
    print(f"  Loaded {len(providers)} providers.")

    courses = []
    seen = set()
    fetched_info = {} # Cache for education details
    
    max_pages = 40
    page_size = 100
    
    # 2. Iterate through events
    for page in range(max_pages):
        print(f"Fetching page {page+1} ({page_size} events per page)...")
        try:
            res = requests.get(f"{BASE_URL}/educationEvents", params={"schoolType": "HS", "size": str(page_size), "page": str(page)}, timeout=40)
            if res.status_code != 200:
                print(f"  ⚠️ HTTP {res.status_code}, stopping.")
                break
                
            events = res.json().get("educationEvents", [])
            if not events:
                print("  No more events found. Stopping.")
                break
                
            for event in events:
                content = event.get("content", {})
                edu_id = content.get("education")
                if not edu_id:
                    continue
                
                # Fetch details for this education if not already cached
                if edu_id not in fetched_info:
                    try:
                        info_res = requests.get(f"{BASE_URL}/educationInfos/{urllib.parse.quote(edu_id)}", timeout=20)
                        if info_res.status_code == 200:
                            fetched_info[edu_id] = info_res.json().get("content", {})
                        else:
                            fetched_info[edu_id] = None
                    except Exception:
                        fetched_info[edu_id] = None
                        
                infoc = fetched_info[edu_id]
                if not infoc:
                    continue
                
                # Check for English title
                titles = infoc.get("title", {}).get("strings", [])
                eng_title = next((t.get("value", "") for t in titles if t.get("lang") == "eng"), "")
                
                if not eng_title:
                    # Skip Swedish-only courses
                    continue
                
                degree = degree_from_title(eng_title)
                if not degree:
                    # Attempt to guess from Swedush tags or code
                    levels = [e.get("code", "") for e in infoc.get("educationLevels", [])]
                    if "ISCED_6" in levels or "ISCED_7" in levels:
                        degree = "Master"
                    elif "ISCED_5" in levels:
                        degree = "Bachelor"
                    else:
                        degree = "Bachelor"
                
                provider_id = (content.get("providers") or [""])[0]
                provider = providers.get(provider_id, {})
                uni_name = extract_text(provider.get("name", {}), "eng") or extract_text(provider.get("name", {}), "swe")
                
                # Course deep link URL
                link = extract_text(content.get("url", {}), "eng") or extract_text(content.get("url", {}), "swe")
                if not link:
                    link = extract_text(infoc.get("url", {}), "eng") or extract_text(infoc.get("url", {}), "swe")
                
                if link and not link.startswith(("http://", "https://")):
                    link = "https://" + link
                    
                city = "" # SUSA-navet does not always list city directly in events
                
                key = (uni_name.lower(), eng_title.lower(), degree.lower(), link)
                if uni_name and eng_title and key not in seen:
                    seen.add(key)
                    
                    # Extract tuition fee if available
                    fee = ""
                    for ext in content.get("extensions", []):
                        tuition = ext.get("tuitionFee") or {}
                        if tuition.get("total"):
                            fee = f"SEK {tuition['total']}"
                    
                    courses.append({
                        "country": "Sweden",
                        "uni": uni_name,
                        "course": eng_title,
                        "degree": degree,
                        "city": city,
                        "link": link,
                        "fee": fee,
                        "source": "Skolverket SUSA-navet",
                        "source_url": "https://api.skolverket.se/susa-navet/emil3",
                        "verified_at": TODAY
                    })
            
            print(f"  Found {len(seen)} unique Swedish English-taught courses so far.")
            time.sleep(0.2)
        except Exception as e:
            print(f"  ⚠️ Error: {e}")
            break
            
    # Save to data
    output_path = os.path.join(DATA_DIR, "sweden.json")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(courses, f, indent=2, ensure_ascii=False)
    print(f"Saved {len(courses)} Sweden courses to {output_path}")

if __name__ == "__main__":
    main()
