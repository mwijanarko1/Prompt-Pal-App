
import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path } from 'react-native-svg';

const { width } = Dimensions.get('window');

export const TabBarBackground = () => {
    // Generate a path that has a bump on the left side (for 4 tabs, bump at x ≈ width / 8)
    const tabWidth = width / 4;
    const centerOfBump = tabWidth / 2;
    // ...
    return <View/>
}
