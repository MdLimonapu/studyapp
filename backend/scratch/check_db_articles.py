import os
import urllib.parse
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"))

def main():
    mongo_uri = os.environ.get("MONGO_URI")
    if not mongo_uri:
        print("❌ MONGO_URI is not set in environment.")
        return
        
    try:
        client = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000, tlsAllowInvalidCertificates=True)
        db_name = "studyapp"
        parsed_uri = urllib.parse.urlparse(mongo_uri)
        if parsed_uri.path and parsed_uri.path != "/":
            db_name = parsed_uri.path.strip("/")
            
        db = client[db_name]
        articles_col = db["articles"]
        
        # Fetch articles sorted by date descending or just list them all with dates
        articles = list(articles_col.find({}, {"title": 1, "date": 1, "slug": 1, "country": 1}))
        print(f"Total articles found: {len(articles)}")
        
        # Sort by date descending
        articles.sort(key=lambda x: x.get("date", ""), reverse=True)
        
        print("\nLatest 15 articles:")
        for idx, art in enumerate(articles[:15]):
            print(f"{idx+1}. [{art.get('date', 'N/A')}] ({art.get('country', 'Global')}) {art.get('title')} - slug: {art.get('slug')}")
            
    except Exception as e:
        print(f"❌ Error connecting to database: {e}")

if __name__ == "__main__":
    main()
