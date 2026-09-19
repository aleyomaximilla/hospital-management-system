-- Hospital Management System - Seed Data
USE hms_db;

-- Admin user (password: admin123)
-- Hash generated using bcrypt (10 rounds)
INSERT INTO users (full_name, email, password_hash, role)
VALUES 
('Maximilla Aleyo', 'admin@wellview.com', '$2a$10$wI5xM6j9zF9k7w7c.j5q6uKjG7Y5w4/f0vXk3/9eH7bZ9y4u3v6kG', 'admin'),
('Dr. Peter Kamau', 'peter@wellview.com', '$2a$10$wI5xM6j9zF9k7w7c.j5q6uKjG7Y5w4/f0vXk3/9eH7bZ9y4u3v6kG', 'doctor'),
('Jane Receptionist', 'jane@wellview.com', '$2a$10$wI5xM6j9zF9k7w7c.j5q6uKjG7Y5w4/f0vXk3/9eH7bZ9y4u3v6kG', 'receptionist')
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name);

-- Sample Doctors
INSERT INTO doctors (full_name, specialization, phone, email, available_days)
VALUES
('Dr. Peter Kamau', 'Cardiology', '0700111222', 'peter@wellview.com', 'Mon, Wed, Fri'),
('Dr. Maximilla Aleyo', 'Pediatrics', '0700333444', 'admin@wellview.com', 'Tue, Thu'),
('Dr. Ann Kiprop', 'General Medicine', '0785642323', 'ann@wellview.com', 'Wed, Fri')
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name);

-- Sample Patients
INSERT INTO patients (full_name, date_of_birth, gender, phone, email, address, blood_group, medical_history)
VALUES
('Grace Wanjiru', '1995-04-12', 'Female', '0712345678', 'grace@example.com', 'Nairobi, Kenya', 'O+', 'No major known allergies. Mild asthma.'),
('Brian Otieno', '1988-11-23', 'Male', '0722345678', 'brian@example.com', 'Kisumu, Kenya', 'A+', 'Hypertension history.'),
('Amina Hassan', '2001-08-05', 'Female', '0733345678', 'amina@example.com', 'Mombasa, Kenya', 'B-', 'None.')
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name);

INSERT INTO medicines (name, description, price, stock_quantity)
VALUES
('Paracetamol', 'Pain reliever and a fever reducer.', 0.50, 100),
('Amoxicillin', 'Antibiotic used to treat bacterial infections.', 1.00, 50),
('Ibuprofen', 'Nonsteroidal anti-inflammatory drug (NSAID) used for pain relief.', 0.75, 75)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Sample Appointments
INSERT INTO appointments (patient_id, doctor_id, appointment_date, appointment_time, reason, status)
VALUES
(1, 1, '2026-09-20', '09:00:00', 'Routine cardiology checkup', 'Scheduled'),
(2, 2, '2026-09-21', '11:30:00', 'Pediatric consult follow-up', 'Scheduled'),
(3, 3, '2026-09-18', '14:00:00', 'General health check', 'Completed')
ON DUPLICATE KEY UPDATE status = VALUES(status);

-- Sample Bills
INSERT INTO bills (patient_id, appointment_id, description, amount, status)
VALUES
(1, 1, 'Consultation fee', 1500.00, 'Paid'),
(2, 2, 'Laboratory blood tests', 3200.00, 'Unpaid'),
(3, 3, 'Consultation & prescription', 2000.00, 'Paid')
ON DUPLICATE KEY UPDATE status = VALUES(status);
