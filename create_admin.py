"""
Run this once after setting up the database to create your first admin login.
Usage:
    python create_admin.py
"""
import getpass
import bcrypt
from db import run_query

def main():
    print("Create the first admin account")
    full_name = input("Full name: ").strip()
    email = input("Email: ").strip()
    password = getpass.getpass("Password: ")

    existing = run_query("SELECT id FROM users WHERE email = %s", (email,), fetchone=True)
    if existing:
        print("An account with that email already exists.")
        return

    password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    run_query(
        "INSERT INTO users (full_name, email, password_hash, role) VALUES (%s, %s, %s, 'admin')",
        (full_name, email, password_hash),
        fetch=False
    )
    print(f"Admin account created for {email}. You can now log in.")

if __name__ == '__main__':
    main()
