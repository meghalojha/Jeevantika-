import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Prescription, PrescriptionMedicine, DoctorProfile } from '@/types/database';
import { FileText, Send } from 'lucide-react-native';

interface PrescriptionWithDetails extends Prescription {
  doctor_profile: DoctorProfile;
  medicines: PrescriptionMedicine[];
}

export default function Prescriptions() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const router = useRouter();
  const [prescriptions, setPrescriptions] = useState<PrescriptionWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPrescriptions();
  }, []);

  const loadPrescriptions = async () => {
    try {
      const { data: prescData, error: prescError } = await supabase
        .from('prescriptions')
        .select('*')
        .eq('patient_id', user?.id)
        .order('created_at', { ascending: false });

      if (prescError) throw prescError;

      if (prescData) {
        const prescriptionsWithDetails = await Promise.all(
          prescData.map(async (presc) => {
            const { data: doctorData } = await supabase
              .from('doctor_profiles')
              .select('*')
              .eq('user_id', presc.doctor_id)
              .maybeSingle();

            const { data: medicinesData } = await supabase
              .from('prescription_medicines')
              .select('*')
              .eq('prescription_id', presc.id);

            return {
              ...presc,
              doctor_profile: doctorData,
              medicines: medicinesData || [],
            };
          })
        );

        setPrescriptions(prescriptionsWithDetails as any);
      }
    } catch (error) {
      console.error('Error loading prescriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendToPharmacy = (prescriptionId: string) => {
    router.push({
      pathname: '/(patient)/send-to-pharmacy',
      params: { prescriptionId },
    });
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
        <Text style={styles.headerTitle}>{t('patient.my_prescriptions')}</Text>
      </View>

      <ScrollView style={styles.content}>
        {prescriptions.length > 0 ? (
          prescriptions.map((prescription) => (
            <View key={prescription.id} style={styles.prescriptionCard}>
              <View style={styles.prescriptionHeader}>
                <View style={styles.iconContainer}>
                  <FileText size={24} color="#3b82f6" />
                </View>
                <View style={styles.prescriptionInfo}>
                  <Text style={styles.doctorName}>
                    {prescription.doctor_profile?.full_name || 'Doctor'}
                  </Text>
                  <Text style={styles.date}>
                    {new Date(prescription.created_at).toLocaleDateString()}
                  </Text>
                </View>
              </View>

              <View style={styles.medicinesContainer}>
                {prescription.medicines.map((medicine) => (
                  <View key={medicine.id} style={styles.medicineItem}>
                    <Text style={styles.medicineName}>{medicine.medicine_name}</Text>
                    <Text style={styles.medicineDetails}>
                      {medicine.dosage} • {medicine.pattern} • {medicine.duration}
                    </Text>
                    {medicine.food_instruction && (
                      <Text style={styles.foodInstruction}>
                        {medicine.food_instruction}
                      </Text>
                    )}
                  </View>
                ))}
              </View>

              {prescription.doctor_remarks && (
                <View style={styles.remarksContainer}>
                  <Text style={styles.remarksLabel}>{t('prescription.doctor_remarks')}:</Text>
                  <Text style={styles.remarksText}>{prescription.doctor_remarks}</Text>
                </View>
              )}

              <TouchableOpacity
                style={styles.sendButton}
                onPress={() => handleSendToPharmacy(prescription.id)}
              >
                <Send size={18} color="#ffffff" />
                <Text style={styles.sendButtonText}>{t('prescription.send_to_pharmacy')}</Text>
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No prescriptions yet</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  header: {
    padding: 24,
    paddingTop: 60,
    backgroundColor: '#10b981',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  prescriptionCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  prescriptionHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  prescriptionInfo: {
    marginLeft: 12,
    justifyContent: 'center',
  },
  doctorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  date: {
    fontSize: 14,
    color: '#6b7280',
  },
  medicinesContainer: {
    gap: 12,
    marginBottom: 16,
  },
  medicineItem: {
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 8,
  },
  medicineName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  medicineDetails: {
    fontSize: 13,
    color: '#6b7280',
  },
  foodInstruction: {
    fontSize: 12,
    color: '#059669',
    marginTop: 4,
  },
  remarksContainer: {
    backgroundColor: '#fffbeb',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  remarksLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 4,
  },
  remarksText: {
    fontSize: 14,
    color: '#78350f',
  },
  sendButton: {
    flexDirection: 'row',
    backgroundColor: '#10b981',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  sendButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: 16,
    marginTop: 40,
  },
});
