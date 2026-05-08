import sqlite3

def upgrade():
    conn = sqlite3.connect('claims.db')
    cursor = conn.cursor()
    
    columns_to_add = [
        ("area_acres", "FLOAT"),
        ("area_hectares", "FLOAT"),
        ("ml_confidence", "FLOAT"),
        ("fraud_score", "FLOAT"),
        ("fraud_risk_level", "VARCHAR")
    ]
    
    for col_name, col_type in columns_to_add:
        try:
            cursor.execute(f"ALTER TABLE claims ADD COLUMN {col_name} {col_type};")
            print(f"Added {col_name} successfully.")
        except sqlite3.OperationalError as e:
            print(f"Column {col_name} might already exist:", e)
        
    conn.commit()
    conn.close()

if __name__ == '__main__':
    upgrade()
