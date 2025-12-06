import urllib.request
import json
import urllib.parse
import urllib.error
import time

BASE_URL = 'http://localhost:8000'

def login(email, password):
    url = f'{BASE_URL}/auth/login'
    data = urllib.parse.urlencode({"username": email, "password": password}).encode('utf-8')
    req = urllib.request.Request(url, data=data, method='POST')
    with urllib.request.urlopen(req) as response:
        return json.loads(response.read().decode())

def create_movie(token, title, duration):
    url = f'{BASE_URL}/api/admin/movies'
    data = json.dumps({"title": title, "duration_minutes": duration, "description": "Test", "poster_url": "http://example.com", "rating": "PG-13"}).encode('utf-8')
    headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
    req = urllib.request.Request(url, data=data, headers=headers, method='POST')
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode())
    except urllib.error.HTTPError as e:
        print(f"Create Movie Failed: {e.code} {e.read().decode()}")
        raise

def create_screen(token, name):
    url = f'{BASE_URL}/api/admin/screens'
    # 5x5 simple grid
    layout = {"rows": 5, "cols": 5, "aisles": [], "types": {}}
    data = json.dumps({"name": name, "layout": layout}).encode('utf-8')
    headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
    req = urllib.request.Request(url, data=data, headers=headers, method='POST')
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode())
    except urllib.error.HTTPError as e:
        print(f"Create Screen Failed: {e.code} {e.read().decode()}")
        raise

def create_showtime(token, movie_id, screen_id, time_str):
    url = f'{BASE_URL}/api/admin/showtimes'
    data = json.dumps({"movie_id": movie_id, "screen_id": screen_id, "start_time": time_str, "price": 100}).encode('utf-8')
    headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
    req = urllib.request.Request(url, data=data, headers=headers, method='POST')
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode())
    except urllib.error.HTTPError as e:
        print(f"Create Showtime Failed: {e.code} {e.read().decode()}")
        raise

def lock_seat(token, showtime_id, row, col):
    url = f'{BASE_URL}/api/bookings/lock'
    data = json.dumps({"showtime_id": showtime_id, "row": row, "col": col}).encode('utf-8')
    headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
    req = urllib.request.Request(url, data=data, headers=headers, method='POST')
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode())
    except urllib.error.HTTPError as e:
        print(f"Lock Seat Failed: {e.code} {e.read().decode()}")
        raise

def run_verify():
    print("1. Login as Admin...")
    auth = login("admin@test.com", "password123")
    token = auth['access_token']
    print("   Success. Token obtained.")

    print("2. Create Movie...")
    movie = create_movie(token, "Inception Test", 148)
    print(f"   Success. Movie ID: {movie['id']}")

    print("3. Create Screen...")
    screen = create_screen(token, "IMAX Test")
    print(f"   Success. Screen ID: {screen['id']}")

    print("4. Create Showtime...")
    # Use a future time
    import datetime
    future_time = (datetime.datetime.utcnow() + datetime.timedelta(days=1)).isoformat()
    showtime = create_showtime(token, movie['id'], screen['id'], future_time)
    print(f"   Success. Showtime ID: {showtime['id']}")

    print("5. Lock Seat (as Admin/User)...")
    lock = lock_seat(token, showtime['id'], 2, 2)
    print(f"   Success. Lock Status: {lock['status']}")

    print("\nFULL FLOW VERIFIED SUCCESSFULLY.")

if __name__ == "__main__":
    try:
        run_verify()
    except Exception as e:
        print(f"\nExample Failed: {e}")
