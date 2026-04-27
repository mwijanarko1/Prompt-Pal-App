import React from 'react';
import { ActivityIndicator, View, StyleSheet, ScrollView, TouchableOpacity, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatCapsule } from '@/features/new-ui/components/StatCapsule';
import { XpIcon } from '@/features/new-ui/components/CustomIcons';
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api.js";

const PERK_ICON_BY_TYPE: Record<string, { icon: string; color: string }> = {
  streak_freeze: { icon: "snow-outline", color: "#00C3FF" },
  extra_heart: { icon: "heart-outline", color: "#FF4B4B" },
  xp_boost: { icon: "flash-outline", color: "#FF9600" },
  skip_token: { icon: "arrow-redo-circle-outline", color: "#58CC02" },
};

export default function CartScreen() {
  const store = useQuery(api.questProduct.getStoreCatalog, {});
  const purchasePerk = useMutation(api.questProduct.purchasePerk);

  if (!store) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#58CC02" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.header} edges={['top']}>
        <View style={styles.topBar}>
          <Text style={styles.headerTitle}>Prompt Store</Text>
          
          <View style={styles.statsContainer}>
            <StatCapsule 
              icon={<XpIcon width={16} height={20} />} 
              value={`${store.walletXp || 0} XP`}
              color="#FF9600"
            />
          </View>
        </View>
      </SafeAreaView>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.banner}>
          <View style={styles.bannerTextContainer}>
            <Text style={styles.bannerTitle}>Power Up Your Learning</Text>
            <Text style={styles.bannerSubtitle}>Spend your XP on exclusive boosters and perks.</Text>
          </View>
          <View style={styles.bannerIcon}>
            <Ionicons name="gift" size={50} color="#FFFFFF" opacity={0.3} />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Available Perks</Text>

        {store.items.map((item) => {
          const icon = PERK_ICON_BY_TYPE[item.perkType] ?? { icon: "gift-outline", color: "#58CC02" };
          return (
          <TouchableOpacity
            key={item.id}
            style={[styles.itemCard, !item.canAfford && styles.itemCardDisabled]}
            onPress={() => purchasePerk({ perkId: item.slug })}
            disabled={!item.canAfford}
          >
            <View style={[styles.itemIconContainer, { backgroundColor: icon.color + '20' }]}>
              <Ionicons name={icon.icon as any} size={30} color={icon.color} />
            </View>
            <View style={styles.itemInfo}>
              <Text style={styles.itemTitle}>{item.name}</Text>
              <Text style={styles.itemDescription}>{item.description}</Text>
              {item.owned > 0 && <Text style={styles.ownedText}>Owned: {item.owned}</Text>}
            </View>
            <View style={styles.priceTag}>
              <XpIcon width={12} height={14} />
              <Text style={styles.priceText}>{item.costXp}</Text>
            </View>
          </TouchableOpacity>
        )})}

        <View style={styles.footer}>
          <Text style={styles.footerText}>More items coming soon!</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  header: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    zIndex: 10,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#3C3C3C',
    fontFamily: 'DIN Round Pro',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  banner: {
    backgroundColor: '#58CC02',
    borderRadius: 24,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: '#58CC02',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  bannerTextContainer: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 8,
    fontFamily: 'DIN Round Pro',
  },
  bannerSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    opacity: 0.9,
    fontFamily: 'DIN Round Pro',
  },
  bannerIcon: {
    marginLeft: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#3C3C3C',
    marginBottom: 20,
    fontFamily: 'DIN Round Pro',
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#F0F0F0',
    borderBottomWidth: 4, // 3D effect
  },
  itemCardDisabled: {
    opacity: 0.55,
  },
  itemIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#3C3C3C',
    marginBottom: 4,
    fontFamily: 'DIN Round Pro',
  },
  itemDescription: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    fontFamily: 'DIN Round Pro',
  },
  ownedText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#58CC02',
    marginTop: 4,
    fontFamily: 'DIN Round Pro',
  },
  priceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  priceText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#3C3C3C',
    marginLeft: 6,
    fontFamily: 'DIN Round Pro',
  },
  footer: {
    marginTop: 20,
    alignItems: 'center',
    paddingBottom: 40,
  },
  footerText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#8E8E93',
    fontFamily: 'DIN Round Pro',
  },
});
