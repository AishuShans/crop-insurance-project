import sqlite3
import os

DB_PATH = "claims.db"

def create_admin_user():
    # Connect to the SQLite database
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Create an admins table if it doesn't exist
    # Note: Currently models.py does not define an Admin model,
    # but we create the table here to satisfy the requirement.
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS admins (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL
        )
    """)

    # We use a plain-text password or a simple hash since there is no auth route yet
    # that expects a specific hash like bcrypt. If you add passlib/bcrypt later,
    # you can update this to hash the password properly.
    username = "admin"
    password = "admin123"

    try:
        cursor.execute(
            "INSERT INTO admins (username, password_hash) VALUES (?, ?)",
            (username, password)
        )
        conn.commit()
        print(f"Successfully created admin user '{username}' with password '{password}' in {DB_PATH}.")
    except sqlite3.IntegrityError:
        print(f"User '{username}' already exists.")
    finally:
        conn.close()

if __name__ == "__main__":
    if not os.path.exists(DB_PATH):
        print(f"Warning: {DB_PATH} not found in current directory. Make sure you are in the backend folder.")
    create_admin_user()
