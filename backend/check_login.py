import urllib.request
import json
import urllib.parse
import urllib.error

url = 'http://localhost:8000/auth/login'
data = {
    "username": "admin@test.com",
    "password": "password123"
}
# Login endpoint expects form data, not JSON
data_encoded = urllib.parse.urlencode(data).encode('utf-8')

req = urllib.request.Request(url, data=data_encoded, method='POST')
# No specific headers needed for form-urlencoded usually, but let's be explicit if needed
# req.add_header('Content-Type', 'application/x-www-form-urlencoded')

try:
    with urllib.request.urlopen(req) as response:
        print("Status:", response.status)
        print("Headers:")
        for k, v in response.headers.items():
            print(f"{k}: {v}")
        print("Body:")
        print(response.read().decode())
except urllib.error.HTTPError as e:
    print("HTTP Error:", e.code)
    print(e.read().decode())
except Exception as e:
    print("Error:", e)
