import redis
import mysql.connector
import json
import os
import time

REDIS_HOST = os.getenv("REDIS_HOST", "redis")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))

MYSQL_HOST = os.getenv("MYSQL_HOST", "mysql")
MYSQL_PORT = int(os.getenv("MYSQL_PORT", 3306))
MYSQL_USER = os.getenv("MYSQL_USER", "voteuser")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "votepass")
MYSQL_DB = os.getenv("MYSQL_DB", "votesdb")


def get_mysql():
    for attempt in range(30):
        try:
            conn = mysql.connector.connect(
                host=MYSQL_HOST,
                port=MYSQL_PORT,
                user=MYSQL_USER,
                password=MYSQL_PASSWORD,
                database=MYSQL_DB
            )
            print(f"[worker] Connected to MySQL on attempt {attempt + 1}")
            return conn
        except Exception as e:
            print(f"[worker] MySQL not ready yet ({e}), retrying in 2s...")
            time.sleep(2)
    raise Exception("Could not connect to MySQL after 30 attempts")


def init_db(conn):
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS votes (
            id VARCHAR(255) NOT NULL UNIQUE,
            vote VARCHAR(255) NOT NULL
        )
    """)
    conn.commit()
    cursor.close()
    print("[worker] Database initialized")


def get_redis_conn():
    for attempt in range(30):
        try:
            r = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, decode_responses=True)
            r.ping()
            print(f"[worker] Connected to Redis on attempt {attempt + 1}")
            return r
        except Exception as e:
            print(f"[worker] Redis not ready yet ({e}), retrying in 2s...")
            time.sleep(2)
    raise Exception("Could not connect to Redis after 30 attempts")


def process_vote(conn, voter_id, vote):
    cursor = conn.cursor()
    cursor.execute(
        """
        INSERT INTO votes (id, vote) VALUES (%s, %s)
        ON DUPLICATE KEY UPDATE vote = %s
        """,
        (voter_id, vote, vote)
    )
    conn.commit()
    cursor.close()


def main():
    print("[worker] Starting up...")
    r = get_redis_conn()
    db = get_mysql()
    init_db(db)

    print("[worker] Waiting for votes...")
    while True:
        try:
            # Reconnect if connection dropped
            if not db.is_connected():
                print("[worker] MySQL disconnected, reconnecting...")
                db = get_mysql()

            result = r.blpop("votes", timeout=5)
            if result:
                _, raw = result
                data = json.loads(raw)
                voter_id = data["voter_id"]
                vote = data["vote"]
                process_vote(db, voter_id, vote)
                print(f"[worker] Processed vote: {voter_id[:8]}... → {vote}")

        except redis.RedisError as e:
            print(f"[worker] Redis error: {e}, reconnecting...")
            time.sleep(2)
            r = get_redis_conn()
        except mysql.connector.Error as e:
            print(f"[worker] MySQL error: {e}, reconnecting...")
            time.sleep(2)
            db = get_mysql()
        except Exception as e:
            print(f"[worker] Unexpected error: {e}")
            time.sleep(1)


if __name__ == "__main__":
    main()
