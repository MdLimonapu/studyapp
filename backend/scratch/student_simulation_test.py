import requests

BACKEND_URL = "http://localhost:5001"

def test_get_countries():
    print("🎓 Student action: Checking available countries...")
    res = requests.get(f"{BACKEND_URL}/api/countries")
    countries = res.json()
    names = [c.get("name") for c in countries]
    print(f"  ✓ Available countries: {', '.join(names)}")
    assert "Sweden" in names
    assert "Japan" in names
    assert "Switzerland" in names

def test_search_japan():
    print("\n🎓 Student action: Searching for 'Master' programs in 'Japan'...")
    search_data = {
        "country": "Japan",
        "degree": "Master",
        "field": ""
    }
    res = requests.post(f"{BACKEND_URL}/api/search", json=search_data)
    results = res.json().get("results", [])
    print(f"  ✓ Found {len(results)} Master programs in Japan.")
    if results:
        print(f"  ✓ Sample keys: {results[0].keys()}")
        print(f"  ✓ Sample item: {results[0]}")
    
    # Check first few results
    for i, item in enumerate(results[:3]):
        print(f"    {i+1}. {item.get('uni', item.get('university'))} - {item.get('course', item.get('program'))} ({item['degree']})")
        print(f"       Direct link: {item['link']}")
        # Assertions
        assert "studyinjapan.go.jp" in item['link']
        assert item['country'] == "Japan"

def test_search_sweden():
    print("\n🎓 Student action: Searching for 'Computer Science' programs in 'Sweden'...")
    search_data = {
        "country": "Sweden",
        "degree": "",
        "field": "Computer Science"
    }
    res = requests.post(f"{BACKEND_URL}/api/search", json=search_data)
    results = res.json().get("results", [])
    print(f"  ✓ Found {len(results)} Computer Science programs in Sweden.")
    
    # Check first few results
    for i, item in enumerate(results[:3]):
        print(f"    {i+1}. {item['university']} - {item['course']} ({item['degree']})")
        print(f"       Direct link: {item['link']}")
        assert item['country'] == "Sweden"
        assert item['link'].startswith("http")

def test_search_switzerland():
    print("\n🎓 Student action: Searching for 'Bachelor' programs in 'Switzerland'...")
    search_data = {
        "country": "Switzerland",
        "degree": "Bachelor",
        "field": ""
    }
    res = requests.post(f"{BACKEND_URL}/api/search", json=search_data)
    results = res.json().get("results", [])
    print(f"  ✓ Found {len(results)} Bachelor programs in Switzerland.")
    
    # Check first few results
    for i, item in enumerate(results[:3]):
        print(f"    {i+1}. {item['university']} - {item['course']} ({item['degree']})")
        print(f"       Direct link: {item['link']}")
        assert "studyprogrammes.ch" in item['link']
        assert item['country'] == "Switzerland"

if __name__ == "__main__":
    try:
        test_get_countries()
        test_search_japan()
        test_search_sweden()
        test_search_switzerland()
        print("\n🎉 Student simulation tests completed successfully!")
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
