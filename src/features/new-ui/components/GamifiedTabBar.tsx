import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Platform } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { QuestsIcon, RankIcon, CartIcon, ProfileIcon } from './CustomIcons';

const { width } = Dimensions.get('window');

export const GamifiedTabBar = ({ state, descriptors, navigation }: BottomTabBarProps) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 16) }]}>
      {/* Background with rounded top corners */}
      <View style={styles.backgroundBar} />
      
      <View style={styles.content}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const renderIcon = () => {
            const iconProps = { width: 28, height: 28, isActive: isFocused };
            switch (route.name) {
              case 'index': return <QuestsIcon {...iconProps} />;
              case 'ranking': return <RankIcon {...iconProps} />;
              case 'cart': return <CartIcon {...iconProps} />;
              case 'profile': return <ProfileIcon {...iconProps} />;
              default: return null;
            }
          };

          const getLabel = () => {
            switch (route.name) {
              case 'index': return 'Quests';
              case 'ranking': return 'Rank';
              case 'cart': return 'Cart';
              case 'profile': return 'Profile';
              default: return route.name;
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              style={styles.tabItem}
              activeOpacity={0.8}
            >
              {isFocused && <View style={styles.activeCircle} />}
              <View style={[styles.iconContainer, isFocused && styles.activeIconContainer]}>
                {renderIcon()}
              </View>
              <Text style={[styles.label, { color: isFocused ? '#58CC02' : '#8E8E93' }]}>
                {getLabel()}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: 'transparent',
  },
  backgroundBar: {
    position: 'absolute',
    top: 20,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 10,
  },
  content: {
    flexDirection: 'row',
    height: 80,
    alignItems: 'center',
    justifyContent: 'space-around',
    zIndex: 2,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeCircle: {
    position: 'absolute',
    top: -15,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 12,
  },
  iconContainer: {
    zIndex: 3,
    marginBottom: 4,
  },
  activeIconContainer: {
    marginTop: -30, // Elevated Look
    backgroundColor: '#FFFFFF',
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'DIN Round Pro',
    marginTop: 2,
  },
});
