import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Calendar, MapPin, Bell, Clock } from 'lucide-react-native';
import { DoctorProfile, Appointment } from '@/types/database';

export default function PatientHome() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('patient_id', user?.id)
        .eq('status', 'booked')
        .order('appointment_date', { ascending: true })
        .limit(5);

      if (!error && data) {
        setAppointments(data);
      }
    } catch (error) {
      console.error('Error loading appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('common.app_name')}</Text>
        <Text style={styles.headerSubtitle}>{t('auth.tagline')}</Text>
      </View>

      <View style={styles.quickActions}>
        <TouchableOpacity
          style={[styles.actionCard, { backgroundColor: '#dbeafe' }]}
          onPress={() => router.push('/(patient)/book-appointment')}
        >
          <Calendar size={32} color="#2563eb" />
          <Text style={styles.actionText}>{t('patient.book_appointment')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionCard, { backgroundColor: '#fef3c7' }]}
          onPress={() => router.push('/(patient)/nearby-pharmacies')}
        >
          <MapPin size={32} color="#f59e0b" />
          <Text style={styles.actionText}>{t('patient.nearby_pharmacies')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('doctor.upcoming')}</Text>
        {loading ? (
          <ActivityIndicator size="small" color="#10b981" />
        ) : appointments.length > 0 ? (
          appointments.map((appointment) => (
            <View key={appointment.id} style={styles.appointmentCard}>
              <View style={styles.appointmentIcon}>
                <Clock size={20} color="#10b981" />
              </View>
              <View style={styles.appointmentInfo}>
                <Text style={styles.appointmentDate}>
                  {new Date(appointment.appointment_date).toLocaleDateString()}
                </Text>
                <Text style={styles.appointmentTime}>{appointment.slot_time}</Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No upcoming appointments</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    padding: 24,
    paddingTop: 60,
    backgroundColor: '#10b981',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#d1fae5',
  },
  quickActions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  actionCard: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    gap: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 16,
  },
  appointmentCard: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  appointmentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#d1fae5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appointmentInfo: {
    marginLeft: 12,
    justifyContent: 'center',
  },
  appointmentDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  appointmentTime: {
    fontSize: 14,
    color: '#6b7280',
  },
  emptyText: {
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: 16,
    marginTop: 20,
  },
});
