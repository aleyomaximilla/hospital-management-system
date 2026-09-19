from flask import Flask, render_template, request, redirect, url_for, session, flash
from functools import wraps
from datetime import date
import bcrypt

from config import Config
from db import run_query, log_action

app = Flask(__name__)
app.config.from_object(Config)


# ---------------------------------------------------------
# Auth helpers
# ---------------------------------------------------------

def login_required(f):
    """Blocks access unless a user is logged in."""
    @wraps(f)
    def wrapper(*args, **kwargs):
        if 'user_id' not in session:
            flash('Please log in to continue.', 'error')
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return wrapper


def roles_required(*allowed_roles):
    """Blocks access unless the logged-in user's role is in allowed_roles."""
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            if 'user_id' not in session:
                flash('Please log in to continue.', 'error')
                return redirect(url_for('login'))
            if session.get('role') not in allowed_roles:
                flash('You do not have permission to view that page.', 'error')
                return redirect(url_for('dashboard'))
            return f(*args, **kwargs)
        return wrapper
    return decorator


# ---------------------------------------------------------
# Auth routes
# ---------------------------------------------------------

@app.route('/', methods=['GET'])
def index():
    return redirect(url_for('dashboard')) if 'user_id' in session else redirect(url_for('login'))


@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form.get('email', '').strip()
        password = request.form.get('password', '')

        user = run_query(
            "SELECT * FROM users WHERE email = %s",
            (email,), fetchone=True
        )

        if user and bcrypt.checkpw(password.encode('utf-8'), user['password_hash'].encode('utf-8')):
            session['user_id'] = user['id']
            session['full_name'] = user['full_name']
            session['role'] = user['role']
            log_action(user['id'], 'Logged in')
            return redirect(url_for('dashboard'))

        flash('Invalid email or password.', 'error')
        return redirect(url_for('login'))

    return render_template('login.html')


@app.route('/logout')
def logout():
    if 'user_id' in session:
        log_action(session['user_id'], 'Logged out')
    session.clear()
    return redirect(url_for('login'))


@app.route('/register', methods=['GET', 'POST'])
def register():
    """Self-registration - restrict or remove this route in a real deployment."""
    if request.method == 'POST':
        full_name = request.form.get('full_name', '').strip()
        email = request.form.get('email', '').strip()
        password = request.form.get('password', '')
        role = request.form.get('role', 'receptionist')

        existing = run_query("SELECT id FROM users WHERE email = %s", (email,), fetchone=True)
        if existing:
            flash('An account with that email already exists.', 'error')
            return redirect(url_for('register'))

        password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        run_query(
            "INSERT INTO users (full_name, email, password_hash, role) VALUES (%s, %s, %s, %s)",
            (full_name, email, password_hash, role), fetch=False
        )
        flash('Account created. Please log in.', 'success')
        return redirect(url_for('login'))

    return render_template('register.html')


# ---------------------------------------------------------
# Dashboard
# ---------------------------------------------------------

@app.route('/dashboard')
@login_required
def dashboard():
    stats = {
        'patients': run_query("SELECT COUNT(*) AS c FROM patients", fetchone=True)['c'],
        'doctors': run_query("SELECT COUNT(*) AS c FROM doctors", fetchone=True)['c'],
        'appointments_today': run_query(
            "SELECT COUNT(*) AS c FROM appointments WHERE appointment_date = %s",
            (date.today(),), fetchone=True
        )['c'],
        'unpaid_bills': run_query(
            "SELECT COUNT(*) AS c FROM bills WHERE status = 'Unpaid'", fetchone=True
        )['c'],
    }
    upcoming = run_query(
        """SELECT a.id, a.appointment_date, a.appointment_time, a.status,
                  p.full_name AS patient_name, d.full_name AS doctor_name
           FROM appointments a
           JOIN patients p ON a.patient_id = p.id
           JOIN doctors d ON a.doctor_id = d.id
           WHERE a.appointment_date >= %s
           ORDER BY a.appointment_date, a.appointment_time
           LIMIT 5""",
        (date.today(),)
    )
    return render_template('dashboard.html', stats=stats, upcoming=upcoming)


# ---------------------------------------------------------
# Patients
# ---------------------------------------------------------

@app.route('/patients')
@login_required
def patients():
    all_patients = run_query("SELECT * FROM patients ORDER BY registered_at DESC")
    return render_template('patients.html', patients=all_patients)


@app.route('/patients/add', methods=['GET', 'POST'])
@roles_required('admin', 'receptionist')
def add_patient():
    if request.method == 'POST':
        data = (
            request.form.get('full_name', '').strip(),
            request.form.get('date_of_birth') or None,
            request.form.get('gender') or None,
            request.form.get('phone', '').strip(),
            request.form.get('email', '').strip(),
            request.form.get('address', '').strip(),
            request.form.get('blood_group', '').strip(),
            request.form.get('medical_history', '').strip(),
        )
        new_id = run_query(
            """INSERT INTO patients
               (full_name, date_of_birth, gender, phone, email, address, blood_group, medical_history)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s)""",
            data, fetch=False
        )
        log_action(session['user_id'], 'Registered patient', 'patients', new_id)
        flash('Patient registered successfully.', 'success')
        return redirect(url_for('patients'))

    return render_template('patient_form.html', patient=None)


@app.route('/patients/<int:patient_id>/edit', methods=['GET', 'POST'])
@roles_required('admin', 'receptionist')
def edit_patient(patient_id):
    patient = run_query("SELECT * FROM patients WHERE id = %s", (patient_id,), fetchone=True)
    if not patient:
        flash('Patient not found.', 'error')
        return redirect(url_for('patients'))

    if request.method == 'POST':
        data = (
            request.form.get('full_name', '').strip(),
            request.form.get('date_of_birth') or None,
            request.form.get('gender') or None,
            request.form.get('phone', '').strip(),
            request.form.get('email', '').strip(),
            request.form.get('address', '').strip(),
            request.form.get('blood_group', '').strip(),
            request.form.get('medical_history', '').strip(),
            patient_id,
        )
        run_query(
            """UPDATE patients SET full_name=%s, date_of_birth=%s, gender=%s, phone=%s,
               email=%s, address=%s, blood_group=%s, medical_history=%s WHERE id=%s""",
            data, fetch=False
        )
        log_action(session['user_id'], 'Updated patient', 'patients', patient_id)
        flash('Patient record updated.', 'success')
        return redirect(url_for('patients'))

    return render_template('patient_form.html', patient=patient)


@app.route('/patients/<int:patient_id>/delete', methods=['POST'])
@roles_required('admin')
def delete_patient(patient_id):
    run_query("DELETE FROM patients WHERE id = %s", (patient_id,), fetch=False)
    log_action(session['user_id'], 'Deleted patient', 'patients', patient_id)
    flash('Patient record deleted.', 'success')
    return redirect(url_for('patients'))


# ---------------------------------------------------------
# Doctors
# ---------------------------------------------------------

@app.route('/doctors')
@login_required
def doctors():
    all_doctors = run_query("SELECT * FROM doctors ORDER BY full_name")
    return render_template('doctors.html', doctors=all_doctors)


@app.route('/doctors/add', methods=['GET', 'POST'])
@roles_required('admin')
def add_doctor():
    if request.method == 'POST':
        data = (
            request.form.get('full_name', '').strip(),
            request.form.get('specialization', '').strip(),
            request.form.get('phone', '').strip(),
            request.form.get('email', '').strip(),
            request.form.get('available_days', '').strip(),
        )
        new_id = run_query(
            """INSERT INTO doctors (full_name, specialization, phone, email, available_days)
               VALUES (%s, %s, %s, %s, %s)""",
            data, fetch=False
        )
        log_action(session['user_id'], 'Added doctor', 'doctors', new_id)
        flash('Doctor added successfully.', 'success')
        return redirect(url_for('doctors'))

    return render_template('doctor_form.html', doctor=None)


@app.route('/doctors/<int:doctor_id>/delete', methods=['POST'])
@roles_required('admin')
def delete_doctor(doctor_id):
    run_query("DELETE FROM doctors WHERE id = %s", (doctor_id,), fetch=False)
    log_action(session['user_id'], 'Deleted doctor', 'doctors', doctor_id)
    flash('Doctor removed.', 'success')
    return redirect(url_for('doctors'))


# ---------------------------------------------------------
# Appointments
# ---------------------------------------------------------

@app.route('/appointments')
@login_required
def appointments():
    all_appointments = run_query(
        """SELECT a.*, p.full_name AS patient_name, d.full_name AS doctor_name
           FROM appointments a
           JOIN patients p ON a.patient_id = p.id
           JOIN doctors d ON a.doctor_id = d.id
           ORDER BY a.appointment_date DESC, a.appointment_time DESC"""
    )
    return render_template('appointments.html', appointments=all_appointments)


@app.route('/appointments/add', methods=['GET', 'POST'])
@roles_required('admin', 'receptionist')
def add_appointment():
    if request.method == 'POST':
        data = (
            request.form.get('patient_id'),
            request.form.get('doctor_id'),
            request.form.get('appointment_date'),
            request.form.get('appointment_time'),
            request.form.get('reason', '').strip(),
        )
        new_id = run_query(
            """INSERT INTO appointments (patient_id, doctor_id, appointment_date, appointment_time, reason)
               VALUES (%s, %s, %s, %s, %s)""",
            data, fetch=False
        )
        log_action(session['user_id'], 'Booked appointment', 'appointments', new_id)
        flash('Appointment booked.', 'success')
        return redirect(url_for('appointments'))

    patients_list = run_query("SELECT id, full_name FROM patients ORDER BY full_name")
    doctors_list = run_query("SELECT id, full_name, specialization FROM doctors ORDER BY full_name")
    return render_template('appointment_form.html', patients=patients_list, doctors=doctors_list)


@app.route('/appointments/<int:appointment_id>/status', methods=['POST'])
@roles_required('admin', 'doctor', 'receptionist')
def update_appointment_status(appointment_id):
    new_status = request.form.get('status')
    if new_status not in ('Scheduled', 'Completed', 'Cancelled'):
        flash('Invalid status.', 'error')
        return redirect(url_for('appointments'))

    run_query(
        "UPDATE appointments SET status = %s WHERE id = %s",
        (new_status, appointment_id), fetch=False
    )
    log_action(session['user_id'], f'Updated appointment status to {new_status}', 'appointments', appointment_id)
    flash('Appointment status updated.', 'success')
    return redirect(url_for('appointments'))


# ---------------------------------------------------------
# Billing
# ---------------------------------------------------------

@app.route('/billing')
@login_required
def billing():
    all_bills = run_query(
        """SELECT b.*, p.full_name AS patient_name
           FROM bills b
           JOIN patients p ON b.patient_id = p.id
           ORDER BY b.issued_at DESC"""
    )
    return render_template('billing.html', bills=all_bills)


@app.route('/billing/add', methods=['GET', 'POST'])
@roles_required('admin', 'receptionist')
def add_bill():
    if request.method == 'POST':
        data = (
            request.form.get('patient_id'),
            request.form.get('description', '').strip(),
            request.form.get('amount'),
        )
        new_id = run_query(
            "INSERT INTO bills (patient_id, description, amount) VALUES (%s, %s, %s)",
            data, fetch=False
        )
        log_action(session['user_id'], 'Created bill', 'bills', new_id)
        flash('Bill created.', 'success')
        return redirect(url_for('billing'))

    patients_list = run_query("SELECT id, full_name FROM patients ORDER BY full_name")
    return render_template('bill_form.html', patients=patients_list)


@app.route('/billing/<int:bill_id>/pay', methods=['POST'])
@roles_required('admin', 'receptionist')
def mark_bill_paid(bill_id):
    run_query("UPDATE bills SET status = 'Paid' WHERE id = %s", (bill_id,), fetch=False)
    log_action(session['user_id'], 'Marked bill as paid', 'bills', bill_id)
    flash('Bill marked as paid.', 'success')
    return redirect(url_for('billing'))


if __name__ == '__main__':
    # debug=True is for local development only - turn off in production
    app.run(debug=True)
