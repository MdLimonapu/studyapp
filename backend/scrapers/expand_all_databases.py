#!/usr/bin/env python3
import json
import os
import re
from datetime import date

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DATA_DIR = os.path.join(ROOT, "data")
BACKUP_DIR = os.path.join(ROOT, "data_backup")
HIPO_PATH = os.path.join(ROOT, "scrapers", "hipo_cache.json")
TODAY = date.today().isoformat()

COUNTRY_MAPPING = {
    "United States": "usa",
    "United Kingdom": "uk",
    "Canada": "canada",
    "Australia": "australia",
    "Germany": "germany",
    "France": "france",
    "Netherlands": "netherlands",
    "Switzerland": "switzerland",
    "Sweden": "sweden",
    "Japan": "japan"
}

FIELDS = [
    "Computer Science", "Data Science", "Software Engineering", "Artificial Intelligence",
    "Cybersecurity", "Information Technology", "Electrical Engineering", "Mechanical Engineering",
    "Civil Engineering", "Biomedical Engineering", "Business Administration", "Finance",
    "Marketing", "Economics", "Psychology", "Nursing", "Architecture"
]

# Quick city matching fallback by country
FALLBACK_CITIES = {
    "usa": "Washington",
    "uk": "London",
    "canada": "Ottawa",
    "australia": "Canberra",
    "germany": "Berlin",
    "france": "Paris",
    "netherlands": "Amsterdam",
    "switzerland": "Bern",
    "sweden": "Stockholm",
    "japan": "Tokyo"
}

def guess_city(name, country_code):
    # Extract from names like "University of Oxford" -> Oxford
    match = re.search(r"University of ([A-Za-z\s]+)", name)
    if match:
        city = match.group(1).strip()
        if city not in ["Applied Sciences", "Technology", "the Arts"]:
            return city
    match = re.search(r"([A-Za-z\s]+) University", name)
    if match:
        return match.group(1).strip().split()[-1]
    return FALLBACK_CITIES.get(country_code, "Main Campus")

def get_degree_title(degree, field):
    if field == "Business Administration":
        return "Master of Business Administration (MBA)" if degree == "Master" else "Bachelor of Business Administration (BBA)"
    elif field in ["Nursing", "Psychology"]:
        return f"MSc in {field}" if degree == "Master" else f"BSc in {field}"
    elif "Engineering" in field:
        return f"MEng in {field}" if degree == "Master" else f"BEng in {field}"
    return f"MSc in {field}" if degree == "Master" else f"BSc in {field}"

def main():
    print("🌍 Starting Global Course Database Expansion...")

    # Load sitemap/hipo cache
    if not os.path.exists(HIPO_PATH):
        print(f"❌ Error: {HIPO_PATH} not found.")
        return

    with open(HIPO_PATH, "r") as f:
        hipo_data = json.load(f)
    print(f"Loaded {len(hipo_data)} universities from sitemap/hipo list.")

    # Group Hipo unis by country
    unis_by_country = {}
    for item in hipo_data:
        c = item.get("country")
        if c in COUNTRY_MAPPING:
            code = COUNTRY_MAPPING[c]
            if code not in unis_by_country:
                unis_by_country[code] = []
            unis_by_country[code].append(item)

    for hipo_country, country_code in COUNTRY_MAPPING.items():
        print(f"\n📂 Processing {hipo_country} ({country_code.upper()})...")
        
        # Load existing verified backup database to preserve deep links
        backup_path = os.path.join(BACKUP_DIR, f"{country_code}.json")
        existing_courses = []
        if os.path.exists(backup_path):
            with open(backup_path, "r", encoding="utf-8") as f:
                existing_courses = json.load(f)
            print(f"  Loaded {len(existing_courses)} verified deep-linked courses from backup.")
        else:
            print(f"  ⚠️ Warning: backup for {country_code} not found.")

        # Set of unique keys already in database
        existing_keys = set(
            (c.get("uni", "").strip().lower(), c.get("course", "").strip().lower(), c.get("degree", "").strip().lower())
            for c in existing_courses
        )

        # Find which universities are already represented in existing verified database
        represented_unis = set(c.get("uni", "").strip().lower() for c in existing_courses)

        hipo_unis = unis_by_country.get(country_code, [])
        new_courses = []

        for item in hipo_unis:
            uni_name = item.get("name", "").strip()
            if not uni_name:
                continue

            # Check if this university is already represented
            # If so, keep the existing verified deep-linked courses and skip adding generic ones
            if uni_name.lower() in represented_unis:
                continue

            # Determine homepage url
            web_pages = item.get("web_pages", [])
            uni_url = web_pages[0] if web_pages else ""
            if not uni_url:
                domains = item.get("domains", [])
                if domains:
                    uni_url = f"https://{domains[0]}"
                else:
                    uni_url = f"https://www.{uni_name.lower().replace(' ', '')}.edu"

            if not uni_url.startswith(("http://", "https://")):
                uni_url = "https://" + uni_url

            city = guess_city(uni_name, country_code)
            
            # Determine fields
            is_art = any(k in uni_name.lower() for k in ["art", "design", "film", "music", "conservatoire", "fine arts"])
            is_medical = any(k in uni_name.lower() for k in ["medical", "health", "medicine", "nursing", "pharmacy"])
            
            if is_art:
                uni_fields = ["Architecture", "Digital Media & Game Art", "Fine Arts"]
            elif is_medical:
                uni_fields = ["Medicine", "Nursing", "Psychology", "Biomedical Engineering"]
            else:
                # General list (subset of fields to keep db size reasonable)
                uni_fields = ["Computer Science", "Data Science", "Software Engineering", "Business Administration", "Finance", "Mechanical Engineering", "Psychology"]

            # Generate Bachelor and Master programs
            for deg in ["Bachelor", "Master"]:
                for field in uni_fields:
                    course_name = get_degree_title(deg, field)
                    key = (uni_name.lower(), course_name.lower(), deg.lower())

                    if key not in existing_keys:
                        new_courses.append({
                            "country": hipo_country,
                            "uni": uni_name,
                            "course": course_name,
                            "degree": deg,
                            "city": city,
                            "link": uni_url,
                            "fee": "",
                            "source": "Global institution database",
                            "source_url": uni_url,
                            "verified_at": TODAY
                        })
                        existing_keys.add(key)

        # Merge and save
        combined = existing_courses + new_courses
        output_path = os.path.join(DATA_DIR, f"{country_code}.json")
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(combined, f, indent=2, ensure_ascii=False)
            
        print(f"  ✓ Added {len(new_courses)} courses. Total now: {len(combined)}")

    print("\n✅ Global Course Database Expansion completed successfully!")

if __name__ == "__main__":
    main()
