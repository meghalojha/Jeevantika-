import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useLanguage } from '@/contexts/LanguageContext';
import { User, Stethoscope, Store } from 'lucide-react-native';
import { UserRole } from '@/types/database';

export default function RoleSelection() {
  const { t } = useLanguage();
  const router = useRouter();

  const handleSelectRole = (role: UserRole) => {
    router.push({
      pathname: '/auth/create-profile',
      params: { role },
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('auth.select_role')}</Text>

      <View style={styles.roleContainer}>
        <TouchableOpacity
          style={styles.roleCard}
          onPress={() => handleSelectRole('patient')}
        >
          <User size={48} color="#10b981" strokeWidth={1.5} />
          <Text style={styles.roleText}>{t('auth.patient')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.roleCard}
          onPress={() => handleSelectRole('doctor')}
        >
          <Stethoscope size={48} color="#3b82f6" strokeWidth={1.5} />
          <Text style={styles.roleText}>{t('auth.doctor')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.roleCard}
          onPress={() => handleSelectRole('pharmacy')}
        >
          <Store size={48} color="#f59e0b" strokeWidth={1.5} />
          <Text style={styles.roleText}>{t('auth.pharmacy')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 40,
  },
  roleContainer: {
    gap: 16,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 16,
    gap: 20,
    backgroundColor: '#f9fafb',
  },
  roleText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
  },
});
