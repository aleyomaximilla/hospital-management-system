// ===========================================================
// Wellview Clinic - Frontend-only mock data & interactivity
// This file simulates a backend using arrays in memory.
// When wired to Flask, this will be replaced by real server data.
// ===========================================================

// ---------------- Mock data ----------------

let patients = [
    { id: 1, name: "Grace Wanjiru", gender: "Female", phone: "0712345678", blood: "O+", registered: "12 Aug 2026" },
    { id: 2, name: "Brian Otieno", gender: "Male", phone: "0722345678", blood: "A+", registered: "03 Sep 2026" },
    { id: 3, name: "Amina Hassan", gender: "Female", phone: "0733345678", blood: "B-", registered: "10 Sep 2026" }
];

let doctors = [
    { id: 1, name: "Dr. Peter Kamau", specialization: "Cardiology", phone: "0700111222", days: "Mon, Wed, Fri" },
    { id: 2, name: "Dr. Maximilla Aleyo", specialization: "Pediatrics", phone: "0700333444", days: "Tue, Thu" },
    { id: 3, name: "Dr. Ann kiprop", specialization: "Nurse", phone: "0785642323", days:"Wed,Fri"},
];

let appointments = [
    { id: 1, date: "2026-09-15", time: "09:00", patient: "Grace Wanjiru", doctor: "Dr. Peter Kamau", reason: "Routine checkup", status: "Scheduled" },
    { id: 2, date: "2026-09-16", time: "11:30", patient: "Brian Otieno", doctor: "Dr. Faith Mwangi", reason: "Follow-up", status: "Scheduled" },
    { id: 3, date: "2026-09-10", time: "14:00", patient: "Amina Hassan", doctor: "Dr. Peter Kamau", reason: "Chest pain", status: "Completed" }
];

let bills = [
    { id: 1, patient: "Grace Wanjiru", description: "Consultation fee", amount: 1500, issued: "12 Aug 2026", status: "Paid" },
    { id: 2, patient: "Brian Otieno", description: "Lab tests", amount: 3200, issued: "03 Sep 2026", status: "Unpaid" }
];

// ---------------- Flash message auto-dismiss ----------------

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.flash').forEach((el) => {
        setTimeout(() => {
            el.style.transition = 'opacity 0.4s ease';
            el.style.opacity = '0';
            setTimeout(() => el.remove(), 400);
        }, 4000);
    });

    renderPatientsTable();
    renderDoctorsTable();
    renderAppointmentsTable();
    renderBillingTable();
    renderDashboardStats();
});

// ---------------- Helpers ----------------

function badgeClass(status) {
    return 'badge badge-' + status.toLowerCase();
}

function showFlash(message, type = 'success') {
    const container = document.querySelector('.content');
    if (!container) return;
    const div = document.createElement('div');
    div.className = `flash flash-${type}`;
    div.textContent = message;
    container.insertBefore(div, container.firstChild.nextSibling);
    setTimeout(() => div.remove(), 4000);
}

// ---------------- Patients ----------------

function renderPatientsTable() {
    const tbody = document.querySelector('#patients-table tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (patients.length === 0) {
        tbody.innerHTML = `<tr class="empty-row"><td colspan="6">No patients registered yet.</td></tr>`;
        return;
    }

    patients.forEach((p) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${p.name}</td>
            <td>${p.gender}</td>
            <td>${p.phone}</td>
            <td>${p.blood}</td>
            <td>${p.registered}</td>
            <td>
                <a href="patient-form.html?id=${p.id}" class="btn btn-outline btn-sm">Edit</a>
                <button class="btn btn-danger btn-sm" onclick="deletePatient(${p.id})">Delete</button>
            </td>`;
        tbody.appendChild(tr);
    });
}

function deletePatient(id) {
    if (!confirm('Delete this patient record? This cannot be undone.')) return;
    patients = patients.filter((p) => p.id !== id);
    renderPatientsTable();
    showFlash('Patient record deleted.', 'success');
}

function handlePatientFormSubmit(event) {
    event.preventDefault();
    showFlash('Patient saved (demo only - not yet connected to a database).', 'success');
    setTimeout(() => { window.location.href = 'patients.html'; }, 800);
}

// ---------------- Doctors ----------------

function renderDoctorsTable() {
    const tbody = document.querySelector('#doctors-table tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (doctors.length === 0) {
        tbody.innerHTML = `<tr class="empty-row"><td colspan="5">No doctors added yet.</td></tr>`;
        return;
    }

    doctors.forEach((d) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${d.name}</td>
            <td>${d.specialization}</td>
            <td>${d.phone}</td>
            <td>${d.days}</td>
            <td><button class="btn btn-danger btn-sm" onclick="deleteDoctor(${d.id})">Remove</button></td>`;
        tbody.appendChild(tr);
    });
}

function deleteDoctor(id) {
    if (!confirm('Remove this doctor?')) return;
    doctors = doctors.filter((d) => d.id !== id);
    renderDoctorsTable();
    showFlash('Doctor removed.', 'success');
}

function handleDoctorFormSubmit(event) {
    event.preventDefault();
    showFlash('Doctor added (demo only - not yet connected to a database).', 'success');
    setTimeout(() => { window.location.href = 'doctors.html'; }, 800);
}

// ---------------- Appointments ----------------

function renderAppointmentsTable() {
    const tbody = document.querySelector('#appointments-table tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (appointments.length === 0) {
        tbody.innerHTML = `<tr class="empty-row"><td colspan="7">No appointments booked yet.</td></tr>`;
        return;
    }

    appointments.forEach((a) => {
        const tr = document.createElement('tr');
        const actions = a.status === 'Scheduled'
            ? `<button class="btn btn-outline btn-sm" onclick="setAppointmentStatus(${a.id}, 'Completed')">Mark complete</button>
               <button class="btn btn-danger btn-sm" onclick="setAppointmentStatus(${a.id}, 'Cancelled')">Cancel</button>`
            : '';
        tr.innerHTML = `
            <td>${a.date}</td>
            <td>${a.time}</td>
            <td>${a.patient}</td>
            <td>${a.doctor}</td>
            <td>${a.reason}</td>
            <td><span class="${badgeClass(a.status)}">${a.status}</span></td>
            <td>${actions}</td>`;
        tbody.appendChild(tr);
    });
}

function setAppointmentStatus(id, status) {
    const appt = appointments.find((a) => a.id === id);
    if (appt) appt.status = status;
    renderAppointmentsTable();
    renderDashboardStats();
    showFlash('Appointment status updated.', 'success');
}

function handleAppointmentFormSubmit(event) {
    event.preventDefault();
    showFlash('Appointment booked (demo only - not yet connected to a database).', 'success');
    setTimeout(() => { window.location.href = 'appointments.html'; }, 800);
}

// ---------------- Billing ----------------

function renderBillingTable() {
    const tbody = document.querySelector('#billing-table tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (bills.length === 0) {
        tbody.innerHTML = `<tr class="empty-row"><td colspan="6">No bills issued yet.</td></tr>`;
        return;
    }

    bills.forEach((b) => {
        const tr = document.createElement('tr');
        const action = b.status === 'Unpaid'
            ? `<button class="btn btn-outline btn-sm" onclick="markBillPaid(${b.id})">Mark paid</button>`
            : '';
        tr.innerHTML = `
            <td>${b.patient}</td>
            <td>${b.description}</td>
            <td>KES ${b.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
            <td>${b.issued}</td>
            <td><span class="${badgeClass(b.status)}">${b.status}</span></td>
            <td>${action}</td>`;
        tbody.appendChild(tr);
    });
}

function markBillPaid(id) {
    const bill = bills.find((b) => b.id === id);
    if (bill) bill.status = 'Paid';
    renderBillingTable();
    renderDashboardStats();
    showFlash('Bill marked as paid.', 'success');
}

function handleBillFormSubmit(event) {
    event.preventDefault();
    showFlash('Bill created (demo only - not yet connected to a database).', 'success');
    setTimeout(() => { window.location.href = 'billing.html'; }, 800);
}

// ---------------- Dashboard ----------------

function renderDashboardStats() {
    const statPatients = document.querySelector('#stat-patients');
    const statDoctors = document.querySelector('#stat-doctors');
    const statAppointmentsToday = document.querySelector('#stat-appointments-today');
    const statUnpaidBills = document.querySelector('#stat-unpaid-bills');
    const upcomingBody = document.querySelector('#upcoming-table tbody');

    if (statPatients) statPatients.textContent = patients.length;
    if (statDoctors) statDoctors.textContent = doctors.length;
    if (statAppointmentsToday) {
        statAppointmentsToday.textContent = appointments.filter((a) => a.status === 'Scheduled').length;
    }
    if (statUnpaidBills) {
        statUnpaidBills.textContent = bills.filter((b) => b.status === 'Unpaid').length;
    }

    if (upcomingBody) {
        const upcoming = appointments.filter((a) => a.status === 'Scheduled').slice(0, 5);
        upcomingBody.innerHTML = '';
        if (upcoming.length === 0) {
            upcomingBody.innerHTML = `<tr class="empty-row"><td colspan="5">No upcoming appointments.</td></tr>`;
            return;
        }
        upcoming.forEach((a) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${a.date}</td>
                <td>${a.time}</td>
                <td>${a.patient}</td>
                <td>${a.doctor}</td>
                <td><span class="${badgeClass(a.status)}">${a.status}</span></td>`;
            upcomingBody.appendChild(tr);
        });
    }
}
