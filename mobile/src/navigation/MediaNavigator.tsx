import React from 'react';
import {createMaterialTopTabNavigator} from '@react-navigation/material-top-tabs';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SearchScreen} from '../screens/media/SearchScreen';
import {LibraryScreen} from '../screens/media/LibraryScreen';
import {PlayerScreen} from '../screens/media/PlayerScreen';
import {COLORS} from '../config';
import {MediaStackParamList} from './types';

const Stack = createNativeStackNavigator<MediaStackParamList>();
const TopTabs = createMaterialTopTabNavigator();

function MediaTabs() {
  return (
    <TopTabs.Navigator
      screenOptions={{
        tabBarStyle: {backgroundColor: COLORS.surface, elevation: 0},
        tabBarIndicatorStyle: {backgroundColor: COLORS.primary, height: 3, borderRadius: 2},
        tabBarActiveTintColor: COLORS.text,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle: {fontWeight: '700', fontSize: 13, textTransform: 'none'},
      }}>
      <TopTabs.Screen name="SearchTab" component={SearchScreen} options={{title: 'Search'}} />
      <TopTabs.Screen name="AudioTab" options={{title: 'Audio'}}>
        {() => <LibraryScreen type="AUDIO" />}
      </TopTabs.Screen>
      <TopTabs.Screen name="VideoTab" options={{title: 'Videos'}}>
        {() => <LibraryScreen type="VIDEO" />}
      </TopTabs.Screen>
    </TopTabs.Navigator>
  );
}

export function MediaNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {backgroundColor: COLORS.background},
        headerTintColor: COLORS.text,
        headerTitleStyle: {fontWeight: '700'},
        contentStyle: {backgroundColor: COLORS.background},
      }}>
      <Stack.Screen
        name="Search"
        component={MediaTabs}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="Player"
        component={PlayerScreen}
        options={{title: 'Now Playing'}}
      />
    </Stack.Navigator>
  );
}
