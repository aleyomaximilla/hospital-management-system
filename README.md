# Hospital Management System (HMS)

A full-stack Hospital Management System built with:
- **Frontend:** Vanilla HTML5, CSS3, JavaScript (responsive UI and interactive SPA-like tables)
- **Backend:** Node.js & Express.js (modular REST API, JWT authentication, parameterized MySQL queries)
- **Database:** MySQL Server 26.7 (`hms_db`)

---

## Features

- **Role-Based Access Control (RBAC):** Admin, Doctor, and Receptionist permissions.
- **Patient Management:** Complete records with blood groups, contact info, and medical histories.
- **Doctor Management:** Specialty directory and availability tracking.
- **Appointment Scheduling:** Bookings with real-time status updates (Scheduled, Completed, Cancelled).
- **Billing & Invoicing:** Generate clinic bills, track amounts (KES), and settle payment statuses (Paid/Unpaid).
- **Audit Logging:** Logs user actions (logins, record modifications) directly into the `audit_log` table.
- **Security:** Bcrypt password hashing, JWT stateless authorization, and parameterized SQL prevention against SQL injection.

---

## Project Structure

```
hospital-management-system/
├── frontend/                    # Client-side UI
│   ├── css/
│   │   └── style.css            # Stylesheet & responsive layout
│   ├── js/
│   │   ├── api.js               # Centralized REST API client & session manager
│   │   └── main.js              # Live table rendering & form interaction
│   ├── index.html               # Login page
│   ├── register.html            # User registration page
│   ├── dashboard.html           # Main staff dashboard
│   ├── patients.html            # Patient records table
│   ├── patient-form.html        # Register / edit patient form
│   ├── doctors.html             # Doctors roster table
│   ├── doctor-form.html         # Add doctor form
│   ├── appointments.html        # Scheduled appointments table
│   ├── appointment-form.html    # Book appointment form
│   ├── billing.html             # Billing and invoices table
│   └── bill-form.html           # Generate bill form
│
├── backend/                     # Node.js + Express REST API
│   ├── config/
│   │   └── db.js                # MySQL2 connection pool
│   ├── controllers/             # Controller business logic
│   │   ├── authController.js
│   │   ├── patientController.js
│   │   ├── doctorController.js
│   │   ├── appointmentController.js
│   │   └── billingController.js
│   ├── middleware/              # JWT auth and RBAC middleware
│   │   └── authMiddleware.js
│   ├── routes/                  # Express route definitions
│   ├── utils/                   # Audit logging utility
│   ├── .env                     # Database credentials & port configuration
│   ├── .env.example             # Environment template
│   ├── package.json             # NPM dependencies & scripts
│   └── server.js                # Server entry point & static file hosting
│
├── database/
│   ├── schema.sql               # MySQL database & tables creation script
│   └── seed.sql                 # Default seed data and initial accounts
│
└── legacy_python/               # Archived Python Flask prototype
```

---

## Quick Start & Running Instructions

### 1. Start the Server
Open a terminal in the `backend/` directory and run:
```bash
npm start
```
*(Or run with hot-reloading during development: `npm run dev`)*

The server will initialize on:
```
http://localhost:5000
```

### 2. Access the Application
Open your browser and navigate to:
```
http://localhost:5000
```

### 3. Demo Credentials

| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@wellview.com` | `admin123` |
| **Doctor** | `peter@wellview.com` | `admin123` |
| **Receptionist** | `jane@wellview.com` | `admin123` |

---

## Roles and Permissions

| Action | Admin | Receptionist | Doctor |
|---|:---:|:---:|:---:|
| View patients, doctors, appointments, billing | ✅ | ✅ | ✅ |
| Register / edit patients | ✅ | ✅ | ❌ |
| Delete patients | ✅ | ❌ | ❌ |
| Add / remove doctors | ✅ | ❌ | ❌ |
| Book appointments | ✅ | ✅ | ❌ |
| Update appointment status (Complete/Cancel) | ✅ | ✅ | ✅ |
| Create & settle bills | ✅ | ✅ | ❌ |
| Delete bills / appointments | ✅ | ❌ | ❌ |
