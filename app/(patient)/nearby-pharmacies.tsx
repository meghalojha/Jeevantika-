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
import { supabase } from '@/lib/supabase';
import { PharmacyProfile } from '@/types/database';
import { ArrowLeft, Store, MapPin, Phone } from 'lucide-react-native';

export default function NearbyPharmacies() {
  const { t } = useLanguage();
  const router = useRouter();
  const [pharmacies, setPharmacies] = useState<PharmacyProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPharmacies();
  }, []);

  const loadPharmacies = async () => {
    try {
      const { data, error } = await supabase
        .from('pharmacy_profiles')
        .select('*')
        .limit(50);

      if (!error && data) {
        setPharmacies(data);
      }
    } catch (error) {
      console.error('Error loading pharmacies:', error);
    } finally {
      setLoading(false);
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
                <Store size={32} color="#f59e0b" />
              </View>
              <View style={styles.pharmacyInfo}>
                <Text style={styles.pharmacyName}>{pharmacy.shop_name}</Text>
                <View style={styles.infoRow}>
                  <MapPin size={14} color="#6b7280" />
                  <Text style={styles.infoText}>
                    {pharmacy.address}, {pharmacy.city}
                  </Text>
                </View>
                {pharmacy.delivery_available && (
                  <View style={styles.deliveryBadge}>
                    <Text style={styles.deliveryText}>
                      {t('pharmacy.delivery_available')}
                    </Text>
                  </View>
                )}
              </View>
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
  },
  pharmacyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pharmacyInfo: {
    marginLeft: 16,
    flex: 1,
  },
  pharmacyName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 6,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginBottom: 6,
  },
  infoText: {
    fontSize: 13,
    color: '#6b7280',
    flex: 1,
  },
  deliveryBadge: {
    backgroundColor: '#d1fae5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  deliveryText: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: 16,
    marginTop: 40,
  },
});
