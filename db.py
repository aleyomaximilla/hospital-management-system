import pymysql
from config import Config


def get_db_connection():
    """
    Opens a new connection to the MySQL database.
    Uses DictCursor so query results come back as dictionaries (easier to use in templates).
    """
    connection = pymysql.connect(
        host=Config.MYSQL_HOST,
        user=Config.MYSQL_USER,
        password=Config.MYSQL_PASSWORD,
        db=Config.MYSQL_DB,
        port=Config.MYSQL_PORT,
        cursorclass=pymysql.cursors.DictCursor,
        autocommit=True
    )
    return connection


def run_query(query, params=None, fetch=True, fetchone=False):
    """
    Runs a parameterized SQL query safely (protects against SQL injection).

    - query: SQL string with %s placeholders
    - params: tuple of values to substitute into the placeholders
    - fetch: whether to return results (True for SELECT)
    - fetchone: return a single row instead of a list of rows

    IMPORTANT: never build the query string with f-strings or string
    concatenation using user input - always pass values through 'params'.
    """
    connection = get_db_connection()
    try:
        with connection.cursor() as cursor:
            cursor.execute(query, params or ())
            if fetch:
                if fetchone:
                    return cursor.fetchone()
                return cursor.fetchall()
            return cursor.lastrowid
    finally:
        connection.close()


def log_action(user_id, action, target_table=None, target_id=None):
    """Writes an entry to the audit_log table - call this after sensitive actions."""
    run_query(
        "INSERT INTO audit_log (user_id, action, target_table, target_id) VALUES (%s, %s, %s, %s)",
        (user_id, action, target_table, target_id),
        fetch=False
    )
