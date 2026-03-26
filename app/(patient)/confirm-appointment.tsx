import { useState, useEffect } from 'react';
import {
  View,
  Text,
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
import { DoctorProfile } from '@/types/database';
import { ArrowLeft, Calendar, Clock } from 'lucide-react-native';

export default function ConfirmAppointment() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const router = useRouter();
  const { doctorId } = useLocalSearchParams<{ doctorId: string }>();
  const [doctor, setDoctor] = useState<DoctorProfile | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);

  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '14:00', '14:30', '15:00', '15:30', '16:00',
    '16:30', '17:00', '17:30', '18:00',
  ];

  const getNextSevenDays = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      days.push(date.toISOString().split('T')[0]);
    }
    return days;
  };

  useEffect(() => {
    loadDoctor();
  }, []);

  const loadDoctor = async () => {
    try {
      const { data, error } = await supabase
        .from('doctor_profiles')
        .select('*')
        .eq('user_id', doctorId)
        .maybeSingle();

      if (data) {
        setDoctor(data);
      }
    } catch (error) {
      console.error('Error loading doctor:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookAppointment = async () => {
    if (!selectedDate || !selectedTime) {
      Alert.alert('Error', 'Please select date and time');
      return;
    }

    setBooking(true);
    try {
      const { error } = await supabase.from('appointments').insert({
        patient_id: user?.id,
        doctor_id: doctorId,
        appointment_date: selectedDate,
        slot_time: selectedTime,
        status: 'booked',
      });

      if (error) throw error;

      await supabase.from('notifications').insert({
        user_id: doctorId,
        title: 'New Appointment',
        message: `You have a new appointment on ${selectedDate} at ${selectedTime}`,
        type: 'appointment',
      });

      Alert.alert('Success', t('appointment.booking_confirmed'), [
        { text: 'OK', onPress: () => router.replace('/(patient)') },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to book appointment');
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('appointment.confirm_booking')}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {doctor && (
          <View style={styles.doctorCard}>
            <Text style={styles.doctorName}>{doctor.full_name}</Text>
            <Text style={styles.doctorSpecialty}>{doctor.specialty}</Text>
            <Text style={styles.doctorFee}>₹{doctor.consultation_fee}</Text>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Calendar size={20} color="#1f2937" />
            <Text style={styles.sectionTitle}>{t('appointment.select_date')}</Text>
          </View>
          <View style={styles.dateContainer}>
            {getNextSevenDays().map((date) => (
              <TouchableOpacity
                key={date}
                style={[
                  styles.dateCard,
                  selectedDate === date && styles.dateCardSelected,
                ]}
                onPress={() => setSelectedDate(date)}
              >
                <Text
                  style={[
                    styles.dateText,
                    selectedDate === date && styles.dateTextSelected,
                  ]}
                >
                  {new Date(date).toLocaleDateString('en-US', {
                    day: 'numeric',
                    month: 'short',
                  })}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Clock size={20} color="#1f2937" />
            <Text style={styles.sectionTitle}>{t('appointment.select_slot')}</Text>
          </View>
          <View style={styles.timeContainer}>
            {timeSlots.map((time) => (
              <TouchableOpacity
                key={time}
                style={[
                  styles.timeCard,
                  selectedTime === time && styles.timeCardSelected,
                ]}
                onPress={() => setSelectedTime(time)}
              >
                <Text
                  style={[
                    styles.timeText,
                    selectedTime === time && styles.timeTextSelected,
                  ]}
                >
                  {time}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.button, booking && styles.buttonDisabled]}
          onPress={handleBookAppointment}
          disabled={booking}
        >
          <Text style={styles.buttonText}>
            {booking ? t('common.loading') : t('appointment.confirm_booking')}
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
  doctorCard: {
    padding: 20,
    backgroundColor: '#dbeafe',
    borderRadius: 16,
    marginBottom: 24,
  },
  doctorName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  doctorSpecialty: {
    fontSize: 16,
    color: '#3b82f6',
    marginBottom: 8,
  },
  doctorFee: {
    fontSize: 18,
    fontWeight: '600',
    color: '#059669',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  dateContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  dateCard: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  dateCardSelected: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  dateText: {
    fontSize: 13,
    color: '#1f2937',
    fontWeight: '500',
  },
  dateTextSelected: {
    color: '#ffffff',
  },
  timeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeCard: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  timeCardSelected: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  timeText: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '500',
  },
  timeTextSelected: {
    color: '#ffffff',
  },
  button: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
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
