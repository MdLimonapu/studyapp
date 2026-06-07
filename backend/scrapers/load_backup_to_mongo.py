import os
import json
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"))
MONGO_URI = os.environ.get("MONGO_URI")

def main():
    backup_path = os.path.join(
        os.path.dirname(os.path.dirname(__file__)), "data", "articles_backup.json"
    )
    if not os.path.exists(backup_path):
        print(f"❌ Backup file not found at {backup_path}")
        return
        
    with open(backup_path, "r") as f:
        articles = json.load(f)
        
    print(f"Loaded {len(articles)} articles from backup.")
    
    if MONGO_URI:
        try:
            from pymongo import MongoClient
            import urllib.parse
            
            mongo_client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000, tlsAllowInvalidCertificates=True)
            db_name = "studplex"
            parsed_uri = urllib.parse.urlparse(MONGO_URI)
            if parsed_uri.path and parsed_uri.path != "/":
                db_name = parsed_uri.path.strip("/")
                
            db = mongo_client[db_name]
            articles_col = db["articles"]
            articles_col.create_index("slug", unique=True)
            
            inserted_count = 0
            for art in articles:
                articles_col.replace_one({"slug": art["slug"]}, art, upsert=True)
                inserted_count += 1
                
            print(f"✅ Successfully pushed {inserted_count} articles to Cloud MongoDB Atlas.")
        except Exception as e:
            print(f"❌ Error writing to MongoDB: {e}")
    else:
        print("⚠️ MONGO_URI not configured. Articles are stored in local fallback cache.")

if __name__ == "__main__":
    main()
