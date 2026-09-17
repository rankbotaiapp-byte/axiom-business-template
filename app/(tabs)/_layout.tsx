import { Tabs } from 'expo-router';

import { color, type } from '../../src/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: color.accent,
        tabBarInactiveTintColor: color.faint,
        tabBarStyle: {
          backgroundColor: color.bg,
          borderTopColor: color.border,
        },
        tabBarLabelStyle: {
          ...type.overline,
          fontSize: 10,
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Operations' }} />
      <Tabs.Screen name="vision" options={{ title: 'Vision' }} />
      <Tabs.Screen name="capacity" options={{ title: 'Capacity' }} />
      <Tabs.Screen name="portfolio" options={{ title: 'Portfolio' }} />
    </Tabs>
  );
}
