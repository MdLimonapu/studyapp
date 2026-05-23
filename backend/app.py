from flask import Flask, jsonify, request
from flask_cors import CORS
import json

app = Flask(__name__)
CORS(app)

with open("data/germany.json") as f:
    all_courses = json.load(f)

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

@app.route("/api/countries")
def get_countries():
    return jsonify(COUNTRIES)

@app.route("/api/profile")
def get_profile():
    return jsonify({})

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
        results = [c for c in results if field.lower() in c.get("course", "").lower()]

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
        "total": len(formatted),
        "related_fields": []
    })

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)
