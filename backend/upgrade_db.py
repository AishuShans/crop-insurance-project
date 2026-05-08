import sqlite3

def upgrade():
    conn = sqlite3.connect('claims.db')
    cursor = conn.cursor()
    
    try:
        cursor.execute("ALTER TABLE claims ADD COLUMN requested_claim_amount FLOAT;")
        print("Added requested_claim_amount successfully.")
    except sqlite3.OperationalError as e:
        print("Column requested_claim_amount might already exist:", e)
        
    try:
        cursor.execute("ALTER TABLE claims ADD COLUMN suggested_payout FLOAT;")
        print("Added suggested_payout successfully.")
    except sqlite3.OperationalError as e:
        print("Column suggested_payout might already exist:", e)
        
    conn.commit()
    conn.close()

if __name__ == '__main__':
    upgrade()
