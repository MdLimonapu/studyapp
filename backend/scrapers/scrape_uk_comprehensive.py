#!/usr/bin/env python3
import requests
import json
import os
import re
import urllib.parse
from datetime import date

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DATA_DIR = os.path.join(ROOT, "data")
TODAY = date.today().isoformat()

FIELDS = [
    "Computer Science", "Software Engineering", "Data Science", "Artificial Intelligence",
    "Cybersecurity", "Information Technology", "Electrical Engineering", "Electronic Engineering",
    "Mechanical Engineering", "Civil Engineering", "Chemical Engineering", "Biomedical Engineering",
    "Environmental Engineering", "Business Administration", "Finance", "Economics", "Management",
    "Physics", "Chemistry", "Biology", "Mathematics", "Medicine", "Law", "Psychology",
    "Architecture", "Media"
]

def degree_from_title(title, level=""):
    value = f"{title} {level}".lower()
    if any(k in value for k in ["phd", "doctor", "doctoral"]):
        return "PhD"
    if any(k in value for k in ["master", "msc", "m.sc", "m.a.", "m.s.", "postgraduate"]):
        return "Master"
    if any(k in value for k in ["bachelor", "bsc", "b.sc", "b.a.", "b.s.", "beng", "undergraduate"]):
        return "Bachelor"
    return "Bachelor" # Default to Bachelor for undergraduate courses

def main():
    print("🇬🇧 Starting Comprehensive UCAS Scraper...")
    app_id = "Y3QRV216KL"
    api_key = "c0f72e5c62250ac258c2cf4a3896c19d"
    endpoint = f"https://{app_id}-dsn.algolia.net/1/indexes/*/queries"
    
    courses = []
    seen = set()
    
    for field in FIELDS:
        print(f"Querying field: '{field}'...")
        # Fetch up to 1000 hits per query
        params = urllib.parse.urlencode({"query": field, "hitsPerPage": 1000, "filters": "academicYearId:2026"})
        payload = {"requests": [{"indexName": "d10prod_courses_new", "params": params}]}
        headers = {
            "X-Algolia-API-Key": api_key,
            "X-Algolia-Application-Id": app_id,
            "User-Agent": "Mozilla/5.0"
        }
        
        try:
            res = requests.post(endpoint, json=payload, headers=headers, timeout=25)
            res.raise_for_status()
            
            hits = res.json()["results"][0].get("hits", [])
            print(f"  Received {len(hits)} hits for '{field}'.")
            
            for hit in hits:
                provider = hit.get("provider") or {}
                uni_name = provider.get("name", "")
                title = hit.get("courseTitle") or ""
                course_id = hit.get("courseId") or hit.get("objectID", "")
                slug = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-") or "course"
                
                # UCAS deep link format
                link = f"https://www.ucas.com/explore/courses/{course_id}/{slug}?studyYear={hit.get('academicYearId', '2026')}"
                
                degree = degree_from_title(title, hit.get("studyLevel", ""))
                city = (hit.get("location") or {}).get("townOrCity", provider.get("townOrCity", ""))
                
                key = (uni_name.lower(), title.lower(), degree.lower())
                if uni_name and title and key not in seen:
                    seen.add(key)
                    courses.append({
                        "country": "UK",
                        "uni": uni_name,
                        "course": title,
                        "degree": degree,
                        "city": city,
                        "link": link,
                        "fee": "",
                        "source": "UCAS course search",
                        "source_url": "https://www.ucas.com/explore/search/courses",
                        "verified_at": TODAY
                    })
        except Exception as e:
            print(f"  ⚠️ Error querying '{field}': {e}")
            
    print(f"\nTotal unique UK courses scraped: {len(courses)}")
    
    # Save to data directory
    output_path = os.path.join(DATA_DIR, "uk.json")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(courses, f, indent=2, ensure_ascii=False)
    print(f"Saved to {output_path}")

if __name__ == "__main__":
    main()
