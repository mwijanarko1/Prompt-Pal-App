import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface StatCapsuleProps {
  icon: React.ReactNode;
  value: string | number;
  label?: string;
  color?: string;
}

export const StatCapsule = ({ icon, value, label, color = "#3C3C3C" }: StatCapsuleProps) => {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        {icon}
      </View>
      <Text style={[styles.valueText, { color }]}>{value}</Text>
      {label && <Text style={[styles.labelText, { color }]}>{label}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    marginHorizontal: 4,
    height: 40,
  },
  iconContainer: {
    marginRight: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueText: {
    fontSize: 16,
    fontWeight: '900',
    fontFamily: 'DIN Round Pro', // Assuming this font is available as seen in other screens
  },
  labelText: {
    fontSize: 12,
    fontWeight: '800',
    fontFamily: 'DIN Round Pro',
    marginLeft: 4,
    marginTop: 2,
  },
});
