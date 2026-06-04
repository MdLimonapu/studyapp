import { FontAwesome } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

export default function TabLayout() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colorScheme === 'dark' ? '#ffffff' : '#12131a',
        tabBarInactiveTintColor: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.45)' : 'rgba(18, 19, 26, 0.45)',
        tabBarStyle: {
          position: 'absolute',
          bottom: Platform.OS === 'ios' ? 28 : 20,
          left: 16,
          right: 16,
          backgroundColor: colorScheme === 'dark' ? 'rgba(18, 22, 32, 0.82)' : 'rgba(255, 255, 255, 0.85)',
          borderWidth: 1.5,
          borderColor: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(18, 19, 26, 0.08)',
          borderRadius: 24,
          height: Platform.OS === 'ios' ? 76 : 66,
          paddingBottom: Platform.OS === 'ios' ? 14 : 8,
          paddingTop: 8,
          elevation: 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: colorScheme === 'dark' ? 0.4 : 0.1,
          shadowRadius: 16,
        },
        tabBarLabelStyle: {
          fontSize: 10.5,
          fontWeight: '700',
          marginTop: 2,
        },
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <FontAwesome name="home" size={focused ? 24 : 22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'My Matches',
          tabBarIcon: ({ color, focused }) => (
            <FontAwesome name="search" size={focused ? 24 : 22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="roadmap"
        options={{
          title: 'Eligibility',
          tabBarIcon: ({ color, focused }) => (
            <FontAwesome name="check-square-o" size={focused ? 24 : 22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="services"
        options={{
          title: 'Services',
          tabBarIcon: ({ color, focused }) => (
            <FontAwesome name="graduation-cap" size={focused ? 24 : 22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="contact"
        options={{
          title: 'Contact',
          tabBarIcon: ({ color, focused }) => (
            <FontAwesome name="envelope-o" size={focused ? 24 : 22} color={color} />
          ),
        }}
      />
      {/* Hidden tabs - these exist as files but are not shown in the tab bar */}
      <Tabs.Screen
        name="news"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="mymatches"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
