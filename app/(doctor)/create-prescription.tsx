import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Appointment, PatientProfile } from '@/types/database';
import { ArrowLeft, Plus, X } from 'lucide-react-native';

interface Medicine {
  medicine_name: string;
  dosage: string;
  pattern: string;
  duration: string;
  food_instruction: string;
}

export default function CreatePrescription() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const router = useRouter();
  const { appointmentId } = useLocalSearchParams<{ appointmentId: string }>();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [patient, setPatient] = useState<PatientProfile | null>(null);
  const [medicines, setMedicines] = useState<Medicine[]>([
    {
      medicine_name: '',
      dosage: '',
      pattern: '',
      duration: '',
      food_instruction: '',
    },
  ]);
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadAppointment();
  }, []);

  const loadAppointment = async () => {
    try {
      const { data: aptData, error: aptError } = await supabase
        .from('appointments')
        .select('*')
        .eq('id', appointmentId)
        .maybeSingle();

      if (aptError) throw aptError;

      if (aptData) {
        setAppointment(aptData);

        const { data: patientData } = await supabase
          .from('patient_profiles')
          .select('*')
          .eq('user_id', aptData.patient_id)
          .maybeSingle();

        if (patientData) {
          setPatient(patientData);
        }
      }
    } catch (error) {
      console.error('Error loading appointment:', error);
    } finally {
      setLoading(false);
    }
  };

  const addMedicine = () => {
    setMedicines([
      ...medicines,
      {
        medicine_name: '',
        dosage: '',
        pattern: '',
        duration: '',
        food_instruction: '',
      },
    ]);
  };

  const removeMedicine = (index: number) => {
    setMedicines(medicines.filter((_, i) => i !== index));
  };

  const updateMedicine = (index: number, field: keyof Medicine, value: string) => {
    const updated = [...medicines];
    updated[index] = { ...updated[index], [field]: value };
    setMedicines(updated);
  };

  const handleSubmit = async () => {
    const validMedicines = medicines.filter((m) => m.medicine_name.trim() !== '');

    if (validMedicines.length === 0) {
      Alert.alert('Error', 'Please add at least one medicine');
      return;
    }

    setSaving(true);
    try {
      const { data: prescData, error: prescError } = await supabase
        .from('prescriptions')
        .insert({
          appointment_id: appointmentId,
          doctor_id: user?.id,
          patient_id: appointment?.patient_id,
          doctor_remarks: remarks,
        })
        .select()
        .single();

      if (prescError) throw prescError;

      const medicineInserts = validMedicines.map((med) => ({
        prescription_id: prescData.id,
        ...med,
      }));

      const { error: medError } = await supabase
        .from('prescription_medicines')
        .insert(medicineInserts);

      if (medError) throw medError;

      await supabase
        .from('appointments')
        .update({ status: 'completed' })
        .eq('id', appointmentId);

      await supabase.from('notifications').insert({
        user_id: appointment?.patient_id,
        title: 'Prescription Ready',
        message: 'Your prescription is now available',
        type: 'prescription',
      });

      Alert.alert('Success', 'Prescription created successfully', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create prescription');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('doctor.create_prescription')}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {patient && (
          <View style={styles.patientCard}>
            <Text style={styles.patientName}>{patient.full_name}</Text>
            <Text style={styles.patientInfo}>
              Age: {patient.age} | Blood Group: {patient.blood_group || 'N/A'}
            </Text>
            {patient.known_diseases && (
              <Text style={styles.patientInfo}>Diseases: {patient.known_diseases}</Text>
            )}
            {patient.allergies && (
              <Text style={styles.patientInfo}>Allergies: {patient.allergies}</Text>
            )}
          </View>
        )}

        <Text style={styles.sectionTitle}>{t('prescription.medicines')}</Text>

        {medicines.map((medicine, index) => (
          <View key={index} style={styles.medicineCard}>
            <View style={styles.medicineHeader}>
              <Text style={styles.medicineNumber}>Medicine {index + 1}</Text>
              {medicines.length > 1 && (
                <TouchableOpacity onPress={() => removeMedicine(index)}>
                  <X size={20} color="#ef4444" />
                </TouchableOpacity>
              )}
            </View>

            <TextInput
              style={styles.input}
              placeholder={t('prescription.medicines')}
              value={medicine.medicine_name}
              onChangeText={(text) => updateMedicine(index, 'medicine_name', text)}
            />

            <TextInput
              style={styles.input}
              placeholder={t('prescription.dosage')}
              value={medicine.dosage}
              onChangeText={(text) => updateMedicine(index, 'dosage', text)}
            />

            <TextInput
              style={styles.input}
              placeholder={t('prescription.pattern')}
              value={medicine.pattern}
              onChangeText={(text) => updateMedicine(index, 'pattern', text)}
            />

            <TextInput
              style={styles.input}
              placeholder={t('prescription.duration')}
              value={medicine.duration}
              onChangeText={(text) => updateMedicine(index, 'duration', text)}
            />

            <TextInput
              style={styles.input}
              placeholder={t('prescription.food_instruction')}
              value={medicine.food_instruction}
              onChangeText={(text) => updateMedicine(index, 'food_instruction', text)}
            />
          </View>
        ))}

        <TouchableOpacity style={styles.addButton} onPress={addMedicine}>
          <Plus size={20} color="#3b82f6" />
          <Text style={styles.addButtonText}>Add Medicine</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>{t('prescription.doctor_remarks')}</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Enter your remarks..."
          value={remarks}
          onChangeText={setRemarks}
          multiline
          numberOfLines={4}
        />

        <TouchableOpacity
          style={[styles.submitButton, saving && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={saving}
        >
          <Text style={styles.submitButtonText}>
            {saving ? t('common.loading') : t('common.submit')}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  patientCard: {
    padding: 16,
    backgroundColor: '#dbeafe',
    borderRadius: 12,
    marginBottom: 24,
  },
  patientName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 6,
  },
  patientInfo: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  medicineCard: {
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 12,
  },
  medicineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  medicineNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    backgroundColor: '#ffffff',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3b82f6',
    borderStyle: 'dashed',
    marginBottom: 24,
  },
  addButtonText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 40,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
