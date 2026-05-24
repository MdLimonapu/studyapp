from flask import Flask, jsonify, request
from flask_cors import CORS
import json, os

app = Flask(__name__)
CORS(app)

try:
    with open("data/germany.json") as f:
        all_courses = json.load(f)
except FileNotFoundError:
    all_courses = []
    print("Warning: data/germany.json not found. Search will return no results.")

COUNTRIES = [
    {"name": "Germany", "flag": "🇩🇪"},
    {"name": "UK", "flag": "🇬🇧"},
    {"name": "USA", "flag": "🇺🇸"},
    {"name": "Canada", "flag": "🇨🇦"},
    {"name": "Australia", "flag": "🇦🇺"},
    {"name": "Netherlands", "flag": "🇳🇱"},
    {"name": "Sweden", "flag": "🇸🇪"},
    {"name": "France", "flag": "🇫🇷"},
    {"name": "Switzerland", "flag": "🇨🇭"},
    {"name": "Japan", "flag": "🇯🇵"}
]

PROFILE_FILE = "profile.json"

FIELD_ALIASES = {
    "electrical engineering": ["elektrotechnik", "electrical", "elektro", "power systems", "energy"],
    "computer science": ["informatik", "computer", "computing", "softwaretechnik"],
    "mechanical engineering": ["maschinenbau", "mechanical", "konstruktion"],
    "data science": ["data", "datenwissenschaft", "analytics"],
    "business administration": ["betriebswirtschaft", "bwl", "business", "management"],
    "civil engineering": ["bauingenieur", "civil", "bau"],
    "aerospace engineering": ["luft", "raumfahrt", "aerospace"],
    "artificial intelligence": ["künstliche intelligenz", "ki", "ai", "artificial"],
    "information technology": ["informationstechnik", "it", "information technology"],
    "software engineering": ["software", "softwareentwicklung"],
    "biomedical engineering": ["biomedizin", "medizintechnik", "biomedical"],
    "robotics": ["robotik", "robotics", "automation"],
}

def field_matches(course_name, field):
    field_lower = field.lower()
    course_lower = course_name.lower()
    if field_lower in course_lower:
        return True
    for key, aliases in FIELD_ALIASES.items():
        if field_lower in key or key in field_lower:
            for alias in aliases:
                if alias in course_lower:
                    return True
    return False

@app.route("/api/countries")
def get_countries():
    return jsonify(COUNTRIES)

@app.route("/api/profile", methods=["GET"])
def get_profile():
    if os.path.exists(PROFILE_FILE):
        with open(PROFILE_FILE) as f:
            return jsonify(json.load(f))
    return jsonify({})

@app.route("/api/profile", methods=["POST"])
def save_profile():
    data = request.json
    with open(PROFILE_FILE, "w") as f:
        json.dump(data, f)
    return jsonify({"status": "saved"})

@app.route("/api/news")
def get_news():
    return jsonify([])

@app.route("/api/search", methods=["POST"])
def search():
    body = request.json
    country = body.get("country", "")
    degree = body.get("degree", "")
    field = body.get("field", "")

    results = all_courses
    if country:
        results = [c for c in results if country.lower() in c.get("country", "").lower()]
    if degree:
        results = [c for c in results if degree.lower() in c.get("degree", "").lower()]
    if field:
        results = [c for c in results if field_matches(c.get("course", ""), field)]

    total_count = len(results)
    formatted = [{
        "country": c.get("country", ""),
        "university": c.get("uni", ""),
        "course": c.get("course", ""),
        "degree": c.get("degree", ""),
        "city": c.get("city", ""),
        "link": c.get("link", ""),
        "intake": "Winter / Summer",
        "fee": "See website"
    } for c in results[:50]]

    return jsonify({
        "results": formatted,
        "total": total_count,
        "related_fields": []
    })

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)
