# promote_admin.py
import sqlite3
import os

db_path = "app/cinesphere.db" 

if not os.path.exists(db_path):
    # Try finding it?
    # Usually in backend/cinesphere.db
    db_path = "cinesphere.db"

try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("UPDATE users SET role = 'ADMIN' WHERE email = 'admin@test.com'")
    conn.commit()
    print(f"Updated {cursor.rowcount} rows. Admin promoted.")
    conn.close()
except Exception as e:
    print(e)
