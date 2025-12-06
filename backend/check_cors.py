import urllib.request
import urllib.error

url = 'http://localhost:8000/auth/register'
headers = {
    'Origin': 'http://localhost:5173',
    'Access-Control-Request-Method': 'POST',
    'Access-Control-Request-Headers': 'content-type'
}

req = urllib.request.Request(url, headers=headers, method='OPTIONS')
try:
    with urllib.request.urlopen(req) as response:
        print("Status:", response.status)
        print("Headers:")
        for k, v in response.headers.items():
            print(f"{k}: {v}")
except urllib.error.HTTPError as e:
    print("HTTP Error:", e.code)
    print("Headers:")
    for k, v in e.headers.items():
        print(f"{k}: {v}")
except Exception as e:
    print("Error:", e)
