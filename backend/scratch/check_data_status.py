import os
import json

DATA_DIR = "/Users/mdlimonapu/studyapp/backend/data"

for filename in sorted(os.listdir(DATA_DIR)):
    if not filename.endswith(".json") or filename == "resolved_links_cache.json":
        continue
    filepath = os.path.join(DATA_DIR, filename)
    try:
        with open(filepath, "r") as f:
            courses = json.load(f)
        
        unis = set()
        google_redirects = 0
        direct_links = 0
        invalid_links = 0
        with_fees = 0
        
        for c in courses:
            unis.add(c.get("uni"))
            link = c.get("link", "")
            fee = c.get("fee")
            if fee:
                with_fees += 1
            if not link:
                invalid_links += 1
            elif "google.com" in link:
                google_redirects += 1
            else:
                direct_links += 1
                
        print(f"📊 {filename.upper()}:")
        print(f"   Courses: {len(courses)}")
        print(f"   Universities: {len(unis)}")
        print(f"   Direct links: {direct_links} ({direct_links/len(courses)*100:.1f}%)")
        print(f"   Google redirects: {google_redirects}")
        print(f"   Invalid links: {invalid_links}")
        print(f"   With fees: {with_fees} ({with_fees/len(courses)*100:.1f}%)")
        print("-" * 40)
    except Exception as e:
        print(f"❌ Error reading {filename}: {e}")
