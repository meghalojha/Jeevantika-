/*
  # Jeevantika Healthcare Platform - Complete Database Schema
  
  ## Overview
  Creates the complete database structure for a healthcare coordination platform
  connecting Patients, Doctors, and Pharmacies.
  
  ## New Tables
  
  ### 1. users
  - Core authentication table for all user types
  - Fields: id, phone, role (patient/doctor/pharmacy), created_at
  - Role determines access to specific modules
  
  ### 2. patient_profiles
  - Extended patient information
  - Fields: user_id, full_name, age, gender, blood_group, city, pin_code,
    known_diseases, allergies, emergency_contact
  
  ### 3. doctor_profiles
  - Doctor professional information
  - Fields: user_id, full_name, qualification, specialty, clinic_address,
    consultation_fee, experience_years, working_days
  
  ### 4. pharmacy_profiles
  - Pharmacy shop information
  - Fields: user_id, shop_name, address, city, pin_code, delivery_available
  
  ### 5. doctor_slots
  - Available appointment time slots
  - Fields: doctor_id, day_of_week, start_time, end_time, is_available
  
  ### 6. appointments
  - Appointment bookings between patients and doctors
  - Fields: patient_id, doctor_id, appointment_date, slot_time, status,
    consultation_notes
  
  ### 7. prescriptions
  - Digital prescriptions created by doctors
  - Fields: appointment_id, doctor_id, patient_id, doctor_remarks, created_at
  
  ### 8. prescription_medicines
  - Individual medicines in each prescription
  - Fields: prescription_id, medicine_name, dosage, pattern, duration,
    food_instruction
  
  ### 9. pharmacy_orders
  - Orders sent from patients to pharmacies
  - Fields: prescription_id, patient_id, pharmacy_id, status, remarks
  
  ### 10. medicine_reminders
  - Scheduled medicine reminders for patients
  - Fields: patient_id, prescription_medicine_id, reminder_times, is_active
  
  ### 11. notifications
  - System notifications for all users
  - Fields: user_id, title, message, type, is_read
  
  ## Security
  - RLS enabled on all tables
  - Users can only access their own data
  - Doctors can view their patients' data during consultations
  - Pharmacies can view orders sent to them
*/

-- Create users table (core authentication)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text UNIQUE NOT NULL,
  role text NOT NULL CHECK (role IN ('patient', 'doctor', 'pharmacy')),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create patient profiles
CREATE TABLE IF NOT EXISTS patient_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  full_name text NOT NULL,
  age integer,
  gender text CHECK (gender IN ('male', 'female', 'other')),
  blood_group text,
  city text,
  pin_code text,
  known_diseases text,
  allergies text,
  emergency_contact text,
  updated_at timestamptz DEFAULT now()
);

-- Create doctor profiles
CREATE TABLE IF NOT EXISTS doctor_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  full_name text NOT NULL,
  qualification text NOT NULL,
  specialty text NOT NULL,
  clinic_address text NOT NULL,
  consultation_fee integer DEFAULT 0,
  experience_years integer DEFAULT 0,
  working_days text[] DEFAULT ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
  is_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create pharmacy profiles
CREATE TABLE IF NOT EXISTS pharmacy_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  shop_name text NOT NULL,
  address text NOT NULL,
  city text NOT NULL,
  pin_code text,
  delivery_available boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create doctor slots
CREATE TABLE IF NOT EXISTS doctor_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  day_of_week text NOT NULL CHECK (day_of_week IN ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')),
  start_time time NOT NULL,
  end_time time NOT NULL,
  is_available boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create appointments
CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  doctor_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  appointment_date date NOT NULL,
  slot_time time NOT NULL,
  status text DEFAULT 'booked' CHECK (status IN ('booked', 'completed', 'cancelled', 'no-show')),
  consultation_notes text,
  created_at timestamptz DEFAULT now()
);

-- Create prescriptions
CREATE TABLE IF NOT EXISTS prescriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid REFERENCES appointments(id) ON DELETE CASCADE,
  doctor_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  patient_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  doctor_remarks text,
  created_at timestamptz DEFAULT now()
);

-- Create prescription medicines
CREATE TABLE IF NOT EXISTS prescription_medicines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id uuid REFERENCES prescriptions(id) ON DELETE CASCADE NOT NULL,
  medicine_name text NOT NULL,
  dosage text NOT NULL,
  pattern text NOT NULL,
  duration text NOT NULL,
  food_instruction text,
  created_at timestamptz DEFAULT now()
);

-- Create pharmacy orders
CREATE TABLE IF NOT EXISTS pharmacy_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id uuid REFERENCES prescriptions(id) ON DELETE CASCADE NOT NULL,
  patient_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  pharmacy_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'available', 'substitute', 'out_of_stock', 'ready')),
  remarks text,
  created_at timestamptz DEFAULT now()
);

-- Create medicine reminders
CREATE TABLE IF NOT EXISTS medicine_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  prescription_medicine_id uuid REFERENCES prescription_medicines(id) ON DELETE CASCADE NOT NULL,
  reminder_times text[] NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create notifications
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacy_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescription_medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacy_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE medicine_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- RLS Policies for patient_profiles
CREATE POLICY "Patients can view own profile"
  ON patient_profiles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Doctors can view their patients profiles"
  ON patient_profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM appointments
      WHERE appointments.patient_id = patient_profiles.user_id
      AND appointments.doctor_id = auth.uid()
    )
  );

CREATE POLICY "Patients can insert own profile"
  ON patient_profiles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Patients can update own profile"
  ON patient_profiles FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for doctor_profiles
CREATE POLICY "Anyone can view doctor profiles"
  ON doctor_profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Doctors can insert own profile"
  ON doctor_profiles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Doctors can update own profile"
  ON doctor_profiles FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for pharmacy_profiles
CREATE POLICY "Anyone can view pharmacy profiles"
  ON pharmacy_profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Pharmacies can insert own profile"
  ON pharmacy_profiles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Pharmacies can update own profile"
  ON pharmacy_profiles FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for doctor_slots
CREATE POLICY "Anyone can view doctor slots"
  ON doctor_slots FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Doctors can manage own slots"
  ON doctor_slots FOR INSERT
  TO authenticated
  WITH CHECK (doctor_id = auth.uid());

CREATE POLICY "Doctors can update own slots"
  ON doctor_slots FOR UPDATE
  TO authenticated
  USING (doctor_id = auth.uid())
  WITH CHECK (doctor_id = auth.uid());

CREATE POLICY "Doctors can delete own slots"
  ON doctor_slots FOR DELETE
  TO authenticated
  USING (doctor_id = auth.uid());

-- RLS Policies for appointments
CREATE POLICY "Patients can view own appointments"
  ON appointments FOR SELECT
  TO authenticated
  USING (patient_id = auth.uid() OR doctor_id = auth.uid());

CREATE POLICY "Patients can create appointments"
  ON appointments FOR INSERT
  TO authenticated
  WITH CHECK (patient_id = auth.uid());

CREATE POLICY "Doctors and patients can update appointments"
  ON appointments FOR UPDATE
  TO authenticated
  USING (patient_id = auth.uid() OR doctor_id = auth.uid())
  WITH CHECK (patient_id = auth.uid() OR doctor_id = auth.uid());

-- RLS Policies for prescriptions
CREATE POLICY "Patients and doctors can view prescriptions"
  ON prescriptions FOR SELECT
  TO authenticated
  USING (patient_id = auth.uid() OR doctor_id = auth.uid());

CREATE POLICY "Doctors can create prescriptions"
  ON prescriptions FOR INSERT
  TO authenticated
  WITH CHECK (doctor_id = auth.uid());

-- RLS Policies for prescription_medicines
CREATE POLICY "Users can view prescription medicines"
  ON prescription_medicines FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM prescriptions
      WHERE prescriptions.id = prescription_medicines.prescription_id
      AND (prescriptions.patient_id = auth.uid() OR prescriptions.doctor_id = auth.uid())
    )
  );

CREATE POLICY "Doctors can add medicines to prescriptions"
  ON prescription_medicines FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM prescriptions
      WHERE prescriptions.id = prescription_medicines.prescription_id
      AND prescriptions.doctor_id = auth.uid()
    )
  );

-- RLS Policies for pharmacy_orders
CREATE POLICY "Patients and pharmacies can view orders"
  ON pharmacy_orders FOR SELECT
  TO authenticated
  USING (patient_id = auth.uid() OR pharmacy_id = auth.uid());

CREATE POLICY "Patients can create orders"
  ON pharmacy_orders FOR INSERT
  TO authenticated
  WITH CHECK (patient_id = auth.uid());

CREATE POLICY "Pharmacies can update orders"
  ON pharmacy_orders FOR UPDATE
  TO authenticated
  USING (pharmacy_id = auth.uid())
  WITH CHECK (pharmacy_id = auth.uid());

-- RLS Policies for medicine_reminders
CREATE POLICY "Patients can view own reminders"
  ON medicine_reminders FOR SELECT
  TO authenticated
  USING (patient_id = auth.uid());

CREATE POLICY "Patients can create reminders"
  ON medicine_reminders FOR INSERT
  TO authenticated
  WITH CHECK (patient_id = auth.uid());

CREATE POLICY "Patients can update reminders"
  ON medicine_reminders FOR UPDATE
  TO authenticated
  USING (patient_id = auth.uid())
  WITH CHECK (patient_id = auth.uid());

CREATE POLICY "Patients can delete reminders"
  ON medicine_reminders FOR DELETE
  TO authenticated
  USING (patient_id = auth.uid());

-- RLS Policies for notifications
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient ON prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_pharmacy_orders_pharmacy ON pharmacy_orders(pharmacy_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
