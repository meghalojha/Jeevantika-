import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { DoctorProfile, User } from '@/types/database';
import { ArrowLeft, Search, Stethoscope } from 'lucide-react-native';

export default function BookAppointment() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const router = useRouter();
  const [doctors, setDoctors] = useState<(DoctorProfile & { user: User })[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<(DoctorProfile & { user: User })[]>(
    []
  );
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDoctors();
  }, []);

  useEffect(() => {
    if (search) {
      const filtered = doctors.filter(
        (doc) =>
          doc.full_name.toLowerCase().includes(search.toLowerCase()) ||
          doc.specialty.toLowerCase().includes(search.toLowerCase())
      );
      setFilteredDoctors(filtered);
    } else {
      setFilteredDoctors(doctors);
    }
  }, [search, doctors]);

  const loadDoctors = async () => {
    try {
      const { data, error } = await supabase
        .from('doctor_profiles')
        .select('*, user:users!user_id(*)')
        .eq('is_verified', true);

      if (!error && data) {
        setDoctors(data as any);
        setFilteredDoctors(data as any);
      }
    } catch (error) {
      console.error('Error loading doctors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDoctor = (doctor: DoctorProfile) => {
    router.push({
      pathname: '/(patient)/confirm-appointment',
      params: { doctorId: doctor.user_id },
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('patient.book_appointment')}</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.searchContainer}>
        <Search size={20} color="#9ca3af" />
        <TextInput
          style={styles.searchInput}
          placeholder={t('appointment.filter_by_specialty')}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <ScrollView style={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color="#10b981" style={{ marginTop: 40 }} />
        ) : filteredDoctors.length > 0 ? (
          filteredDoctors.map((doctor) => (
            <TouchableOpacity
              key={doctor.id}
              style={styles.doctorCard}
              onPress={() => handleSelectDoctor(doctor)}
            >
              <View style={styles.doctorIcon}>
                <Stethoscope size={24} color="#3b82f6" />
              </View>
              <View style={styles.doctorInfo}>
                <Text style={styles.doctorName}>{doctor.full_name}</Text>
                <Text style={styles.doctorSpecialty}>{doctor.specialty}</Text>
                <Text style={styles.doctorDetails}>
                  {doctor.experience_years} {t('doctor.experience')} • ₹
                  {doctor.consultation_fee}
                </Text>
                <Text style={styles.doctorAddress}>{doctor.clinic_address}</Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.emptyText}>No doctors found</Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  doctorCard: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  doctorIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  doctorInfo: {
    marginLeft: 12,
    flex: 1,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  doctorSpecialty: {
    fontSize: 14,
    color: '#3b82f6',
    marginBottom: 4,
  },
  doctorDetails: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 4,
  },
  doctorAddress: {
    fontSize: 12,
    color: '#9ca3af',
  },
  emptyText: {
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: 16,
    marginTop: 40,
  },
});
