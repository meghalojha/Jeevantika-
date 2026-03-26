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
import { Appointment, PatientProfile } from '@/types/database';
import { Calendar, User, Clock } from 'lucide-react-native';

interface AppointmentWithPatient extends Appointment {
  patient: PatientProfile;
}

export default function Appointments() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const router = useRouter();
  const [appointments, setAppointments] = useState<AppointmentWithPatient[]>([]);
  const [filter, setFilter] = useState<'all' | 'booked' | 'completed'>('booked');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAppointments();
  }, [filter]);

  const loadAppointments = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('appointments')
        .select('*')
        .eq('doctor_id', user?.id)
        .order('appointment_date', { ascending: false })
        .order('slot_time', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data: appointmentsData, error } = await query;

      if (error) throw error;

      if (appointmentsData) {
        const appointmentsWithPatients = await Promise.all(
          appointmentsData.map(async (apt) => {
            const { data: patientData } = await supabase
              .from('patient_profiles')
              .select('*')
              .eq('user_id', apt.patient_id)
              .maybeSingle();

            return {
              ...apt,
              patient: patientData,
            };
          })
        );

        setAppointments(appointmentsWithPatients as any);
      }
    } catch (error) {
      console.error('Error loading appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('doctor.appointments')}</Text>
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
          onPress={() => setFilter('all')}
        >
          <Text
            style={[
              styles.filterButtonText,
              filter === 'all' && styles.filterButtonTextActive,
            ]}
          >
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'booked' && styles.filterButtonActive]}
          onPress={() => setFilter('booked')}
        >
          <Text
            style={[
              styles.filterButtonText,
              filter === 'booked' && styles.filterButtonTextActive,
            ]}
          >
            {t('doctor.upcoming')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'completed' && styles.filterButtonActive]}
          onPress={() => setFilter('completed')}
        >
          <Text
            style={[
              styles.filterButtonText,
              filter === 'completed' && styles.filterButtonTextActive,
            ]}
          >
            {t('doctor.completed')}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 40 }} />
        ) : appointments.length > 0 ? (
          appointments.map((appointment) => (
            <TouchableOpacity
              key={appointment.id}
              style={styles.appointmentCard}
              onPress={() =>
                router.push({
                  pathname: '/(doctor)/create-prescription',
                  params: { appointmentId: appointment.id },
                })
              }
            >
              <View style={styles.patientIcon}>
                <User size={24} color="#3b82f6" />
              </View>
              <View style={styles.appointmentDetails}>
                <Text style={styles.patientName}>
                  {appointment.patient?.full_name || 'Patient'}
                </Text>
                <View style={styles.detailRow}>
                  <Calendar size={14} color="#6b7280" />
                  <Text style={styles.detailText}>
                    {new Date(appointment.appointment_date).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Clock size={14} color="#6b7280" />
                  <Text style={styles.detailText}>{appointment.slot_time}</Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    appointment.status === 'completed' && styles.statusBadgeCompleted,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      appointment.status === 'completed' && styles.statusTextCompleted,
                    ]}
                  >
                    {appointment.status}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.emptyText}>No appointments found</Text>
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
    padding: 24,
    paddingTop: 60,
    backgroundColor: '#3b82f6',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  filterButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#ffffff',
  },
  content: {
    flex: 1,
    padding: 16,
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
  patientIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appointmentDetails: {
    marginLeft: 12,
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 6,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  detailText: {
    fontSize: 13,
    color: '#6b7280',
  },
  statusBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  statusBadgeCompleted: {
    backgroundColor: '#d1fae5',
  },
  statusText: {
    fontSize: 11,
    color: '#92400e',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  statusTextCompleted: {
    color: '#059669',
  },
  emptyText: {
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: 16,
    marginTop: 40,
  },
});
