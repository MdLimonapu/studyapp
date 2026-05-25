"""
USA university course scraper.
Source: College Scorecard API (free, official, from US Department of Education)
API docs: https://collegescorecard.ed.gov/data/documentation/
"""
import requests
import json
import os
import time

# Free API key - register at https://api.data.gov/signup/
# Using a demo key (limited rate) — replace with your own for production
API_KEY = "DEMO_KEY"  # Replace with your registered key for higher rate limits

BASE_URL = "https://api.data.gov/ed/collegescorecard/v1/schools"

# CIP (Classification of Instructional Programs) code prefixes for major fields
# See: https://nces.ed.gov/ipeds/cipcode/
FIELD_CIP_MAP = {
    "Computer Science": "11",
    "Electrical Engineering": "14.10",
    "Mechanical Engineering": "14.19",
    "Civil Engineering": "14.08",
    "Chemical Engineering": "14.07",
    "Aerospace Engineering": "14.02",
    "Biomedical Engineering": "14.05",
    "Environmental Engineering": "14.14",
    "Data Science": "30.70",
    "Information Technology": "11.01",
    "Artificial Intelligence": "11.08",
    "Software Engineering": "14.09",
    "Cybersecurity": "11.10",
    "Business Administration": "52",
    "Finance": "52.08",
    "Marketing": "52.14",
    "Economics": "45.06",
    "Mathematics": "27",
    "Physics": "40.08",
    "Chemistry": "40.05",
    "Biology": "26",
    "Psychology": "42",
    "Architecture": "04",
    "Law": "22",
    "Nursing": "51.38",
    "Medicine": "51",
    "Robotics": "14.42",
    "Telecommunications": "09.09",
    "Power Systems": "14.10",
    "Embedded Systems": "14.10",
}

# Map state abbreviations to full names for city lookup
STATE_MAP = {
    "AL": "Alabama", "AK": "Alaska", "AZ": "Arizona", "AR": "Arkansas",
    "CA": "California", "CO": "Colorado", "CT": "Connecticut", "DE": "Delaware",
    "FL": "Florida", "GA": "Georgia", "HI": "Hawaii", "ID": "Idaho",
    "IL": "Illinois", "IN": "Indiana", "IA": "Iowa", "KS": "Kansas",
    "KY": "Kentucky", "LA": "Louisiana", "ME": "Maine", "MD": "Maryland",
    "MA": "Massachusetts", "MI": "Michigan", "MN": "Minnesota", "MS": "Mississippi",
    "MO": "Missouri", "MT": "Montana", "NE": "Nebraska", "NV": "Nevada",
    "NH": "New Hampshire", "NJ": "New Jersey", "NM": "New Mexico", "NY": "New York",
    "NC": "North Carolina", "ND": "North Dakota", "OH": "Ohio", "OK": "Oklahoma",
    "OR": "Oregon", "PA": "Pennsylvania", "RI": "Rhode Island", "SC": "South Carolina",
    "SD": "South Dakota", "TN": "Tennessee", "TX": "Texas", "UT": "Utah",
    "VT": "Vermont", "VA": "Virginia", "WA": "Washington", "WV": "West Virginia",
    "WI": "Wisconsin", "WY": "Wyoming", "DC": "District of Columbia",
}


def scrape_usa(api_key=None, max_schools=500):
    """
    Scrape USA university data using the College Scorecard API.
    For each school, generates course entries for fields they likely offer.
    """
    key = api_key or os.environ.get("DATA_GOV_API_KEY", API_KEY)
    courses = []
    seen_schools = set()

    print("🇺🇸 Scraping USA universities via College Scorecard API...")

    # Fetch top schools (4-year institutions, large enrollment, accepting students)
    page = 0
    per_page = 100

    while len(seen_schools) < max_schools:
        params = {
            "api_key": key,
            "school.degrees_awarded.predominant": "3",  # Bachelor's-granting
            "school.ownership__range": "1..2",  # Public or private non-profit
            "fields": (
                "school.name,school.city,school.state,"
                "school.school_url,"
                "latest.programs.cip_4_digit"
            ),
            "page": page,
            "per_page": per_page,
        }

        try:
            res = requests.get(BASE_URL, params=params, timeout=30)
            if res.status_code == 429:
                print(f"  ⚠️  Rate limited. Waiting 60 seconds...")
                time.sleep(60)
                continue
            if res.status_code != 200:
                print(f"  ⚠️  API returned {res.status_code}: {res.text[:200]}")
                break

            data = res.json()
            results = data.get("results", [])
            if not results:
                break

            for school in results:
                name = school.get("school.name", "")
                if not name or name in seen_schools:
                    continue
                seen_schools.add(name)

                city = school.get("school.city", "")
                state = school.get("school.state", "")
                url = school.get("school.school_url", "")
                if url and not url.startswith("http"):
                    url = "https://" + url

                # Get CIP programs offered
                cip_programs = school.get("latest.programs.cip_4_digit", [])
                offered_cips = set()
                if cip_programs and isinstance(cip_programs, list):
                    for prog in cip_programs:
                        code = prog.get("code", "")
                        if code:
                            offered_cips.add(code[:2])  # Major field prefix
                            offered_cips.add(code[:5])  # More specific

                # Generate course entries for relevant fields
                for field, cip_prefix in FIELD_CIP_MAP.items():
                    # Check if this school likely offers this field
                    cip_major = cip_prefix[:2]
                    if offered_cips and cip_major not in offered_cips:
                        continue

                    # Build link: use school URL or Google search
                    if url:
                        link = url
                    else:
                        import urllib.parse
                        q = f"{name} {field} program"
                        link = f"https://www.google.com/search?q={urllib.parse.quote_plus(q)}"

                    for degree in ["Master", "Bachelor"]:
                        degree_label = "MSc" if degree == "Master" else "BSc"
                        courses.append({
                            "country": "USA",
                            "uni": name,
                            "course": f"{degree_label} in {field}",
                            "degree": degree,
                            "city": city,
                            "link": link,
                        })

            page += 1
            print(f"  Page {page} — {len(seen_schools)} schools, {len(courses)} course entries...")
            time.sleep(1)  # Rate limit

        except requests.exceptions.RequestException as e:
            print(f"  ⚠️  Request error: {e}")
            time.sleep(5)
            page += 1

    # Save
    output_path = os.path.join(os.path.dirname(__file__), "..", "data", "usa.json")
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w") as f:
        json.dump(courses, f, indent=2, ensure_ascii=False)

    print(f"\n✅ USA Done! {len(seen_schools)} schools, {len(courses)} courses saved to data/usa.json")
    return courses


if __name__ == "__main__":
    scrape_usa()
