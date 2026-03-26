import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { UserRole } from '@/types/database';

export default function CreateProfile() {
  const { role } = useLocalSearchParams<{ role: UserRole }>();
  const { createProfile } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [patientData, setPatientData] = useState({
    full_name: '',
    age: '',
    gender: '',
    blood_group: '',
    city: '',
    pin_code: '',
    known_diseases: '',
    allergies: '',
    emergency_contact: '',
  });

  const [doctorData, setDoctorData] = useState({
    full_name: '',
    qualification: '',
    specialty: '',
    clinic_address: '',
    consultation_fee: '',
    experience_years: '',
  });

  const [pharmacyData, setPharmacyData] = useState({
    shop_name: '',
    address: '',
    city: '',
    pin_code: '',
    delivery_available: false,
  });

  const handleSubmit = async () => {
    let profileData: any = {};

    if (role === 'patient') {
      if (!patientData.full_name) {
        Alert.alert('Error', 'Please enter your name');
        return;
      }
      profileData = {
        ...patientData,
        age: patientData.age ? parseInt(patientData.age) : null,
      };
    } else if (role === 'doctor') {
      if (!doctorData.full_name || !doctorData.qualification || !doctorData.specialty) {
        Alert.alert('Error', 'Please fill all required fields');
        return;
      }
      profileData = {
        ...doctorData,
        consultation_fee: parseInt(doctorData.consultation_fee) || 0,
        experience_years: parseInt(doctorData.experience_years) || 0,
      };
    } else if (role === 'pharmacy') {
      if (!pharmacyData.shop_name || !pharmacyData.address) {
        Alert.alert('Error', 'Please fill all required fields');
        return;
      }
      profileData = pharmacyData;
    }

    setLoading(true);
    try {
      await createProfile(role, profileData);
      router.replace('/');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>
        {role === 'patient' && t('patient.profile')}
        {role === 'doctor' && t('doctor.dashboard')}
        {role === 'pharmacy' && t('pharmacy.shop_name')}
      </Text>

      {role === 'patient' && (
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder={t('patient.full_name')}
            value={patientData.full_name}
            onChangeText={(text) => setPatientData({ ...patientData, full_name: text })}
          />
          <TextInput
            style={styles.input}
            placeholder={t('patient.age')}
            value={patientData.age}
            onChangeText={(text) => setPatientData({ ...patientData, age: text })}
            keyboardType="number-pad"
          />
          <TextInput
            style={styles.input}
            placeholder={t('patient.city')}
            value={patientData.city}
            onChangeText={(text) => setPatientData({ ...patientData, city: text })}
          />
          <TextInput
            style={styles.input}
            placeholder={t('patient.blood_group')}
            value={patientData.blood_group}
            onChangeText={(text) => setPatientData({ ...patientData, blood_group: text })}
          />
          <TextInput
            style={styles.input}
            placeholder={t('patient.emergency_contact')}
            value={patientData.emergency_contact}
            onChangeText={(text) =>
              setPatientData({ ...patientData, emergency_contact: text })
            }
            keyboardType="phone-pad"
          />
        </View>
      )}

      {role === 'doctor' && (
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder={t('patient.full_name')}
            value={doctorData.full_name}
            onChangeText={(text) => setDoctorData({ ...doctorData, full_name: text })}
          />
          <TextInput
            style={styles.input}
            placeholder={t('doctor.qualification')}
            value={doctorData.qualification}
            onChangeText={(text) => setDoctorData({ ...doctorData, qualification: text })}
          />
          <TextInput
            style={styles.input}
            placeholder={t('doctor.specialty')}
            value={doctorData.specialty}
            onChangeText={(text) => setDoctorData({ ...doctorData, specialty: text })}
          />
          <TextInput
            style={styles.input}
            placeholder={t('doctor.clinic_address')}
            value={doctorData.clinic_address}
            onChangeText={(text) => setDoctorData({ ...doctorData, clinic_address: text })}
          />
          <TextInput
            style={styles.input}
            placeholder={t('doctor.consultation_fee')}
            value={doctorData.consultation_fee}
            onChangeText={(text) =>
              setDoctorData({ ...doctorData, consultation_fee: text })
            }
            keyboardType="number-pad"
          />
          <TextInput
            style={styles.input}
            placeholder={t('doctor.experience')}
            value={doctorData.experience_years}
            onChangeText={(text) =>
              setDoctorData({ ...doctorData, experience_years: text })
            }
            keyboardType="number-pad"
          />
        </View>
      )}

      {role === 'pharmacy' && (
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder={t('pharmacy.shop_name')}
            value={pharmacyData.shop_name}
            onChangeText={(text) => setPharmacyData({ ...pharmacyData, shop_name: text })}
          />
          <TextInput
            style={styles.input}
            placeholder={t('pharmacy.address')}
            value={pharmacyData.address}
            onChangeText={(text) => setPharmacyData({ ...pharmacyData, address: text })}
          />
          <TextInput
            style={styles.input}
            placeholder={t('patient.city')}
            value={pharmacyData.city}
            onChangeText={(text) => setPharmacyData({ ...pharmacyData, city: text })}
          />
          <TextInput
            style={styles.input}
            placeholder={t('patient.pin_code')}
            value={pharmacyData.pin_code}
            onChangeText={(text) => setPharmacyData({ ...pharmacyData, pin_code: text })}
          />
        </View>
      )}

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? t('common.loading') : t('common.submit')}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginTop: 60,
    marginBottom: 24,
  },
  form: {
    gap: 16,
    marginBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#f9fafb',
  },
  button: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 40,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
