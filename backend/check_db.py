import sqlite3
import os

db_path = r'd:\crop insurance enhancement -2 sathya\crop_insurance\backend\claims.db'
if not os.path.exists(db_path):
    print("Database not found at", db_path)
else:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("PRAGMA table_info(claims)")
    columns = cursor.fetchall()
    for col in columns:
        print(col)
    conn.close()
