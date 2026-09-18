# Wellview Clinic — Hospital Management System

A learning-project HMS built with:
- **Frontend:** HTML, CSS, JavaScript (server-rendered via Jinja2 templates)
- **Backend:** Python (Flask)
- **Database:** MySQL

## Features

- Login / registration with role-based access control (Admin, Doctor, Receptionist)
- Patient registration and records
- Doctor management
- Appointment booking and status tracking
- Billing
- Audit log of sensitive actions (who did what, when)

## Project structure

```
hms/
├── app.py                # Flask app + all routes
├── config.py              # App configuration (DB credentials, secret key)
├── db.py                  # MySQL connection + safe query helper
├── create_admin.py        # One-time script to create the first admin login
├── requirements.txt
├── database/
│   └── schema.sql         # Run this to create the database and tables
├── static/
│   ├── css/style.css
│   └── js/main.js
└── templates/             # All HTML pages (Jinja2)
```

## Setup instructions

### 1. Install MySQL
Make sure MySQL Server is installed and running locally, and you know your root username/password.

### 2. Create the database
```bash
mysql -u root -p < database/schema.sql
```
This creates the `hms_db` database and all tables.

### 3. Set up a Python virtual environment
```bash
cd hms
python -m venv venv
source venv/bin/activate      # on Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 4. Configure your database credentials
Open `config.py` and update the MySQL settings, or set environment variables:
```bash
export MYSQL_USER=root
export MYSQL_PASSWORD=your_password
export MYSQL_DB=hms_db
export SECRET_KEY=some-random-string
```

### 5. Create your first admin account
```bash
python create_admin.py
```
Follow the prompts to set a name, email, and password.

### 6. Run the app
```bash
python app.py
```
Visit **http://127.0.0.1:5000** and log in with the admin account you just created.

## Roles and permissions

| Action | Admin | Receptionist | Doctor |
|---|---|---|---|
| View patients/doctors/appointments/billing | ✅ | ✅ | ✅ |
| Register/edit patients | ✅ | ✅ | ❌ |
| Delete patients | ✅ | ❌ | ❌ |
| Add/remove doctors | ✅ | ❌ | ❌ |
| Book appointments | ✅ | ✅ | ❌ |
| Update appointment status | ✅ | ✅ | ✅ |
| Create/settle bills | ✅ | ✅ | ❌ |

## Security notes (relevant if you're extending this for a security-focused report)

- Passwords are hashed with **bcrypt**, never stored in plain text.
- All SQL queries use **parameterized statements** (`db.py`) to prevent SQL injection — never string-concatenate user input into a query.
- Role checks happen server-side via the `@roles_required` decorator in `app.py`, not just hidden in the UI.
- Sensitive actions (login, record edits/deletes, status changes) are written to the `audit_log` table.
- Session data is signed using Flask's `SECRET_KEY` — set a strong, random value via environment variable in any real deployment, never hardcode it.

**Still worth doing before treating this as production-ready:**
- Enforce HTTPS/TLS in front of the app (e.g. via nginx)
- Add rate-limiting on the login route to slow brute-force attempts
- Add CSRF protection (e.g. Flask-WTF) on all forms
- Encrypt highly sensitive fields (like `medical_history`) at rest
- Add proper logging/monitoring separate from the in-app audit log
