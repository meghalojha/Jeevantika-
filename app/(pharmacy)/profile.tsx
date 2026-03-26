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
import { useRouter } from 'expo-router';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { PharmacyProfile } from '@/types/database';
import { LogOut, Store, MapPin, Phone } from 'lucide-react-native';

export default function PharmacyProfileScreen() {
  const { t } = useLanguage();
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<PharmacyProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('pharmacy_profiles')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (data) {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/auth/login');
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#f59e0b" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('patient.profile')}</Text>
      </View>

      <ScrollView style={styles.content}>
        {profile && (
          <>
            <View style={styles.profileCard}>
              <View style={styles.iconContainer}>
                <Store size={40} color="#f59e0b" />
              </View>
              <Text style={styles.name}>{profile.shop_name}</Text>
              <View style={styles.deliveryBadge}>
                <Text style={styles.deliveryText}>
                  {profile.delivery_available
                    ? t('pharmacy.delivery_available')
                    : 'Pickup Only'}
                </Text>
              </View>
            </View>

            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <MapPin size={20} color="#6b7280" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>{t('pharmacy.address')}</Text>
                  <Text style={styles.infoValue}>
                    {profile.address}, {profile.city}
                  </Text>
                  {profile.pin_code && (
                    <Text style={styles.infoValue}>PIN: {profile.pin_code}</Text>
                  )}
                </View>
              </View>

              <View style={styles.infoRow}>
                <Phone size={20} color="#6b7280" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Contact</Text>
                  <Text style={styles.infoValue}>{user?.phone || 'N/A'}</Text>
                </View>
              </View>
            </View>
          </>
        )}

        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <LogOut size={20} color="#ef4444" />
          <Text style={styles.signOutText}>Sign Out</Text>
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
    padding: 24,
    paddingTop: 60,
    backgroundColor: '#f59e0b',
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
  profileCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 12,
  },
  deliveryBadge: {
    backgroundColor: '#d1fae5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  deliveryText: {
    fontSize: 13,
    color: '#059669',
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    padding: 16,
    gap: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  infoRow: {
    flexDirection: 'row',
    gap: 12,
  },
  infoContent: {
    flex: 1,
    gap: 4,
  },
  infoLabel: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 15,
    color: '#1f2937',
    fontWeight: '600',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
    backgroundColor: '#fef2f2',
    marginBottom: 40,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
  },
});
