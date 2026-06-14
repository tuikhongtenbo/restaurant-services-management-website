import psycopg2

try:
    conn = psycopg2.connect("postgresql://postgres:postgres@localhost:5432/restaurant_db")
    cur = conn.cursor()
    cur.execute("UPDATE tables SET status = 'EMPTY' WHERE status IS NULL;")
    conn.commit()
    print(f"Updated {cur.rowcount} tables.")
except Exception as e:
    print(e)
