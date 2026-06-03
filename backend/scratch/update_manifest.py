import os
import json
from datetime import date

DATA_DIR = "/Users/mdlimonapu/studyapp/backend/data"
TODAY = date.today().isoformat()

# Country display names corresponding to their file basenames
FILE_TO_COUNTRY = {
    "australia.json": "Australia",
    "canada.json": "Canada",
    "france.json": "France",
    "germany.json": "Germany",
    "japan.json": "Japan",
    "netherlands.json": "Netherlands",
    "sweden.json": "Sweden",
    "switzerland.json": "Switzerland",
    "uk.json": "UK"
}

def main():
    print("Updating source manifest with actual database counts...")
    sources = {}
    total_courses = 0

    for filename in sorted(os.listdir(DATA_DIR)):
        if filename in FILE_TO_COUNTRY:
            country_name = FILE_TO_COUNTRY[filename]
            filepath = os.path.join(DATA_DIR, filename)
            try:
                with open(filepath, "r", encoding="utf-8") as f:
                    data = json.load(f)
                if isinstance(data, list):
                    count = len(data)
                    sources[country_name] = {
                        "status": "ok",
                        "rows": count
                    }
                    total_courses += count
                    print(f"  ✓ {country_name:12s}: {count:5d} courses")
            except Exception as e:
                print(f"  ⚠️ Error reading {filename}: {e}")
        elif filename.startswith("usa_part") and filename.endswith(".json"):
            filepath = os.path.join(DATA_DIR, filename)
            try:
                with open(filepath, "r", encoding="utf-8") as f:
                    data = json.load(f)
                if isinstance(data, list):
                    count = len(data)
                    if "USA" not in sources:
                        sources["USA"] = {
                            "status": "ok",
                            "rows": 0
                        }
                    sources["USA"]["rows"] += count
                    total_courses += count
                    print(f"  ✓ {filename:12s} (USA): {count:5d} courses")
            except Exception as e:
                print(f"  ⚠️ Error reading {filename}: {e}")

    manifest = {
        "generated_at": TODAY,
        "sources": sources
    }

    manifest_path = os.path.join(DATA_DIR, "source_manifest.json")
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)

    print(f"\nManifest updated at {manifest_path}")
    print(f"Total verified courses across all countries: {total_courses}")

if __name__ == "__main__":
    main()
