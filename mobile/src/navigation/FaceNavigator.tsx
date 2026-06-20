import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {FaceHomeScreen} from '../screens/face/FaceHomeScreen';
import {RegisterFaceScreen} from '../screens/face/RegisterFaceScreen';
import {IdentifyFaceScreen} from '../screens/face/IdentifyFaceScreen';
import {PersonPhotosScreen} from '../screens/face/PersonPhotosScreen';
import {COLORS} from '../config';
import {FaceStackParamList} from './types';

const Stack = createNativeStackNavigator<FaceStackParamList>();

export function FaceNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {backgroundColor: COLORS.background},
        headerTintColor: COLORS.text,
        headerTitleStyle: {fontWeight: '700'},
        contentStyle: {backgroundColor: COLORS.background},
      }}>
      <Stack.Screen
        name="FaceHome"
        component={FaceHomeScreen}
        options={{title: 'Face Recognition'}}
      />
      <Stack.Screen
        name="RegisterFace"
        component={RegisterFaceScreen}
        options={{title: 'Register Face'}}
      />
      <Stack.Screen
        name="IdentifyFace"
        component={IdentifyFaceScreen}
        options={{title: 'Identify Person'}}
      />
      <Stack.Screen
        name="PersonPhotos"
        component={PersonPhotosScreen}
        options={({route}) => ({title: route.params.personName})}
      />
    </Stack.Navigator>
  );
}
