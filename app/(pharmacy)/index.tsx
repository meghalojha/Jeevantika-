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
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import {
  PharmacyOrder,
  Prescription,
  PrescriptionMedicine,
  PatientProfile,
} from '@/types/database';
import { Package, User, CircleCheck as CheckCircle } from 'lucide-react-native';

interface OrderWithDetails extends PharmacyOrder {
  prescription: Prescription & {
    medicines: PrescriptionMedicine[];
    patient: PatientProfile;
  };
}

export default function PharmacyOrders() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'ready'>('pending');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, [filter]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('pharmacy_orders')
        .select('*')
        .eq('pharmacy_id', user?.id)
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data: ordersData, error } = await query;

      if (error) throw error;

      if (ordersData) {
        const ordersWithDetails = await Promise.all(
          ordersData.map(async (order) => {
            const { data: prescData } = await supabase
              .from('prescriptions')
              .select('*')
              .eq('id', order.prescription_id)
              .maybeSingle();

            if (prescData) {
              const { data: medicinesData } = await supabase
                .from('prescription_medicines')
                .select('*')
                .eq('prescription_id', prescData.id);

              const { data: patientData } = await supabase
                .from('patient_profiles')
                .select('*')
                .eq('user_id', prescData.patient_id)
                .maybeSingle();

              return {
                ...order,
                prescription: {
                  ...prescData,
                  medicines: medicinesData || [],
                  patient: patientData,
                },
              };
            }
            return null;
          })
        );

        setOrders(ordersWithDetails.filter(Boolean) as any);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOrderStatus = async (
    orderId: string,
    status: 'available' | 'substitute' | 'out_of_stock' | 'ready',
    patientId: string
  ) => {
    try {
      const { error } = await supabase
        .from('pharmacy_orders')
        .update({ status })
        .eq('id', orderId);

      if (error) throw error;

      await supabase.from('notifications').insert({
        user_id: patientId,
        title: 'Order Update',
        message: `Your order status: ${status}`,
        type: 'order_update',
      });

      Alert.alert('Success', 'Order status updated');
      loadOrders();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update order');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('pharmacy.orders')}</Text>
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
          style={[styles.filterButton, filter === 'pending' && styles.filterButtonActive]}
          onPress={() => setFilter('pending')}
        >
          <Text
            style={[
              styles.filterButtonText,
              filter === 'pending' && styles.filterButtonTextActive,
            ]}
          >
            {t('pharmacy.pending_orders')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'ready' && styles.filterButtonActive]}
          onPress={() => setFilter('ready')}
        >
          <Text
            style={[
              styles.filterButtonText,
              filter === 'ready' && styles.filterButtonTextActive,
            ]}
          >
            Ready
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color="#f59e0b" style={{ marginTop: 40 }} />
        ) : orders.length > 0 ? (
          orders.map((order) => (
            <View key={order.id} style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <View style={styles.patientIcon}>
                  <User size={24} color="#f59e0b" />
                </View>
                <View style={styles.orderInfo}>
                  <Text style={styles.patientName}>
                    {order.prescription?.patient?.full_name || 'Patient'}
                  </Text>
                  <Text style={styles.orderDate}>
                    {new Date(order.created_at).toLocaleDateString()}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    order.status === 'ready' && styles.statusBadgeReady,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      order.status === 'ready' && styles.statusTextReady,
                    ]}
                  >
                    {order.status}
                  </Text>
                </View>
              </View>

              <View style={styles.medicinesContainer}>
                {order.prescription?.medicines.map((medicine) => (
                  <View key={medicine.id} style={styles.medicineItem}>
                    <Package size={16} color="#6b7280" />
                    <Text style={styles.medicineName}>{medicine.medicine_name}</Text>
                    <Text style={styles.medicineDetails}>
                      {medicine.dosage} • {medicine.duration}
                    </Text>
                  </View>
                ))}
              </View>

              {order.status === 'pending' && (
                <View style={styles.actionsContainer}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.actionButtonAvailable]}
                    onPress={() =>
                      handleUpdateOrderStatus(
                        order.id,
                        'available',
                        order.prescription.patient_id
                      )
                    }
                  >
                    <Text style={styles.actionButtonText}>
                      {t('pharmacy.available')}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, styles.actionButtonSubstitute]}
                    onPress={() =>
                      handleUpdateOrderStatus(
                        order.id,
                        'substitute',
                        order.prescription.patient_id
                      )
                    }
                  >
                    <Text style={styles.actionButtonText}>
                      {t('pharmacy.substitute')}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, styles.actionButtonOutOfStock]}
                    onPress={() =>
                      handleUpdateOrderStatus(
                        order.id,
                        'out_of_stock',
                        order.prescription.patient_id
                      )
                    }
                  >
                    <Text style={styles.actionButtonText}>
                      {t('pharmacy.out_of_stock')}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {(order.status === 'available' || order.status === 'substitute') && (
                <TouchableOpacity
                  style={styles.readyButton}
                  onPress={() =>
                    handleUpdateOrderStatus(
                      order.id,
                      'ready',
                      order.prescription.patient_id
                    )
                  }
                >
                  <CheckCircle size={18} color="#ffffff" />
                  <Text style={styles.readyButtonText}>{t('pharmacy.mark_ready')}</Text>
                </TouchableOpacity>
              )}
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No orders found</Text>
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
    backgroundColor: '#f59e0b',
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
    backgroundColor: '#f59e0b',
    borderColor: '#f59e0b',
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
  orderCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  orderHeader: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'center',
  },
  patientIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderInfo: {
    marginLeft: 12,
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  orderDate: {
    fontSize: 13,
    color: '#6b7280',
  },
  statusBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  statusBadgeReady: {
    backgroundColor: '#d1fae5',
  },
  statusText: {
    fontSize: 11,
    color: '#92400e',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  statusTextReady: {
    color: '#059669',
  },
  medicinesContainer: {
    gap: 8,
    marginBottom: 16,
  },
  medicineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 8,
  },
  medicineName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  medicineDetails: {
    fontSize: 12,
    color: '#6b7280',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonAvailable: {
    backgroundColor: '#059669',
  },
  actionButtonSubstitute: {
    backgroundColor: '#f59e0b',
  },
  actionButtonOutOfStock: {
    backgroundColor: '#ef4444',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  readyButton: {
    flexDirection: 'row',
    backgroundColor: '#10b981',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  readyButtonText: {
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
