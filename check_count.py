import requests
try:
    res = requests.get("http://localhost:8000/god-mode").json()
    print(f"Total Stocks Returned: {len(res['data'])}")
except Exception as e:
    print(e)
