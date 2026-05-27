import os
import json

DATA_DIR = "/Users/mdlimonapu/studyapp/backend/data"

NL_RESEARCH_UNIS = [
    "delft university of technology", 
    "eindhoven university of technology", 
    "university of twente", 
    "wageningen university", 
    "university of amsterdam", 
    "vrije universiteit amsterdam", 
    "utrecht university", 
    "universiteit leiden", 
    "university of groningen", 
    "radboud university", 
    "maastricht university", 
    "erasmus university rotterdam", 
    "tilburg university"
]

CH_RESEARCH_UNIS = [
    "ethz - eth zurich", 
    "eth zurich", 
    "epfl - epf lausanne", 
    "epf lausanne", 
    "university of basel", 
    "university of bern", 
    "university of fribourg", 
    "university of geneva", 
    "university of lausanne", 
    "université de lausanne", 
    "universität luzern", 
    "université de neuchâtel", 
    "universität zürich", 
    "university of zurich", 
    "universität st. gallen", 
    "universita della svizzera italiana"
]

DE_ALLOWED_PHD_KEYWORDS = [
    "universität",
    "universitaet",
    "tu ",
    "rwth",
    "karlsruher institut",
    "medizinische hochschule hannover",
    "tierärztliche hochschule hannover",
    "tieraerztliche hochschule hannover",
    "deutsche sporthochschule köln",
    "deutsche sporthochschule koeln",
    "deutsche universität für verwaltungswissenschaften speyer",
    "deutsche universitaet fuer verwaltungswissenschaften speyer"
]

DE_DISALLOWED_PHD_KEYWORDS = [
    "hochschule",
    "fh",
    "duale hochschule",
    "schule",
    "academy",
    "akademie",
    "school",
    "berufskolleg",
    "popakademie",
    "college"
]

def clean_database():
    print("🧹 Starting Advanced PhD Database Verification & Cleaning...")
    total_removed = 0
    
    # 1. NETHERLANDS
    nl_path = os.path.join(DATA_DIR, "netherlands.json")
    if os.path.exists(nl_path):
        with open(nl_path, 'r', encoding='utf-8') as f:
            courses = json.load(f)
        initial = len(courses)
        cleaned = [
            item for item in courses
            if not (
                item.get("degree", "").lower() == "phd" and
                not any(ru in item.get("uni", "").lower() for ru in NL_RESEARCH_UNIS)
            )
        ]
        removed = initial - len(cleaned)
        if removed > 0:
            with open(nl_path, 'w', encoding='utf-8') as f:
                json.dump(cleaned, f, indent=2, ensure_ascii=False)
            print(f"  ✓ Netherlands: Removed {removed} non-research university PhD entries. (Total now: {len(cleaned)})")
            total_removed += removed

    # 2. SWITZERLAND
    ch_path = os.path.join(DATA_DIR, "switzerland.json")
    if os.path.exists(ch_path):
        with open(ch_path, 'r', encoding='utf-8') as f:
            courses = json.load(f)
        initial = len(courses)
        cleaned = [
            item for item in courses
            if not (
                item.get("degree", "").lower() == "phd" and
                not any(ru in item.get("uni", "").lower() for ru in CH_RESEARCH_UNIS)
            )
        ]
        removed = initial - len(cleaned)
        if removed > 0:
            with open(ch_path, 'w', encoding='utf-8') as f:
                json.dump(cleaned, f, indent=2, ensure_ascii=False)
            print(f"  ✓ Switzerland: Removed {removed} non-research university PhD entries. (Total now: {len(cleaned)})")
            total_removed += removed

    # 3. GERMANY
    de_path = os.path.join(DATA_DIR, "germany.json")
    if os.path.exists(de_path):
        with open(de_path, 'r', encoding='utf-8') as f:
            courses = json.load(f)
        initial = len(courses)
        
        cleaned = []
        removed = 0
        for item in courses:
            if item.get("degree", "").lower() == "phd":
                uni_lower = item.get("uni", "").lower()
                
                # Check if it has allowed research keywords
                has_allowed = any(ak in uni_lower for ak in DE_ALLOWED_PHD_KEYWORDS)
                
                # Check if it has disallowed UAS keywords
                has_disallowed = any(dk in uni_lower for dk in DE_DISALLOWED_PHD_KEYWORDS)
                
                # An institution is allowed if it has research keywords AND (it does not have disallowed keywords OR is specifically whitelisted)
                # Example: "Medizinische Hochschule Hannover" has "hochschule" but is allowed because it is in allowed keywords.
                # E.g. "Hochschule München" has "hochschule" but is NOT in allowed, so it is disallowed.
                is_allowed = False
                if has_allowed:
                    # Specific whitelist override
                    is_allowed = True
                elif not has_disallowed:
                    # E.g. "Universität Köln" has neither, so allowed
                    is_allowed = True
                
                if not is_allowed:
                    removed += 1
                    continue
            cleaned.append(item)
            
        if removed > 0:
            with open(de_path, 'w', encoding='utf-8') as f:
                json.dump(cleaned, f, indent=2, ensure_ascii=False)
            print(f"  ✓ Germany: Removed {removed} non-research university PhD entries. (Total now: {len(cleaned)})")
            total_removed += removed

    print(f"\n✅ Advanced cleanup completed! Removed a total of {total_removed} invalid PhD entries.")

if __name__ == "__main__":
    clean_database()
