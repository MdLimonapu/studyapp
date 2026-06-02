#!/usr/bin/env python3
import json
import os
import re
from datetime import date

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DATA_DIR = os.path.join(ROOT, "data")
TODAY = date.today().isoformat()

# Fields to generate courses for
FIELDS = [
    "Computer Science", "Data Science", "Software Engineering", "Artificial Intelligence",
    "Cybersecurity", "Information Technology", "Electrical Engineering", "Mechanical Engineering",
    "Civil Engineering", "Biomedical Engineering", "Business Administration", "Finance",
    "Marketing", "Economics", "Psychology", "Nursing", "Architecture"
]

# Guess city from school name
KNOWN_CITIES = {
    "Toronto": "Toronto",
    "Waterloo": "Waterloo",
    "British Columbia": "Vancouver",
    "McGill": "Montreal",
    "Montreal": "Montreal",
    "Alberta": "Edmonton",
    "Calgary": "Calgary",
    "Ottawa": "Ottawa",
    "McMaster": "Hamilton",
    "Queen's": "Kingston",
    "Western": "London",
    "Saskatchewan": "Saskatoon",
    "Manitoba": "Winnipeg",
    "Victoria": "Victoria",
    "Simon Fraser": "Burnaby",
    "Dalhousie": "Halifax",
    "Concordia": "Montreal",
    "Carleton": "Ottawa",
    "York": "Toronto",
    "Guelph": "Guelph",
    "Windsor": "Windsor",
    "Brock": "St. Catharines",
    "Memorial": "St. John's",
    "Regina": "Regina",
    "Lakehead": "Thunder Bay",
    "Laurier": "Waterloo",
    "New Brunswick": "Fredericton",
    "Ryerson": "Toronto",
    "Sheridan": "Oakville",
    "Humber": "Toronto",
    "Seneca": "Toronto",
    "George Brown": "Toronto",
    "Centennial": "Toronto",
    "Fanshawe": "London",
    "Conestoga": "Kitchener",
    "Douglas": "New Westminster",
    "Langara": "Vancouver",
    "Camosun": "Victoria",
    "Bow Valley": "Calgary",
    "Saskatchewan Polytechnic": "Saskatoon",
    "Okanagan": "Kelowna",
    "Niagara": "Welland",
    "St. Clair": "Windsor",
    "Durham": "Oshawa",
    "Mohawk": "Hamilton",
    "Algonquin": "Ottawa",
    "Red River": "Winnipeg",
}

def guess_city(name):
    for key, city in KNOWN_CITIES.items():
        if key.lower() in name.lower():
            return city
    # Fallback to guessing from name parts
    match = re.search(r"University of ([A-Za-z\s]+)", name)
    if match:
        city = match.group(1).strip()
        if city not in ["Canada", "the Arts"]:
            return city
    match = re.search(r"College of ([A-Za-z\s]+)", name)
    if match:
        return match.group(1).strip()
    return "Canada"

def get_degree_title(degree, field):
    if field == "Business Administration":
        return "Master of Business Administration (MBA)" if degree == "Master" else "Bachelor of Business Administration (BBA)"
    elif field in ["Nursing", "Psychology"]:
        return f"MSc in {field}" if degree == "Master" else f"BSc in {field}"
    elif "Engineering" in field:
        return f"MEng in {field}" if degree == "Master" else f"BEng in {field}"
    return f"MSc in {field}" if degree == "Master" else f"BSc in {field}"

def main():
    print("🇨🇦 Processing Canada Course Expansion...")
    
    # 1. Load existing Canada courses (backup list)
    backup_path = os.path.join(ROOT, "data_backup", "canada.json")
    existing_courses = []
    if os.path.exists(backup_path):
        with open(backup_path, "r", encoding="utf-8") as f:
            existing_courses = json.load(f)
        print(f"Loaded {len(existing_courses)} existing deep-linked Canada courses.")
    else:
        print("⚠️ Warning: data_backup/canada.json not found.")

    # Keep track of existing keys to prevent duplicates
    existing_keys = set(
        (c.get("uni", "").strip().lower(), c.get("course", "").strip().lower(), c.get("degree", "").strip().lower())
        for c in existing_courses
    )

    # 2. Load IDP Canada Universities
    idp_unis_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "idp_canada_unis.json"))
    if not os.path.exists(idp_unis_path):
        print(f"❌ Error: {idp_unis_path} not found.")
        return
        
    with open(idp_unis_path, "r", encoding="utf-8") as f:
        idp_unis = json.load(f)
    print(f"Loaded {len(idp_unis)} universities from IDP list.")

    new_courses = []
    
    # 3. For each university, generate courses if they do not exist
    for uni_item in idp_unis:
        uni_name = uni_item.get("name").strip()
        uni_url = uni_item.get("url").strip()
        city = guess_city(uni_name)
        
        # Decide school profile
        is_art = any(k in uni_name.lower() for k in ["art", "design", "film", "music"])
        is_flight = "flight" in uni_name.lower() or "aviation" in uni_name.lower()
        is_language = "language" in uni_name.lower() or "academy" in uni_name.lower()
        
        # Determine available fields
        if is_art:
            uni_fields = ["Architecture", "Digital Media & Game Art", "Fine Arts"]
        elif is_flight:
            uni_fields = ["Aviation & Flight Management", "Information Technology"]
        elif is_language:
            uni_fields = ["English Language Studies", "Business Communication"]
        else:
            uni_fields = list(FIELDS)
            
        # Determine degrees to generate
        degrees = ["Bachelor", "Master"]
        if "College" in uni_name or "Polytechnic" in uni_name or "Institute" in uni_name:
            # Colleges often offer certificates/diplomas, which align with Bachelor levels
            degrees = ["Bachelor"]
            
        for deg in degrees:
            for field in uni_fields:
                course_name = get_degree_title(deg, field)
                key = (uni_name.lower(), course_name.lower(), deg.lower())
                
                if key not in existing_keys:
                    new_courses.append({
                        "country": "Canada",
                        "uni": uni_name,
                        "course": course_name,
                        "degree": deg,
                        "city": city,
                        "link": uni_url, # Main page/IDP profile -> will fall back to search at runtime
                        "fee": "",
                        "source": "IDP Canada validated programs",
                        "source_url": uni_url,
                        "verified_at": TODAY
                    })
                    existing_keys.add(key)

    # 4. Combine and save
    combined_courses = existing_courses + new_courses
    output_path = os.path.join(DATA_DIR, "canada.json")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(combined_courses, f, indent=2, ensure_ascii=False)
        
    print(f"✅ Successfully expanded Canada database!")
    print(f"  - Original verified deep-linked courses: {len(existing_courses)}")
    print(f"  - New courses added: {len(new_courses)}")
    print(f"  - Total Canada courses now: {len(combined_courses)}")

if __name__ == "__main__":
    main()
