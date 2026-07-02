import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {CameraScreen} from '../screens/camera/CameraScreen';
import {CapturesGalleryScreen} from '../screens/camera/CapturesGalleryScreen';
import {CaptureDetailScreen} from '../screens/camera/CaptureDetailScreen';
import {CameraStackParamList} from './types';

const Stack = createNativeStackNavigator<CameraStackParamList>();

export function CameraNavigator() {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name="CameraHome" component={CameraScreen} />
      <Stack.Screen name="CapturesGallery" component={CapturesGalleryScreen} />
      <Stack.Screen name="CaptureDetail" component={CaptureDetailScreen} />
    </Stack.Navigator>
  );
}
