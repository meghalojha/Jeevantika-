import { Tabs } from 'expo-router';
import { LayoutDashboard, Calendar, User } from 'lucide-react-native';
import { useLanguage } from '@/contexts/LanguageContext';

export default function DoctorLayout() {
  const { t } = useLanguage();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('doctor.dashboard'),
          tabBarIcon: ({ size, color }) => <LayoutDashboard size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="appointments"
        options={{
          title: t('doctor.appointments'),
          tabBarIcon: ({ size, color }) => <Calendar size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('patient.profile'),
          tabBarIcon: ({ size, color }) => <User size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
