import os
import json

DATA_DIR = "/Users/mdlimonapu/studyapp/backend/data"

CITY_MAPPING = {
    # Germany
    "BiTS - Business and Information Technology School gGmbH": "Iserlohn",
    "WHU – Otto Beisheim School of Management": "Vallendar",
    "AKAD Hochschulen für Berufstätige, Fachhochschule Leipzig": "Leipzig",
    "Evangelische Fachhochschule Berlin, Fachhochschule für Sozialarbeit und Sozialpädagogik": "Berlin",
    "Hochschule Mittweida, University of Applied Sciences": "Mittweida",
    "Hochschule für Bankwirtschaft (HfB), Private Fachhochschule der Bankakademie": "Frankfurt",
    "Fachhochschule Rottenburg, Hochschule für Forstwirtschaft": "Rottenburg",
    "Fachhochschule Biberach, Hochschule für Bauwesen und Wirtschaft": "Biberach",
    "Hochschule Ulm, Hochschule für Angewandte Wissenschaft": "Ulm",
    "Fachhochschule Mannheim, Hochschule für Technik und Gestaltung": "Mannheim",
    "Fachhochschule Mannheim, Hochschule für Sozialwesen": "Mannheim",
    "Fachhochschule Hildesheim/Holzminden/Göttingen, Hochschule für angewandte Wissenschaft und Kunst": "Hildesheim",
    "Fachhochschule Kempten, Hochschule für Technik und Wirtschaft": "Kempten",
    "Kunsthochschule Berlin-Weissensee, Hochschule für Gestaltung": "Berlin",
    "Fachhochschule Heilbronn, Hochschule für Technik und Wirtschaft": "Heilbronn",
    "Fachhochschule Schwäbisch Gmünd, Hochschule für Gestaltung": "Schwäbisch Gmünd",
    "Fachhochschule Westküste, Hochschule für Wirtschaft und Technik": "Heide",
    "Fachhochschule Landshut, Hochschule für Wirtschaft - Sozialwesen - Technik": "Landshut",
    "Deutsch-Ordens Fachhochschule Riedlingen, Hochschule für Wirtschaft": "Riedlingen",
    "Fachhochschule Furtwangen, Hochschule für Technik und Wirtschaft": "Furtwangen",
    "Fachhochschule Schwäbisch Hall, Hochschule für Gestaltung": "Schwäbisch Hall",
    "Fachhochschule Rosenheim, Hochschule für Technik und Wirtschaft": "Rosenheim",
    "Hochschule Harz, Hochschule für angewandte Wissenschaften (FH)": "Wernigerode",
    "Fachhochschule Offenburg, Hochschule für Technik und Wirtschaft": "Offenburg",
    "Fachhochschule Stuttgart, Hochschule für Technik": "Stuttgart",
    "International School of New Media, University of Lübeck": "Lübeck",
    "Hochschule Neu-Ulm, Hochschule Neu-Ulm University of applied sciences": "Neu-Ulm",
    "Fachhochschule Ludwigshafen, Hochschule für Wirtschaft": "Ludwigshafen",
    "Fachhochschule Karlsruhe, Hochschule für Technik": "Karlsruhe",
    "Hochschule Anhalt (FH), Hochschule für angewandte Wissenschaften": "Köthen",
    "Fachhochschule Reutlingen, Hochschule für Technik und Wirtschaft": "Reutlingen",
    "Merz Akademie, Hochschule für Gestaltung Stuttgart": "Stuttgart",
    "Fachhochschule Stuttgart, Hochschule der Medien": "Stuttgart",
    "Nordakademie, Staatlich anerkannte private Fachhochschule mit dualen Studiengängen": "Elmshorn",
    "Muthesius-Hochschule, Fachhochschule für Kunst und Gestaltung": "Kiel",

    # Japan
    "Dai Ichi University, College of Technology": "Kagoshima",
    "National Institute of Technology, Asahikawa College": "Asahikawa",
    "University of Occupational and Environmental Health, Japan": "Kitakyushu",

    # Netherlands
    "University of Sint Eustatius School of Medicine": "Sint Eustatius",

    # Switzerland
    "BFH - Bern University of Applied Sciences": "Bern",
    "CHUV - University Hospital Lausanne": "Lausanne",
    "FFHS - Fernfachhochschule Schweiz": "Brig",
    "FHNW - Fachhochschule Nordwestschweiz": "Windisch",
    "HEP-PH FR - University of Teacher Education Fribourg": "Fribourg",
    "HSR - Hochschule für Technik Rapperswil": "Rapperswil",
    "HTW Chur - University of Applied Sciences HTW Chur": "Chur",
    "HWZ - University of Applied Sciences in Business Administration Zurich": "Zurich",
    "HfH – University of Applied Sciences of Special Needs Education": "Zurich",
    "NTB - Hochschule für Technik Buchs": "Buchs",
    "PH Zug - Pädagogische Hochschule Zug": "Zug",
    "PH Zürich - Pädagogische Hochschule Zürich": "Zurich",
    "PHBern - University of Teacher Education Bern": "Bern",
    "PHGR - University of Teacher Education Graubünden": "Chur",
    "PHLU - University of Teacher Education Lucerne": "Lucerne",
    "PHSG - Pädagogische Hochschule St.Gallen": "St. Gallen",
    "PHSZ - University of Teacher Education Schwyz": "Goldau",
    "PHTG - Pädagogische Hochschule Thurgau": "Kreuzlingen",
    "SUPSI - University of Applied Sciences Southern Switzerland": "Lugano",
    "Schiller International University, American College of Switzerland": "Leysin",
    "ZHAW - Zürcher Hochschule für Angewandte Wissenschaften": "Winterthur",
    "ZHdK - Zurich University of the Arts": "Zurich",

    # UK
    "Birkbeck College, University of London": "London",
    "City St George's, University of London": "London",
    "City St George's, University of London (II)": "London",
    "City St George's, University of London (School of Health and Medical Sciences)": "London",
    "Courtauld Institute of Art, University of London": "London",
    "Goldsmiths College, University of London": "London",
    "Heythrop College, University of London": "London",
    "Institue of Historical Research, University of London": "London",
    "Institute of Education, University of London": "London",
    "London School of Economics and Political Science, University of London": "London",
    "London School of Hygiene & Tropical Medicine, University of London": "London",
    "Queen Mary, University of London": "London",
    "Richmond University - The American International University in London": "London",
    "Royal Academy of Music, University of London": "London",
    "Royal College of Music, University of London": "London",
    "Royal Free Hospital School of Medicine, University of London": "London",
    "Saint George's Hospital Medical School, University of London": "London",
    "School of Advanced Study, University of London": "London",
    "School of Oriental and African Studies, University of London": "London",
    "School of Pharmacy, University of London": "London",
    "School of Slavonic and East European Studies, University of London": "London",
    "United Medical and Dental Schools, University of London": "London",
    "University College London, University of London": "London",
    "University of Wales College of Medicine": "Cardiff",

    # USA
    "Arkansas at Pine Bluff, University of": "Pine Bluff",
    "Governors State University": "University Park",
    "Sewanee, University of the South": "Sewanee",
    "State University of New York College of Environmental Science and Forestry": "Syracuse",
    "Texas A&M University - College Station": "College Station",
    "University of Akron Wayne College": "Orrville",
    "University of Arkansas Community College-Batesville": "Batesville",
    "University of Arkansas Community College-Hope": "Hope",
    "University of Arkansas Community College-Morrilton": "Morrilton",
    "University of Kansas School of Medicine": "Kansas City",
    "University of Maryland - University College": "Adelphi",
    "University of Maryland, College Park": "College Park",
    "University of Wisconsin Colleges": "Madison"
}

def cleanup():
    print("🧹 Cleaning up city names in JSON database...")
    fixed_count = 0
    
    for filename in os.listdir(DATA_DIR):
        if not filename.endswith(".json") or filename in ["news_cache.json", "resolved_links_cache.json", "source_manifest.json"]:
            continue
            
        filepath = os.path.join(DATA_DIR, filename)
        with open(filepath, 'r', encoding='utf-8') as f:
            courses = json.load(f)
            
        modified = False
        for item in courses:
            uni = item.get("uni", "").strip()
            if uni in CITY_MAPPING:
                correct_city = CITY_MAPPING[uni]
                if item.get("city") != correct_city:
                    item["city"] = correct_city
                    fixed_count += 1
                    modified = True
                    
        if modified:
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(courses, f, indent=2, ensure_ascii=False)
            print(f"  ✓ Updated cities in {filename}")
            
    print(f"Done! Cleaned up {fixed_count} course entries.")

if __name__ == "__main__":
    cleanup()
