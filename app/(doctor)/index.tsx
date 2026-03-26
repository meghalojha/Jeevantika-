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
import { Appointment, DoctorProfile } from '@/types/database';
import { Users, Clock, CircleCheck as CheckCircle, FileText } from 'lucide-react-native';

export default function DoctorDashboard() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    today: 0,
    upcoming: 0,
    completed: 0,
  });
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];

      const { data: todayData } = await supabase
        .from('appointments')
        .select('*')
        .eq('doctor_id', user?.id)
        .eq('appointment_date', today)
        .eq('status', 'booked');

      const { data: upcomingData } = await supabase
        .from('appointments')
        .select('*')
        .eq('doctor_id', user?.id)
        .eq('status', 'booked')
        .gte('appointment_date', today);

      const { data: completedData } = await supabase
        .from('appointments')
        .select('*')
        .eq('doctor_id', user?.id)
        .eq('status', 'completed');

      setStats({
        today: todayData?.length || 0,
        upcoming: upcomingData?.length || 0,
        completed: completedData?.length || 0,
      });

      setTodayAppointments(todayData || []);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('doctor.dashboard')}</Text>
        <Text style={styles.headerSubtitle}>{t('common.app_name')}</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: '#dbeafe' }]}>
          <Users size={24} color="#2563eb" />
          <Text style={styles.statNumber}>{stats.today}</Text>
          <Text style={styles.statLabel}>{t('doctor.today_patients')}</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: '#fef3c7' }]}>
          <Clock size={24} color="#f59e0b" />
          <Text style={styles.statNumber}>{stats.upcoming}</Text>
          <Text style={styles.statLabel}>{t('doctor.upcoming')}</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: '#d1fae5' }]}>
          <CheckCircle size={24} color="#059669" />
          <Text style={styles.statNumber}>{stats.completed}</Text>
          <Text style={styles.statLabel}>{t('doctor.completed')}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today's Appointments</Text>
        {loading ? (
          <ActivityIndicator size="small" color="#3b82f6" />
        ) : todayAppointments.length > 0 ? (
          todayAppointments.map((appointment) => (
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
              <View style={styles.appointmentIcon}>
                <Clock size={20} color="#3b82f6" />
              </View>
              <View style={styles.appointmentInfo}>
                <Text style={styles.appointmentTime}>{appointment.slot_time}</Text>
                <Text style={styles.appointmentStatus}>{appointment.status}</Text>
              </View>
              <FileText size={20} color="#9ca3af" />
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.emptyText}>No appointments today</Text>
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
    backgroundColor: '#3b82f6',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#bfdbfe',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
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
    alignItems: 'center',
  },
  appointmentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appointmentInfo: {
    marginLeft: 12,
    flex: 1,
  },
  appointmentTime: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  appointmentStatus: {
    fontSize: 14,
    color: '#6b7280',
    textTransform: 'capitalize',
  },
  emptyText: {
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: 16,
    marginTop: 20,
  },
});
