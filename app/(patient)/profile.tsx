import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { PatientProfile } from '@/types/database';
import { LogOut, CreditCard as Edit } from 'lucide-react-native';

export default function Profile() {
  const { t, language, setLanguage } = useLanguage();
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('patient_profiles')
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

  const handleSaveProfile = async () => {
    if (!profile) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('patient_profiles')
        .update({
          full_name: profile.full_name,
          age: profile.age,
          gender: profile.gender,
          blood_group: profile.blood_group,
          city: profile.city,
          pin_code: profile.pin_code,
          known_diseases: profile.known_diseases,
          allergies: profile.allergies,
          emergency_contact: profile.emergency_contact,
        })
        .eq('user_id', user?.id);

      if (error) throw error;

      Alert.alert('Success', 'Profile updated successfully');
      setEditing(false);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setSaving(false);
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
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('patient.profile')}</Text>
        <TouchableOpacity onPress={() => setEditing(!editing)}>
          <Edit size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.languageSelector}>
          <Text style={styles.label}>Language</Text>
          <View style={styles.languageButtons}>
            <TouchableOpacity
              style={[styles.langButton, language === 'en' && styles.langButtonActive]}
              onPress={() => setLanguage('en')}
            >
              <Text
                style={[
                  styles.langButtonText,
                  language === 'en' && styles.langButtonTextActive,
                ]}
              >
                English
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.langButton, language === 'hi' && styles.langButtonActive]}
              onPress={() => setLanguage('hi')}
            >
              <Text
                style={[
                  styles.langButtonText,
                  language === 'hi' && styles.langButtonTextActive,
                ]}
              >
                हिंदी
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.langButton, language === 'gu' && styles.langButtonActive]}
              onPress={() => setLanguage('gu')}
            >
              <Text
                style={[
                  styles.langButtonText,
                  language === 'gu' && styles.langButtonTextActive,
                ]}
              >
                ગુજરાતી
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {profile && (
          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>{t('patient.full_name')}</Text>
              <TextInput
                style={[styles.input, !editing && styles.inputDisabled]}
                value={profile.full_name}
                onChangeText={(text) => setProfile({ ...profile, full_name: text })}
                editable={editing}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>{t('patient.age')}</Text>
              <TextInput
                style={[styles.input, !editing && styles.inputDisabled]}
                value={profile.age?.toString() || ''}
                onChangeText={(text) =>
                  setProfile({ ...profile, age: parseInt(text) || undefined })
                }
                keyboardType="number-pad"
                editable={editing}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>{t('patient.blood_group')}</Text>
              <TextInput
                style={[styles.input, !editing && styles.inputDisabled]}
                value={profile.blood_group || ''}
                onChangeText={(text) => setProfile({ ...profile, blood_group: text })}
                editable={editing}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>{t('patient.city')}</Text>
              <TextInput
                style={[styles.input, !editing && styles.inputDisabled]}
                value={profile.city || ''}
                onChangeText={(text) => setProfile({ ...profile, city: text })}
                editable={editing}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>{t('patient.emergency_contact')}</Text>
              <TextInput
                style={[styles.input, !editing && styles.inputDisabled]}
                value={profile.emergency_contact || ''}
                onChangeText={(text) => setProfile({ ...profile, emergency_contact: text })}
                keyboardType="phone-pad"
                editable={editing}
              />
            </View>

            {editing && (
              <TouchableOpacity
                style={[styles.button, saving && styles.buttonDisabled]}
                onPress={handleSaveProfile}
                disabled={saving}
              >
                <Text style={styles.buttonText}>
                  {saving ? t('common.loading') : t('common.save')}
                </Text>
              </TouchableOpacity>
            )}
          </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  languageSelector: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  languageButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  langButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  langButtonActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  langButtonText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  langButtonTextActive: {
    color: '#ffffff',
  },
  form: {
    gap: 16,
  },
  field: {
    gap: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#f9fafb',
  },
  inputDisabled: {
    backgroundColor: '#f3f4f6',
    color: '#6b7280',
  },
  button: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
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
    marginTop: 24,
    marginBottom: 40,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
  },
});
