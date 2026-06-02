import os
import json

DATA_DIR = "/Users/mdlimonapu/studyapp/backend/data"

KEYWORDS = [
    "applied sciences", 
    "fachhochschule", 
    "hogeschool", 
    "ggmbh", 
    "university college", 
    "conservatory", 
    "hochschule für",
    "hochschule fuer"
]

def cleanup_phds():
    print("🧹 Starting deletion of invalid PhD entries for Applied Sciences / Hogescholen...")
    total_removed = 0
    
    for filename in os.listdir(DATA_DIR):
        if not filename.endswith(".json") or filename in ["news_cache.json", "resolved_links_cache.json", "source_manifest.json"]:
            continue
            
        filepath = os.path.join(DATA_DIR, filename)
        with open(filepath, 'r', encoding='utf-8') as f:
            courses = json.load(f)
            
        initial_count = len(courses)
        # Filter out PhDs from universities containing the restricted keywords
        cleaned_courses = [
            item for item in courses 
            if not (
                item.get("degree", "").lower() == "phd" and 
                any(kw in item.get("uni", "").lower() for kw in KEYWORDS)
            )
        ]
        
        removed_count = initial_count - len(cleaned_courses)
        if removed_count > 0:
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(cleaned_courses, f, indent=2, ensure_ascii=False)
            print(f"  ✓ {filename}: Removed {removed_count} invalid PhD entries. (Total now: {len(cleaned_courses)})")
            total_removed += removed_count
            
    print(f"\n✅ Finished! Removed a total of {total_removed} invalid PhD entries from the database.")

if __name__ == "__main__":
    cleanup_phds()
