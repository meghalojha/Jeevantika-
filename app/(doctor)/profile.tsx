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
import { DoctorProfile } from '@/types/database';
import { LogOut, Stethoscope } from 'lucide-react-native';

export default function DoctorProfileScreen() {
  const { t } = useLanguage();
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<DoctorProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('doctor_profiles')
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
        <ActivityIndicator size="large" color="#3b82f6" />
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
                <Stethoscope size={40} color="#3b82f6" />
              </View>
              <Text style={styles.name}>{profile.full_name}</Text>
              <Text style={styles.specialty}>{profile.specialty}</Text>
              <Text style={styles.qualification}>{profile.qualification}</Text>
            </View>

            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{t('doctor.experience')}</Text>
                <Text style={styles.infoValue}>{profile.experience_years} years</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{t('doctor.consultation_fee')}</Text>
                <Text style={styles.infoValue}>₹{profile.consultation_fee}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{t('doctor.clinic_address')}</Text>
                <Text style={styles.infoValue}>{profile.clinic_address}</Text>
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
    backgroundColor: '#3b82f6',
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
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  specialty: {
    fontSize: 16,
    color: '#3b82f6',
    marginBottom: 4,
  },
  qualification: {
    fontSize: 14,
    color: '#6b7280',
  },
  infoCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    padding: 16,
    gap: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  infoRow: {
    gap: 4,
  },
  infoLabel: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
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
