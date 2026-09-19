// ===========================================================
// Hospital Management System - Live Frontend Interactivity
// Connected to Node.js & MySQL REST API
// ===========================================================

document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication for protected pages
    const isAuthPage = window.location.pathname.endsWith('index.html') || 
                         window.location.pathname.endsWith('register.html') ||
                         window.location.pathname === '/' ||
                         window.location.pathname === '';

    if (!isAuthPage) {
        if (!requireAuth()) return;
        setupUserProfile();
    }

    // Auto-dismiss flashes
    document.querySelectorAll('.flash').forEach((el) => {
        setTimeout(() => {
            el.style.transition = 'opacity 0.4s ease';
            el.style.opacity = '0';
            setTimeout(() => el.remove(), 400);
        }, 4000);
    });

    // Initialize page-specific data
    await renderDashboardStats();
    await renderPatientsTable();
    await loadPatientFormData();
    await renderDoctorsTable();
    await renderAppointmentsTable();
    await populateAppointmentDropdowns();
    await renderBillingTable();
    await populateBillDropdowns();
});

// ---------------- User Profile & Navigation ----------------

function setupUserProfile() {
    const user = getCurrentUser();
    if (user) {
        const strong = document.querySelector('.user-box strong');
        const roleTag = document.querySelector('.user-box .role-tag');
        if (strong) strong.textContent = user.full_name || 'Staff Member';
        if (roleTag) roleTag.textContent = user.role || 'receptionist';
    }

    const logoutLink = document.querySelector('.logout-link');
    if (logoutLink) {
        logoutLink.onclick = (e) => {
            e.preventDefault();
            logout();
        };
    }
}

function badgeClass(status) {
    if (!status) return 'badge';
    return 'badge badge-' + status.toLowerCase();
}

// ---------------- Dashboard ----------------

async function renderDashboardStats() {
    const statPatients = document.querySelector('#stat-patients');
    const statDoctors = document.querySelector('#stat-doctors');
    const statAppointmentsToday = document.querySelector('#stat-appointments-today');
    const statUnpaidBills = document.querySelector('#stat-unpaid-bills');
    const upcomingBody = document.querySelector('#upcoming-table tbody');

    if (!statPatients && !upcomingBody) return;

    try {
        const res = await apiRequest('/appointments/dashboard-stats');
        if (res.success) {
            if (statPatients) statPatients.textContent = res.stats.patients;
            if (statDoctors) statDoctors.textContent = res.stats.doctors;
            if (statAppointmentsToday) statAppointmentsToday.textContent = res.stats.scheduledAppointments;
            if (statUnpaidBills) statUnpaidBills.textContent = res.stats.unpaidBills;

            if (upcomingBody) {
                upcomingBody.innerHTML = '';
                if (!res.upcomingAppointments || res.upcomingAppointments.length === 0) {
                    upcomingBody.innerHTML = '<tr class="empty-row"><td colspan="5">No upcoming scheduled appointments.</td></tr>';
                    return;
                }

                res.upcomingAppointments.forEach(a => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${a.appointment_date}</td>
                        <td>${a.appointment_time}</td>
                        <td>${a.patient_name}</td>
                        <td>${a.doctor_name}</td>
                        <td><span class="${badgeClass(a.status)}">${a.status}</span></td>
                    `;
                    upcomingBody.appendChild(tr);
                });
            }
        }
    } catch (err) {
        console.error('Failed to load dashboard stats:', err);
    }
}

// ---------------- Patients ----------------

async function renderPatientsTable() {
    const tbody = document.querySelector('#patients-table tbody');
    if (!tbody) return;

    try {
        const res = await apiRequest('/patients');
        tbody.innerHTML = '';

        if (!res.data || res.data.length === 0) {
            tbody.innerHTML = '<tr class="empty-row"><td colspan="6">No patients registered yet.</td></tr>';
            return;
        }

        const currentUser = getCurrentUser();
        const isAdmin = currentUser && currentUser.role === 'admin';

        res.data.forEach(p => {
            const tr = document.createElement('tr');
            const deleteBtn = isAdmin ? `<button class="btn btn-danger btn-sm" onclick="deletePatient(${p.id})">Delete</button>` : '';
            tr.innerHTML = `
                <td><strong>${p.full_name}</strong></td>
                <td>${p.gender || '—'}</td>
                <td>${p.phone || '—'}</td>
                <td>${p.blood_group || '—'}</td>
                <td>${p.registered_formatted || '—'}</td>
                <td>
                    <a href="patient-form.html?id=${p.id}" class="btn btn-outline btn-sm">Edit</a>
                    ${deleteBtn}
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        tbody.innerHTML = `<tr class="empty-row"><td colspan="6">Error loading patients: ${err.message}</td></tr>`;
    }
}

async function loadPatientFormData() {
    const form = document.querySelector('form[onsubmit*="handlePatientFormSubmit"]');
    if (!form) return;

    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    if (!id) return;

    const title = document.querySelector('.page-header h1');
    if (title) title.textContent = 'Edit patient record';

    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.textContent = 'Update patient';

    try {
        const res = await apiRequest(`/patients/${id}`);
        if (res.data) {
            const p = res.data;
            if (document.getElementById('full_name')) document.getElementById('full_name').value = p.full_name || '';
            if (document.getElementById('date_of_birth') && p.date_of_birth) {
                document.getElementById('date_of_birth').value = p.date_of_birth.split('T')[0];
            }
            if (document.getElementById('gender')) document.getElementById('gender').value = p.gender || '';
            if (document.getElementById('blood_group')) document.getElementById('blood_group').value = p.blood_group || '';
            if (document.getElementById('phone')) document.getElementById('phone').value = p.phone || '';
            if (document.getElementById('email')) document.getElementById('email').value = p.email || '';
            if (document.getElementById('address')) document.getElementById('address').value = p.address || '';
            if (document.getElementById('medical_history')) document.getElementById('medical_history').value = p.medical_history || '';
        }
    } catch (err) {
        showFlash('Failed to load patient: ' + err.message, 'error');
    }
}

async function handlePatientFormSubmit(event) {
    event.preventDefault();
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');

    const data = {
        full_name: document.getElementById('full_name').value.trim(),
        date_of_birth: document.getElementById('date_of_birth').value || null,
        gender: document.getElementById('gender').value || null,
        blood_group: document.getElementById('blood_group').value.trim() || null,
        phone: document.getElementById('phone').value.trim() || null,
        email: document.getElementById('email').value.trim() || null,
        address: document.getElementById('address').value.trim() || null,
        medical_history: document.getElementById('medical_history').value.trim() || null
    };

    try {
        if (id) {
            await apiRequest(`/patients/${id}`, 'PUT', data);
            showFlash('Patient record updated successfully!', 'success');
        } else {
            await apiRequest('/patients', 'POST', data);
            showFlash('Patient registered successfully!', 'success');
        }
        setTimeout(() => { window.location.href = 'patients.html'; }, 800);
    } catch (err) {
        showFlash(err.message || 'Failed to save patient record.', 'error');
    }
}

async function deletePatient(id) {
    if (!confirm('Delete this patient record? This cannot be undone.')) return;
    try {
        await apiRequest(`/patients/${id}`, 'DELETE');
        showFlash('Patient record deleted.', 'success');
        renderPatientsTable();
    } catch (err) {
        showFlash(err.message || 'Could not delete patient.', 'error');
    }
}

// ---------------- Doctors ----------------

async function renderDoctorsTable() {
    const tbody = document.querySelector('#doctors-table tbody');
    if (!tbody) return;

    try {
        const res = await apiRequest('/doctors');
        tbody.innerHTML = '';

        if (!res.data || res.data.length === 0) {
            tbody.innerHTML = '<tr class="empty-row"><td colspan="5">No doctors added yet.</td></tr>';
            return;
        }

        const currentUser = getCurrentUser();
        const isAdmin = currentUser && currentUser.role === 'admin';

        res.data.forEach(d => {
            const tr = document.createElement('tr');
            const action = isAdmin ? `<button class="btn btn-danger btn-sm" onclick="deleteDoctor(${d.id})">Remove</button>` : '';
            tr.innerHTML = `
                <td><strong>${d.full_name}</strong></td>
                <td>${d.specialization}</td>
                <td>${d.phone || '—'}</td>
                <td>${d.available_days || '—'}</td>
                <td>${action}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        tbody.innerHTML = `<tr class="empty-row"><td colspan="5">Error loading doctors: ${err.message}</td></tr>`;
    }
}

async function handleDoctorFormSubmit(event) {
    event.preventDefault();
    const data = {
        full_name: document.getElementById('full_name').value.trim(),
        specialization: document.getElementById('specialization').value.trim(),
        phone: document.getElementById('phone').value.trim() || null,
        email: document.getElementById('email').value.trim() || null,
        available_days: document.getElementById('available_days').value.trim() || null
    };

    try {
        await apiRequest('/doctors', 'POST', data);
        showFlash('Doctor added successfully!', 'success');
        setTimeout(() => { window.location.href = 'doctors.html'; }, 800);
    } catch (err) {
        showFlash(err.message || 'Could not add doctor.', 'error');
    }
}

async function deleteDoctor(id) {
    if (!confirm('Remove this doctor?')) return;
    try {
        await apiRequest(`/doctors/${id}`, 'DELETE');
        showFlash('Doctor removed.', 'success');
        renderDoctorsTable();
    } catch (err) {
        showFlash(err.message || 'Could not remove doctor.', 'error');
    }
}

async function renderMedicinesTable() {
    const tbody = document.querySelector('#medicines-table tbody');
    if (!tbody) return;

    try {
        const res = await apiRequest('/medicines');
        tbody.innerHTML = '';

        if (!res.data || res.data.length === 0) {
            tbody.innerHTML = '<tr class="empty-row"><td colspan="5">No medicines added yet.</td></tr>';
            return;
        }

        res.data.forEach(m => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${m.name}</strong></td>
                <td>${m.description || '—'}</td>
                <td>KES ${Number(m.price).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                <td>${m.stock_quantity}</td>
                <td>${m.created_at_formatted || '—'}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        tbody.innerHTML = `<tr class="empty-row"><td colspan="5">Error loading medicines: ${err.message}</td></tr>`;
    }
}

// ---------------- Appointments ----------------

async function renderAppointmentsTable() {
    const tbody = document.querySelector('#appointments-table tbody');
    if (!tbody) return;

    try {
        const res = await apiRequest('/appointments');
        tbody.innerHTML = '';

        if (!res.data || res.data.length === 0) {
            tbody.innerHTML = '<tr class="empty-row"><td colspan="7">No appointments booked yet.</td></tr>';
            return;
        }

        res.data.forEach(a => {
            const tr = document.createElement('tr');
            const actions = a.status === 'Scheduled'
                ? `<button class="btn btn-outline btn-sm" onclick="setAppointmentStatus(${a.id}, 'Completed')">Mark complete</button>
                   <button class="btn btn-danger btn-sm" onclick="setAppointmentStatus(${a.id}, 'Cancelled')">Cancel</button>`
                : '';
            tr.innerHTML = `
                <td>${a.appointment_date}</td>
                <td>${a.appointment_time}</td>
                <td>${a.patient_name}</td>
                <td>${a.doctor_name}</td>
                <td>${a.reason || '—'}</td>
                <td><span class="${badgeClass(a.status)}">${a.status}</span></td>
                <td>${actions}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        tbody.innerHTML = `<tr class="empty-row"><td colspan="7">Error loading appointments: ${err.message}</td></tr>`;
    }
}

async function populateAppointmentDropdowns() {
    const patientSelect = document.getElementById('patient_id');
    const doctorSelect = document.getElementById('doctor_id');

    // Only run on appointment-form.html
    const form = document.querySelector('form[onsubmit*="handleAppointmentFormSubmit"]');
    if (!form || !patientSelect || !doctorSelect) return;

    try {
        const [patientsRes, doctorsRes] = await Promise.all([
            apiRequest('/patients'),
            apiRequest('/doctors')
        ]);

        patientSelect.innerHTML = '<option value="">Select patient...</option>';
        if (patientsRes.data) {
            patientsRes.data.forEach(p => {
                const opt = document.createElement('option');
                opt.value = p.id;
                opt.textContent = `${p.full_name} (${p.phone || 'No phone'})`;
                patientSelect.appendChild(opt);
            });
        }

        doctorSelect.innerHTML = '<option value="">Select doctor...</option>';
        if (doctorsRes.data) {
            doctorsRes.data.forEach(d => {
                const opt = document.createElement('option');
                opt.value = d.id;
                opt.textContent = `${d.full_name} — ${d.specialization}`;
                doctorSelect.appendChild(opt);
            });
        }
    } catch (err) {
        console.error('Error populating appointment dropdowns:', err);
    }
}

async function handleAppointmentFormSubmit(event) {
    event.preventDefault();
    const data = {
        patient_id: document.getElementById('patient_id').value,
        doctor_id: document.getElementById('doctor_id').value,
        appointment_date: document.getElementById('appointment_date').value,
        appointment_time: document.getElementById('appointment_time').value,
        reason: document.getElementById('reason').value.trim()
    };

    try {
        await apiRequest('/appointments', 'POST', data);
        showFlash('Appointment booked successfully!', 'success');
        setTimeout(() => { window.location.href = 'appointments.html'; }, 800);
    } catch (err) {
        showFlash(err.message || 'Could not book appointment.', 'error');
    }
}

async function setAppointmentStatus(id, status) {
    try {
        await apiRequest(`/appointments/${id}/status`, 'PATCH', { status });
        showFlash(`Appointment marked as ${status}.`, 'success');
        renderAppointmentsTable();
        renderDashboardStats();
    } catch (err) {
        showFlash(err.message || 'Could not update appointment status.', 'error');
    }
}

// ---------------- Billing ----------------

async function renderBillingTable() {
    const tbody = document.querySelector('#billing-table tbody');
    if (!tbody) return;

    try {
        const res = await apiRequest('/billing');
        tbody.innerHTML = '';

        if (!res.data || res.data.length === 0) {
            tbody.innerHTML = '<tr class="empty-row"><td colspan="6">No bills issued yet.</td></tr>';
            return;
        }

        res.data.forEach(b => {
            const tr = document.createElement('tr');
            const action = b.status === 'Unpaid'
                ? `<button class="btn btn-outline btn-sm" onclick="markBillPaid(${b.id})">Mark paid</button>`
                : '';
            const formattedAmount = Number(b.amount).toLocaleString(undefined, { minimumFractionDigits: 2 });
            tr.innerHTML = `
                <td><strong>${b.patient_name}</strong></td>
                <td>${b.description}</td>
                <td>KES ${formattedAmount}</td>
                <td>${b.issued_formatted || '—'}</td>
                <td><span class="${badgeClass(b.status)}">${b.status}</span></td>
                <td>${action}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        tbody.innerHTML = `<tr class="empty-row"><td colspan="6">Error loading bills: ${err.message}</td></tr>`;
    }
}

async function populateBillDropdowns() {
    const patientSelect = document.getElementById('patient_id');
    const form = document.querySelector('form[onsubmit*="handleBillFormSubmit"]');
    if (!form || !patientSelect) return;

    try {
        const res = await apiRequest('/patients');
        patientSelect.innerHTML = '<option value="">Select patient...</option>';
        if (res.data) {
            res.data.forEach(p => {
                const opt = document.createElement('option');
                opt.value = p.id;
                opt.textContent = `${p.full_name} (${p.phone || 'No phone'})`;
                patientSelect.appendChild(opt);
            });
        }
    } catch (err) {
        console.error('Error populating billing dropdown:', err);
    }
}

async function handleBillFormSubmit(event) {
    event.preventDefault();
    const data = {
        patient_id: document.getElementById('patient_id').value,
        description: document.getElementById('description').value.trim(),
        amount: parseFloat(document.getElementById('amount').value),
        status: 'Unpaid'
    };

    try {
        await apiRequest('/billing', 'POST', data);
        showFlash('Bill generated successfully!', 'success');
        setTimeout(() => { window.location.href = 'billing.html'; }, 800);
    } catch (err) {
        showFlash(err.message || 'Could not create bill.', 'error');
    }
}

async function markBillPaid(id) {
    try {
        await apiRequest(`/billing/${id}/status`, 'PATCH', { status: 'Paid' });
        showFlash('Bill marked as paid.', 'success');
        renderBillingTable();
        renderDashboardStats();
    } catch (err) {
        showFlash(err.message || 'Could not update bill status.', 'error');
    }
}
