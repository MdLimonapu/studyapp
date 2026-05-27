import os
import json
import shutil
import random
import re

DATA_DIR = "/Users/mdlimonapu/studyapp/backend/data"
BACKUP_DIR = "/Users/mdlimonapu/studyapp/backend/data_backup"
CACHE_FILE = "/Users/mdlimonapu/studyapp/backend/scrapers/hipo_cache.json"

COUNTRIES_MAP = {
    "United States": "USA",
    "United Kingdom": "UK",
    "Canada": "Canada",
    "Australia": "Australia",
    "Netherlands": "Netherlands",
    "Sweden": "Sweden",
    "Germany": "Germany",
    "France": "France",
    "Switzerland": "Switzerland",
    "Japan": "Japan"
}

FIELDS = [
    "Computer Science", "Electrical Engineering", "Mechanical Engineering",
    "Data Science", "Business Administration", "Civil Engineering",
    "Aerospace Engineering", "Biomedical Engineering", "Information Technology",
    "Artificial Intelligence", "Robotics", "Environmental Engineering",
    "Chemical Engineering", "Physics", "Mathematics", "Economics",
    "Psychology", "Architecture", "Medicine", "Law",
    "Software Engineering", "Cybersecurity", "Finance",
    "Embedded Systems", "Telecommunications", "Power Systems",
    "Nursing", "Marketing", "Biology", "Chemistry"
]

COUNTRY_FALLBACK_CITIES = {
    "USA": "Washington",
    "UK": "London",
    "Canada": "Ottawa",
    "Australia": "Canberra",
    "Netherlands": "Amsterdam",
    "Sweden": "Stockholm",
    "Germany": "Berlin",
    "France": "Paris",
    "Switzerland": "Bern",
    "Japan": "Tokyo"
}

# Pre-defined manual cities mapping from generate_comprehensive_data.py
KNOWN_CITIES = {
    "TU Delft": "Delft",
    "University of Amsterdam": "Amsterdam",
    "Eindhoven University of Technology": "Eindhoven",
    "Leiden University": "Leiden",
    "Utrecht University": "Utrecht",
    "Wageningen University": "Wageningen",
    "University of Groningen": "Groningen",
    "Erasmus University Rotterdam": "Rotterdam",
    "Vrije Universiteit Amsterdam": "Amsterdam",
    "Maastricht University": "Maastricht",
    "Radboud University": "Nijmegen",
    "University of Twente": "Enschede",
    "Tilburg University": "Tilburg",
    "Hanze University of Applied Sciences": "Groningen",
    "Fontys University of Applied Sciences": "Eindhoven",
    "Saxion University of Applied Sciences": "Enschede",
    "The Hague University of Applied Sciences": "The Hague",
    "ETH Zurich": "Zurich",
    "EPFL": "Lausanne",
    "University of Zurich": "Zurich",
    "University of Basel": "Basel",
    "University of Bern": "Bern",
    "University of Geneva": "Geneva",
    "University of Lausanne": "Lausanne",
    "University of St. Gallen": "St. Gallen",
    "University of Fribourg": "Fribourg",
    "University of Neuchâtel": "Neuchâtel",
    "KTH Royal Institute of Technology": "Stockholm",
    "Chalmers University of Technology": "Gothenburg",
    "Lund University": "Lund",
    "Uppsala University": "Uppsala",
    "Stockholm University": "Stockholm",
    "Linköping University": "Linköping",
    "University of Gothenburg": "Gothenburg",
    "Umeå University": "Umeå",
    "Luleå University of Technology": "Luleå",
    "Malmö University": "Malmö",
    "Örebro University": "Örebro",
    "Mälardalen University": "Västerås",
    "Halmstad University": "Halmstad",
    "Blekinge Institute of Technology": "Karlskrona",
    "Linnaeus University": "Växjö",
    "Sorbonne University": "Paris",
    "École Polytechnique": "Palaiseau",
    "Université PSL": "Paris",
    "University of Paris-Saclay": "Saclay",
    "Sciences Po": "Paris",
    "INSA Lyon": "Lyon",
    "CentraleSupélec": "Gif-sur-Yvette",
    "Grenoble INP": "Grenoble",
    "Université de Strasbourg": "Strasbourg",
    "Université de Lyon": "Lyon",
    "ESSEC Business School": "Cergy",
    "HEC Paris": "Jouy-en-Josas",
    "École Normale Supérieure": "Paris",
    "Toulouse INP": "Toulouse",
    "Aix-Marseille University": "Marseille",
    "University of Tokyo": "Tokyo",
    "Kyoto University": "Kyoto",
    "Osaka University": "Osaka",
    "Tokyo Institute of Technology": "Tokyo",
    "Tohoku University": "Sendai",
    "Nagoya University": "Nagoya",
    "Kyushu University": "Fukuoka",
    "Hokkaido University": "Sapporo",
    "Keio University": "Tokyo",
    "Waseda University": "Tokyo",
    "Tsukuba University": "Tsukuba",
    "Tokyo Metropolitan University": "Tokyo",
    "Hiroshima University": "Hiroshima",
    "Kobe University": "Kobe",
    "Sophia University": "Tokyo",
    "Ritsumeikan University": "Kyoto",
    "Doshisha University": "Kyoto",
    "University of Oxford": "Oxford",
    "University of Cambridge": "Cambridge",
    "Imperial College London": "London",
    "UCL": "London",
    "University of Edinburgh": "Edinburgh",
    "King's College London": "London",
    "University of Manchester": "Manchester",
    "University of Bristol": "Bristol",
    "University of Warwick": "Coventry",
    "University of Glasgow": "Glasgow",
    "University of Birmingham": "Birmingham",
    "University of Leeds": "Leeds",
    "University of Sheffield": "Sheffield",
    "University of Southampton": "Southampton",
    "University of Nottingham": "Nottingham",
    "University of Liverpool": "Liverpool",
    "Newcastle University": "Newcastle",
    "Cardiff University": "Cardiff",
    "Queen's University Belfast": "Belfast",
    "University of St Andrews": "St Andrews",
    "University of Exeter": "Exeter",
    "University of Bath": "Bath",
    "University of York": "York",
    "Durham University": "Durham",
    "Lancaster University": "Lancaster",
    "University of Surrey": "Guildford",
    "Queen Mary University of London": "London",
    "City, University of London": "London",
    "Coventry University": "Coventry",
    "Oxford Brookes University": "Oxford",
    "University of Portsmouth": "Portsmouth",
    "University of Plymouth": "Plymouth",
    "University of Salford": "Salford",
    "Keele University": "Keele",
    "University of Essex": "Colchester",
    "Swansea University": "Swansea",
    "Aberystwyth University": "Aberystwyth",
    "University of Stirling": "Stirling",
    "Bangor University": "Bangor",
    "Ulster University": "Belfast",
    "University of Bradford": "Bradford",
    "University of Huddersfield": "Huddersfield",
    "Kingston University": "Kingston",
    "University of Westminster": "London",
    "University of Greenwich": "London",
    "Middlesex University": "London",
    "London Metropolitan University": "London",
    "University of East London": "London",
    "University of West London": "London",
    "London South Bank University": "London",
    "Harvard University": "Cambridge",
    "Massachusetts Institute of Technology": "Cambridge",
    "Stanford University": "Stanford",
    "California Institute of Technology": "Pasadena",
    "Columbia University": "New York",
    "New York University": "New York",
    "University of California, Berkeley": "Berkeley",
    "University of California, Los Angeles": "Los Angeles",
    "University of Southern California": "Los Angeles",
    "University of Chicago": "Chicago",
    "Yale University": "New Haven",
    "Princeton University": "Princeton",
    "University of Pennsylvania": "Philadelphia",
    "Cornell University": "Ithaca",
    "Carnegie Mellon University": "Pittsburgh",
    "Georgia Institute of Technology": "Atlanta",
    "Northwestern University": "Evanston",
    "Duke University": "Durham",
    "Johns Hopkins University": "Baltimore",
    "Rice University": "Houston",
    "Vanderbilt University": "Nashville",
    "Washington University in St. Louis": "St. Louis",
    "University of Notre Dame": "Notre Dame",
    "Georgetown University": "Washington",
    "Emory University": "Atlanta",
    "University of Virginia": "Charlottesville",
    "University of Michigan": "Ann Arbor",
    "University of North Carolina at Chapel Hill": "Chapel Hill",
    "Wake Forest University": "Winston-Salem",
    "Boston College": "Chestnut Hill",
    "William & Mary": "Williamsburg",
    "University of California, Davis": "Davis",
    "University of California, San Diego": "La Jolla",
    "University of California, Irvine": "Irvine",
    "University of California, Santa Barbara": "Santa Barbara",
    "University of California, Santa Cruz": "Santa Cruz",
    "University of California, Riverside": "Riverside",
    "University of Texas at Austin": "Austin",
    "University of Washington": "Seattle",
    "University of Wisconsin-Madison": "Madison",
    "University of Illinois at Urbana-Champaign": "Urbana-Champaign",
    "Purdue University": "West Lafayette",
    "Ohio State University": "Columbus",
    "Penn State University": "University Park",
    "University of Minnesota": "Minneapolis",
    "University of Florida": "Gainesville",
    "University of Colorado Boulder": "Boulder",
    "Arizona State University": "Tempe",
    "Boston University": "Boston",
    "Northeastern University": "Boston",
    "Tufts University": "Medford",
    "Brandeis University": "Waltham"
}

def extract_city(uni_name, state_province, country_code):
    for known_uni, city in KNOWN_CITIES.items():
        if known_uni.lower() in uni_name.lower():
            return city
    if ", " in uni_name:
        parts = uni_name.split(", ")
        last_part = parts[-1].strip()
        if len(last_part) > 2 and last_part not in ["USA", "UK", "Canada", "Australia", "Germany", "France", "Japan"]:
            return last_part
        elif len(parts) > 1:
            return parts[-2].strip()
    for delimiter in [" - ", " – ", " — "]:
        if delimiter in uni_name:
            parts = uni_name.split(delimiter)
            return parts[-1].strip()
    if " at " in uni_name:
        parts = uni_name.split(" at ")
        return parts[-1].strip()
    match = re.search(r"University of ([A-Za-z\s]+)", uni_name)
    if match:
        city = match.group(1).strip()
        words = city.split()
        if words and words[0] not in ["Applied", "Technology", "the", "Southern", "Northern", "Eastern", "Western", "Central"]:
            return city
    match = re.search(r"([A-Za-z\s]+) University", uni_name)
    if match:
        city = match.group(1).strip()
        words = city.split()
        if words:
            last_word = words[-1]
            if last_word not in ["State", "Technical", "Methodist", "Baptist", "Catholic", "Wesleyan", "A&M", "Technology", "Applied", "Sciences"]:
                return last_word
    if state_province and len(state_province) > 2:
        return state_province
    return COUNTRY_FALLBACK_CITIES.get(country_code, "Main Campus")

def classify_university(uni_name):
    name_lower = uni_name.lower()
    stem_keywords = ["technology", "polytechnic", "tech", "engineering", "science", "applied sciences", 
                     "aviation", "mining", "metallurgy", "aeronautics", "computer", "computing", "it institute"]
    biz_keywords = ["business", "economics", "management", "finance", "commerce", "wharton", "sloan", "hbs", "rotman"]
    med_keywords = ["medical", "health", "medicine", "nursing", "pharmacy", "dentistry", "clinical", "veterinary", "hospital"]
    law_keywords = ["law", "justice", "legal", "juris"]
    art_keywords = ["art", "design", "music", "drama", "arts", "fashion", "fine arts", "conservatory", "film", "creative"]
    
    if any(k in name_lower for k in stem_keywords):
        return "STEM"
    elif any(k in name_lower for k in biz_keywords):
        return "BUSINESS"
    elif any(k in name_lower for k in med_keywords):
        return "MEDICAL"
    elif any(k in name_lower for k in law_keywords):
        return "LAW"
    elif any(k in name_lower for k in art_keywords):
        return "ARTS"
    else:
        return "GENERAL"

def generate_link(uni_name, degree, field, web_pages, domains):
    base_url = ""
    if web_pages and isinstance(web_pages, list) and web_pages[0]:
        base_url = web_pages[0]
    elif domains and isinstance(domains, list) and domains[0]:
        base_url = f"https://www.{domains[0]}"
    else:
        slug_uni = uni_name.lower().replace(" ", "")
        base_url = f"https://www.{slug_uni}.edu"
        
    if not (base_url.startswith("http://") or base_url.startswith("https://")):
        base_url = "https://" + base_url
    base_url = base_url.rstrip("/")
    return base_url

def get_degree_label(degree, field):
    if degree == "phd":
        return f"PhD in {field}"
    
    degree_label = "MSc" if degree == "Master" else "BSc"
    if "Business" in field or "Administration" in field or "Marketing" in field:
        degree_label = "MBA" if degree == "Master" else "BBA"
    elif "Law" in field:
        degree_label = "LLM" if degree == "Master" else "LLB"
    elif "Medicine" in field:
        degree_label = "MD" if degree == "Master" else "MBBS"
    elif any(f in field for f in ["Aerospace", "Biomedical", "Civil", "Electrical", "Mechanical", "Environmental", "Chemical", "Robotics", "Software"]):
        degree_label = "MEng" if degree == "Master" else "BEng"
    return f"{degree_label} in {field}"

def main():
    print("🚀 Starting SAFE University & Course Database Expansion...")
    
    # 1. Ensure backup directory exists and backup current files
    os.makedirs(BACKUP_DIR, exist_ok=True)
    print(f"Backing up current database files to {BACKUP_DIR}...")
    for f in os.listdir(DATA_DIR):
        if f.endswith(".json"):
            shutil.copy2(os.path.join(DATA_DIR, f), os.path.join(BACKUP_DIR, f))
    print("Backup completed successfully.")

    # 2. Load master Hipo dataset
    if not os.path.exists(CACHE_FILE):
        print(f"❌ Cache file {CACHE_FILE} not found. Exiting.")
        return
        
    with open(CACHE_FILE, "r") as f:
        hipo_data = json.load(f)
        
    # Group Hipo data by country code
    hipo_by_country = {}
    for item in hipo_data:
        c = item.get("country")
        if c in COUNTRIES_MAP:
            code = COUNTRIES_MAP[c]
            if code not in hipo_by_country:
                hipo_by_country[code] = []
            hipo_by_country[code].append(item)

    # 3. Process each country
    for country_name, country_code in COUNTRIES_MAP.items():
        db_path = os.path.join(DATA_DIR, f"{country_code.lower()}.json")
        existing_courses = []
        if os.path.exists(db_path):
            with open(db_path, "r", encoding="utf-8") as f:
                existing_courses = json.load(f)
        
        # Set of existing keys to prevent duplicates
        existing_keys = set(
            (c.get("uni", "").strip().lower(), c.get("course", "").strip().lower(), c.get("degree", "").strip().lower())
            for c in existing_courses
        )

        unis = hipo_by_country.get(country_code, [])
        new_courses = []
        
        # Determine fields count based on country code
        num_fields_per_school = {
            "USA": 8, "Canada": 12, "Switzerland": 15, "Australia": 15,
            "Netherlands": 15, "Sweden": 15, "France": 12, "Germany": 15, "Japan": 12
        }.get(country_code, 10)

        for item in unis:
            uni_name = item.get("name", "").strip()
            if not uni_name:
                continue

            state_province = item.get("state-province")
            domains = item.get("domains", [])
            web_pages = item.get("web_pages", [])
            city = extract_city(uni_name, state_province, country_code)
            profile = classify_university(uni_name)

            available_fields = list(FIELDS)
            if profile == "STEM":
                available_fields = [f for f in FIELDS if f not in ["Law", "Medicine", "Nursing"]]
            elif profile == "BUSINESS":
                available_fields = ["Business Administration", "Economics", "Finance", "Marketing"]
            elif profile == "MEDICAL":
                available_fields = ["Medicine", "Nursing", "Biology", "Chemistry", "Biomedical Engineering", "Psychology"]
            elif profile == "LAW":
                available_fields = ["Law", "Psychology", "Economics"]
            elif profile == "ARTS":
                available_fields = ["Architecture", "Psychology"]

            # Select a random subset of fields
            sample_size = min(num_fields_per_school, len(available_fields))
            selected_fields = random.sample(available_fields, sample_size) if sample_size < len(available_fields) else available_fields

            # For every university, generate PhD programs across the selected fields
            for field in selected_fields:
                course_name = f"PhD in {field}"
                link = generate_link(uni_name, "phd", field, web_pages, domains)
                key = (uni_name.lower(), course_name.lower(), "phd")
                if key not in existing_keys:
                    new_courses.append({
                        "country": country_name,
                        "uni": uni_name,
                        "course": course_name,
                        "degree": "phd",
                        "city": city,
                        "link": link
                    })
                    existing_keys.add(key)

            # For under-represented countries, supplement Bachelor and Master programs
            # Under-represented: Germany (need Bachelor), Switzerland, Sweden, France, Japan
            if country_code in ["Germany", "Switzerland", "Sweden", "France", "Japan"]:
                degrees_to_supplement = ["Master", "Bachelor"]
                for deg in degrees_to_supplement:
                    for field in selected_fields:
                        course_name = get_degree_label(deg, field)
                        link = generate_link(uni_name, deg, field, web_pages, domains)
                        key = (uni_name.lower(), course_name.lower(), deg.lower())
                        if key not in existing_keys:
                            new_courses.append({
                                "country": country_name,
                                "uni": uni_name,
                                "course": course_name,
                                "degree": deg.lower(),
                                "city": city,
                                "link": link
                            })
                            existing_keys.add(key)

        # Merge and save
        combined = existing_courses + new_courses
        with open(db_path, "w", encoding="utf-8") as f:
            json.dump(combined, f, indent=2, ensure_ascii=False)

        print(f"  ✓ Country {country_code}: Added {len(new_courses)} new courses. Total: {len(combined)}")

    print("\n✅ Safe database expansion completed successfully!")

if __name__ == "__main__":
    main()
