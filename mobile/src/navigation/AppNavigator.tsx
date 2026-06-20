import React from 'react';
import {NavigationContainer, DefaultTheme} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';
import {MediaNavigator} from './MediaNavigator';
import {FaceNavigator} from './FaceNavigator';
import {COLORS} from '../config';
import {RootTabParamList} from './types';

const Tab = createBottomTabNavigator<RootTabParamList>();

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: COLORS.background,
    card: COLORS.surface,
    text: COLORS.text,
    border: COLORS.border,
    primary: COLORS.primary,
  },
};

export function AppNavigator() {
  return (
    <NavigationContainer theme={theme}>
      <Tab.Navigator
        screenOptions={({route}) => ({
          headerShown: false,
          tabBarStyle: {
            backgroundColor: COLORS.surface,
            borderTopColor: COLORS.border,
            height: 64,
            paddingBottom: 8,
            paddingTop: 8,
          },
          tabBarActiveTintColor:
            route.name === 'Media' ? COLORS.primary : COLORS.face,
          tabBarInactiveTintColor: COLORS.textMuted,
          tabBarIcon: ({color, size}) => {
            const iconName =
              route.name === 'Media' ? 'play-circle' : 'scan-circle';
            return <Icon name={iconName} size={size} color={color} />;
          },
          tabBarLabelStyle: {fontWeight: '700', fontSize: 12},
        })}>
        <Tab.Screen
          name="Media"
          component={MediaNavigator}
          options={{title: 'Media Player'}}
        />
        <Tab.Screen
          name="Faces"
          component={FaceNavigator}
          options={{title: 'Face ID'}}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
