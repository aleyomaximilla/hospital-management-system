import os

class Config:
    # Flask secret key - used to sign session cookies. Change this in production.
    SECRET_KEY = os.environ.get('SECRET_KEY', 'change-this-to-a-random-secret-key')

    # MySQL connection settings - update these to match your local setup
    MYSQL_HOST = os.environ.get('MYSQL_HOST', 'localhost')
    MYSQL_USER = os.environ.get('MYSQL_USER', 'root')
    MYSQL_PASSWORD = os.environ.get('MYSQL_PASSWORD', '')
    MYSQL_DB = os.environ.get('MYSQL_DB', 'hms_db')
    MYSQL_PORT = int(os.environ.get('MYSQL_PORT', 3306))
