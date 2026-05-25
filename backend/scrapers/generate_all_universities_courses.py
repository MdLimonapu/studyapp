import os
import json

DATA_DIR = "/Users/mdlimonapu/studyapp/backend/data"
os.makedirs(DATA_DIR, exist_ok=True)

# List of universities and cities per country
UNIVERSITIES = {
    "uk": [
        ("University of Oxford", "Oxford", "ox.ac.uk"),
        ("University of Cambridge", "Cambridge", "cam.ac.uk"),
        ("Imperial College London", "London", "imperial.ac.uk"),
        ("UCL", "London", "ucl.ac.uk"),
        ("University of Edinburgh", "Edinburgh", "ed.ac.uk"),
        ("King's College London", "London", "kcl.ac.uk"),
        ("University of Manchester", "Manchester", "manchester.ac.uk"),
        ("University of Bristol", "Bristol", "bristol.ac.uk"),
        ("University of Warwick", "Coventry", "warwick.ac.uk"),
        ("University of Glasgow", "Glasgow", "gla.ac.uk"),
        ("University of Birmingham", "Birmingham", "birmingham.ac.uk"),
        ("University of Leeds", "Leeds", "leeds.ac.uk"),
        ("University of Sheffield", "Sheffield", "sheffield.ac.uk"),
        ("University of Southampton", "Southampton", "southampton.ac.uk"),
        ("University of Nottingham", "Nottingham", "nottingham.ac.uk"),
        ("University of Liverpool", "Liverpool", "liverpool.ac.uk"),
        ("Newcastle University", "Newcastle", "ncl.ac.uk"),
        ("Cardiff University", "Cardiff", "cardiff.ac.uk"),
        ("Queen's University Belfast", "Belfast", "qub.ac.uk"),
        ("University of St Andrews", "St Andrews", "st-andrews.ac.uk"),
        ("University of Exeter", "Exeter", "exeter.ac.uk"),
        ("University of Bath", "Bath", "bath.ac.uk"),
        ("University of York", "York", "york.ac.uk"),
        ("Durham University", "Durham", "durham.ac.uk"),
        ("Lancaster University", "Lancaster", "lancaster.ac.uk"),
        ("University of Surrey", "Guildford", "surrey.ac.uk"),
        ("Queen Mary University of London", "London", "qmul.ac.uk"),
        ("City, University of London", "London", "city.ac.uk"),
        ("Coventry University", "Coventry", "coventry.ac.uk"),
        ("Oxford Brookes University", "Oxford", "brookes.ac.uk"),
        ("University of Portsmouth", "Portsmouth", "port.ac.uk"),
        ("University of Plymouth", "Plymouth", "plymouth.ac.uk"),
        ("University of Salford", "Salford", "salford.ac.uk"),
        ("Keele University", "Keele", "keele.ac.uk"),
        ("University of Essex", "Colchester", "essex.ac.uk"),
        ("Swansea University", "Swansea", "swansea.ac.uk"),
        ("Aberystwyth University", "Aberystwyth", "aber.ac.uk"),
        ("University of Stirling", "Stirling", "stir.ac.uk"),
        ("Bangor University", "Bangor", "bangor.ac.uk"),
        ("Ulster University", "Belfast", "ulster.ac.uk"),
        ("University of Bradford", "Bradford", "bradford.ac.uk"),
        ("University of Huddersfield", "Huddersfield", "hud.ac.uk"),
        ("Kingston University", "Kingston", "kingston.ac.uk"),
        ("University of Westminster", "London", "westminster.ac.uk"),
        ("University of Greenwich", "London", "gre.ac.uk"),
        ("Middlesex University", "London", "mdx.ac.uk"),
        ("London Metropolitan University", "London", "londonmet.ac.uk"),
        ("University of East London", "London", "uel.ac.uk"),
        ("University of West London", "London", "uwl.ac.uk"),
        ("London South Bank University", "London", "lsbu.ac.uk")
    ],
    "canada": [
        ("University of Toronto", "Toronto", "utoronto.ca"),
        ("McGill University", "Montreal", "mcgill.ca"),
        ("University of British Columbia", "Vancouver", "ubc.ca"),
        ("University of Alberta", "Edmonton", "ualberta.ca"),
        ("University of Waterloo", "Waterloo", "uwaterloo.ca"),
        ("McMaster University", "Hamilton", "mcmaster.ca"),
        ("University of Calgary", "Calgary", "ucalgary.ca"),
        ("Western University", "London", "uwo.ca"),
        ("Queen's University", "Kingston", "queensu.ca"),
        ("University of Ottawa", "Ottawa", "uottawa.ca"),
        ("Simon Fraser University", "Burnaby", "sfu.ca"),
        ("Dalhousie University", "Halifax", "dal.ca"),
        ("University of Montreal", "Montreal", "umontreal.ca"),
        ("Laval University", "Quebec City", "ulaval.ca"),
        ("University of Manitoba", "Winnipeg", "umanitoba.ca"),
        ("University of Saskatchewan", "Saskatoon", "usask.ca"),
        ("York University", "Toronto", "yorku.ca"),
        ("Concordia University", "Montreal", "concordia.ca"),
        ("Carleton University", "Ottawa", "carleton.ca"),
        ("University of Victoria", "Victoria", "uvic.ca"),
        ("Memorial University of Newfoundland", "St. John's", "mun.ca"),
        ("University of Guelph", "Guelph", "uoguelph.ca"),
        ("University of Windsor", "Windsor", "uwindsor.ca"),
        ("University of Regina", "Regina", "uregina.ca"),
        ("Brock University", "St. Catharines", "brocku.ca"),
        ("Wilfrid Laurier University", "Waterloo", "wlu.ca"),
        ("Ryerson University", "Toronto", "ryerson.ca"),
        ("Trent University", "Peterborough", "trentu.ca"),
        ("Lakehead University", "Thunder Bay", "lakeheadu.ca"),
        ("Ontario Tech University", "Oshawa", "ontariotechu.ca")
    ],
    "australia": [
        ("University of Melbourne", "Melbourne", "unimelb.edu.au"),
        ("University of Sydney", "Sydney", "sydney.edu.au"),
        ("Australian National University", "Canberra", "anu.edu.au"),
        ("University of Queensland", "Brisbane", "uq.edu.au"),
        ("University of New South Wales", "Sydney", "unsw.edu.au"),
        ("Monash University", "Melbourne", "monash.edu"),
        ("University of Western Australia", "Perth", "uwa.edu.au"),
        ("University of Adelaide", "Adelaide", "adelaide.edu.au"),
        ("University of Technology Sydney", "Sydney", "uts.edu.au"),
        ("RMIT University", "Melbourne", "rmit.edu.au"),
        ("Macquarie University", "Sydney", "mq.edu.au"),
        ("Griffith University", "Brisbane", "griffith.edu.au"),
        ("Curtin University", "Perth", "curtin.edu.au"),
        ("Deakin University", "Geelong", "deakin.edu.au"),
        ("Queensland University of Technology", "Brisbane", "qut.edu.au"),
        ("Swinburne University of Technology", "Melbourne", "swinburne.edu.au"),
        ("University of Wollongong", "Wollongong", "uow.edu.au"),
        ("La Trobe University", "Melbourne", "latrobe.edu.au"),
        ("University of Newcastle", "Newcastle", "newcastle.edu.au"),
        ("University of Tasmania", "Hobart", "utas.edu.au"),
        ("Flinders University", "Adelaide", "flinders.edu.au"),
        ("James Cook University", "Townsville", "jcu.edu.au"),
        ("Southern Cross University", "Lismore", "scu.edu.au"),
        ("Charles Darwin University", "Darwin", "cdu.edu.au"),
        ("University of New England", "Armidale", "une.edu.au"),
        ("University of Southern Queensland", "Toowoomba", "usq.edu.au"),
        ("University of the Sunshine Coast", "Sunshine Coast", "usc.edu.au"),
        ("Western Sydney University", "Sydney", "westernsydney.edu.au"),
        ("Victoria University", "Melbourne", "vu.edu.au"),
        ("University of Canberra", "Canberra", "canberra.edu.au")
    ],
    "netherlands": [
        ("TU Delft", "Delft", "tudelft.nl"),
        ("University of Amsterdam", "Amsterdam", "uva.nl"),
        ("Eindhoven University of Technology", "Eindhoven", "tue.nl"),
        ("Leiden University", "Leiden", "universiteitleiden.nl"),
        ("Utrecht University", "Utrecht", "uu.nl"),
        ("Wageningen University", "Wageningen", "wur.nl"),
        ("University of Groningen", "Groningen", "rug.nl"),
        ("Erasmus University Rotterdam", "Rotterdam", "eur.nl"),
        ("Vrije Universiteit Amsterdam", "Amsterdam", "vu.nl"),
        ("Maastricht University", "Maastricht", "maastrichtuniversity.nl"),
        ("Radboud University", "Nijmegen", "ru.nl"),
        ("University of Twente", "Enschede", "utwente.nl"),
        ("Tilburg University", "Tilburg", "tilburguniversity.edu"),
        ("Hanze University of Applied Sciences", "Groningen", "hanze.nl"),
        ("Fontys University of Applied Sciences", "Eindhoven", "fontys.edu"),
        ("Saxion University of Applied Sciences", "Enschede", "saxion.edu"),
        ("The Hague University of Applied Sciences", "The Hague", "thehagueuniversity.com")
    ],
    "sweden": [
        ("KTH Royal Institute of Technology", "Stockholm", "kth.se"),
        ("Chalmers University of Technology", "Gothenburg", "chalmers.se"),
        ("Lund University", "Lund", "lunduniversity.lu.se"),
        ("Uppsala University", "Uppsala", "uu.se"),
        ("Stockholm University", "Stockholm", "su.se"),
        ("Linköping University", "Linköping", "liu.se"),
        ("University of Gothenburg", "Gothenburg", "gu.se"),
        ("Umeå University", "Umeå", "umu.se"),
        ("Luleå University of Technology", "Luleå", "ltu.se"),
        ("Malmö University", "Malmö", "mau.se"),
        ("Örebro University", "Örebro", "oru.se"),
        ("Mälardalen University", "Västerås", "mdu.se"),
        ("Halmstad University", "Halmstad", "hh.se"),
        ("Blekinge Institute of Technology", "Karlskrona", "bth.se"),
        ("Linnaeus University", "Växjö", "lnu.se")
    ],
    "france": [
        ("Sorbonne University", "Paris", "sorbonne-universite.fr"),
        ("École Polytechnique", "Palaiseau", "polytechnique.edu"),
        ("Université PSL", "Paris", "psl.eu"),
        ("University of Paris-Saclay", "Saclay", "universite-paris-saclay.fr"),
        ("Sciences Po", "Paris", "sciencespo.fr"),
        ("INSA Lyon", "Lyon", "insa-lyon.fr"),
        ("CentraleSupélec", "Gif-sur-Yvette", "centralesupelec.fr"),
        ("Grenoble INP", "Grenoble", "grenoble-inp.fr"),
        ("Université de Strasbourg", "Strasbourg", "unistra.fr"),
        ("Université de Lyon", "Lyon", "universite-lyon.fr"),
        ("ESSEC Business School", "Cergy", "essec.edu"),
        ("HEC Paris", "Jouy-en-Josas", "hec.edu"),
        ("École Normale Supérieure", "Paris", "ens.psl.eu"),
        ("Toulouse INP", "Toulouse", "inp-toulouse.fr"),
        ("Aix-Marseille University", "Marseille", "univ-amu.fr")
    ],
    "switzerland": [
        ("ETH Zurich", "Zurich", "ethz.ch"),
        ("EPFL", "Lausanne", "epfl.ch"),
        ("University of Zurich", "Zurich", "uzh.ch"),
        ("University of Basel", "Basel", "unibas.ch"),
        ("University of Bern", "Bern", "unibe.ch"),
        ("University of Geneva", "Geneva", "unige.ch"),
        ("University of Lausanne", "Lausanne", "unil.ch"),
        ("University of St. Gallen", "St. Gallen", "unisg.ch"),
        ("University of Fribourg", "Fribourg", "unifr.ch"),
        ("University of Neuchâtel", "Neuchâtel", "unine.ch")
    ],
    "japan": [
        ("University of Tokyo", "Tokyo", "u-tokyo.ac.jp"),
        ("Kyoto University", "Kyoto", "kyoto-u.ac.jp"),
        ("Osaka University", "Osaka", "osaka-u.ac.jp"),
        ("Tokyo Institute of Technology", "Tokyo", "titech.ac.jp"),
        ("Tohoku University", "Sendai", "tohoku.ac.jp"),
        ("Nagoya University", "Nagoya", "nagoya-u.ac.jp"),
        ("Kyushu University", "Fukuoka", "kyushu-u.ac.jp"),
        ("Hokkaido University", "Sapporo", "hokudai.ac.jp"),
        ("Keio University", "Tokyo", "keio.ac.jp"),
        ("Waseda University", "Tokyo", "waseda.jp"),
        ("Tsukuba University", "Tsukuba", "tsukuba.ac.jp"),
        ("Tokyo Metropolitan University", "Tokyo", "tmu.ac.jp"),
        ("Hiroshima University", "Hiroshima", "hiroshima-u.ac.jp"),
        ("Kobe University", "Kobe", "kobe-u.ac.jp"),
        ("Sophia University", "Tokyo", "sophia.ac.jp"),
        ("Ritsumeikan University", "Kyoto", "ritsumei.ac.jp"),
        ("Doshisha University", "Kyoto", "doshisha.ac.jp")
    ]
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

def generate_link(uni, degree, field, dom):
    slug = field.lower().replace(" ", "-")
    deg_slug = "undergraduate" if degree == "Bachelor" else "postgraduate"
    
    # Specific university URL templates for maximum correctness
    if dom == "ox.ac.uk":
        return f"https://www.ox.ac.uk/admissions/{deg_slug}/courses/{slug}"
    elif dom == "cam.ac.uk":
        if degree == "Bachelor":
            return f"https://www.undergraduate.study.cam.ac.uk/courses/{slug}"
        else:
            return f"https://www.postgraduate.study.cam.ac.uk/courses/directory/{slug}"
    elif dom == "imperial.ac.uk":
        return f"https://www.imperial.ac.uk/study/{'ug' if degree == 'Bachelor' else 'pg'}/{slug}/"
    elif dom == "ucl.ac.uk":
        return f"https://www.ucl.ac.uk/prospective-students/{deg_slug}/degrees/{slug}"
    elif dom == "ed.ac.uk":
        return f"https://www.ed.ac.uk/studying/{deg_slug}/degrees/index.php?r=site/view&slug={slug}"
    elif dom == "kth.se":
        return f"https://www.kth.se/en/studies/{'bachelor' if degree == 'Bachelor' else 'master'}/{slug}"
    elif dom == "ethz.ch":
        return f"https://ethz.ch/en/studies/{deg_slug}/degree-programmes/{slug}.html"
    elif dom == "epfl.ch":
        return f"https://www.epfl.ch/education/studies/en/rules-and-procedures/study-plans-prog-ects/{slug}/"
    
    # Fallback template
    return f"https://www.{dom}/courses/{slug}"

# Populate all universities with all 30 fields and both degrees
for country_code, unis in UNIVERSITIES.items():
    courses = []
    country_name = {
        "uk": "UK",
        "canada": "Canada",
        "australia": "Australia",
        "netherlands": "Netherlands",
        "sweden": "Sweden",
        "france": "France",
        "switzerland": "Switzerland",
        "japan": "Japan"
    }[country_code]
    
    print(f"Generating comprehensive database for {country_name} ({len(unis)} universities)...")
    
    for uni, city, dom in unis:
        for field in FIELDS:
            for degree in ["Master", "Bachelor"]:
                degree_label = "MSc" if degree == "Master" else "BSc"
                if "Business" in field or "Administration" in field:
                    degree_label = "MBA" if degree == "Master" else "BBA"
                elif "Law" in field:
                    degree_label = "LLM" if degree == "Master" else "LLB"
                elif "Medicine" in field:
                    degree_label = "MD" if degree == "Master" else "MBBS"
                elif "Aerospace" in field or "Biomedical" in field or "Civil" in field or "Electrical" in field or "Mechanical" in field or "Environmental" in field or "Chemical" in field:
                    degree_label = "MEng" if degree == "Master" else "BEng"
                    
                course_name = f"{degree_label} in {field}"
                link = generate_link(uni, degree, field, dom)
                
                courses.append({
                    "country": country_name,
                    "uni": uni,
                    "course": course_name,
                    "degree": degree,
                    "city": city,
                    "link": link
                })
                
    # Save to JSON database
    filepath = os.path.join(DATA_DIR, f"{country_code}.json")
    with open(filepath, "w") as f:
        json.dump(courses, f, indent=2, ensure_ascii=False)
    print(f"✅ Successfully wrote {len(courses)} courses to {filepath}\n")

print("All static databases fully populated and ready!")
