export type UserRole = 'patient' | 'doctor' | 'pharmacy';

export interface User {
  id: string;
  phone: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface PatientProfile {
  id: string;
  user_id: string;
  full_name: string;
  age?: number;
  gender?: 'male' | 'female' | 'other';
  blood_group?: string;
  city?: string;
  pin_code?: string;
  known_diseases?: string;
  allergies?: string;
  emergency_contact?: string;
  updated_at: string;
}

export interface DoctorProfile {
  id: string;
  user_id: string;
  full_name: string;
  qualification: string;
  specialty: string;
  clinic_address: string;
  consultation_fee: number;
  experience_years: number;
  working_days: string[];
  is_verified: boolean;
  created_at: string;
}

export interface PharmacyProfile {
  id: string;
  user_id: string;
  shop_name: string;
  address: string;
  city: string;
  pin_code?: string;
  delivery_available: boolean;
  created_at: string;
}

export interface DoctorSlot {
  id: string;
  doctor_id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
  created_at: string;
}

export interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  appointment_date: string;
  slot_time: string;
  status: 'booked' | 'completed' | 'cancelled' | 'no-show';
  consultation_notes?: string;
  created_at: string;
}

export interface Prescription {
  id: string;
  appointment_id?: string;
  doctor_id: string;
  patient_id: string;
  doctor_remarks?: string;
  created_at: string;
}

export interface PrescriptionMedicine {
  id: string;
  prescription_id: string;
  medicine_name: string;
  dosage: string;
  pattern: string;
  duration: string;
  food_instruction?: string;
  created_at: string;
}

export interface PharmacyOrder {
  id: string;
  prescription_id: string;
  patient_id: string;
  pharmacy_id: string;
  status: 'pending' | 'available' | 'substitute' | 'out_of_stock' | 'ready';
  remarks?: string;
  created_at: string;
}

export interface MedicineReminder {
  id: string;
  patient_id: string;
  prescription_medicine_id: string;
  reminder_times: string[];
  is_active: boolean;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}
