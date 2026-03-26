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
import { PharmacyProfile } from '@/types/database';
import { ArrowLeft, Store, MapPin } from 'lucide-react-native';

export default function SendToPharmacy() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const router = useRouter();
  const { prescriptionId } = useLocalSearchParams<{ prescriptionId: string }>();
  const [pharmacies, setPharmacies] = useState<PharmacyProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadPharmacies();
  }, []);

  const loadPharmacies = async () => {
    try {
      const { data, error } = await supabase
        .from('pharmacy_profiles')
        .select('*')
        .limit(20);

      if (!error && data) {
        setPharmacies(data);
      }
    } catch (error) {
      console.error('Error loading pharmacies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendToPharmacy = async (pharmacyId: string) => {
    setSending(true);
    try {
      const { error } = await supabase.from('pharmacy_orders').insert({
        prescription_id: prescriptionId,
        patient_id: user?.id,
        pharmacy_id: pharmacyId,
        status: 'pending',
      });

      if (error) throw error;

      await supabase.from('notifications').insert({
        user_id: pharmacyId,
        title: 'New Prescription Order',
        message: 'You have received a new prescription order',
        type: 'order',
      });

      Alert.alert('Success', 'Order sent to pharmacy successfully', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send order');
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('patient.nearby_pharmacies')}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color="#10b981" style={{ marginTop: 40 }} />
        ) : pharmacies.length > 0 ? (
          pharmacies.map((pharmacy) => (
            <View key={pharmacy.id} style={styles.pharmacyCard}>
              <View style={styles.pharmacyIcon}>
                <Store size={24} color="#f59e0b" />
              </View>
              <View style={styles.pharmacyInfo}>
                <Text style={styles.pharmacyName}>{pharmacy.shop_name}</Text>
                <View style={styles.locationRow}>
                  <MapPin size={14} color="#6b7280" />
                  <Text style={styles.pharmacyAddress}>
                    {pharmacy.address}, {pharmacy.city}
                  </Text>
                </View>
                {pharmacy.delivery_available && (
                  <Text style={styles.deliveryBadge}>{t('pharmacy.delivery_available')}</Text>
                )}
              </View>
              <TouchableOpacity
                style={styles.selectButton}
                onPress={() => handleSendToPharmacy(pharmacy.user_id)}
                disabled={sending}
              >
                <Text style={styles.selectButtonText}>Send</Text>
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No pharmacies found</Text>
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
  content: {
    flex: 1,
    padding: 16,
  },
  pharmacyCard: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  pharmacyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pharmacyInfo: {
    marginLeft: 12,
    flex: 1,
  },
  pharmacyName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  pharmacyAddress: {
    fontSize: 13,
    color: '#6b7280',
    flex: 1,
  },
  deliveryBadge: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '600',
  },
  selectButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  selectButtonText: {
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
