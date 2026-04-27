import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import Svg, { Path } from 'react-native-svg';

const { width } = Dimensions.get('window');

export const ShareIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 28 28" fill="none">
    <Path 
      d="M14 2.33331V17.5M14 2.33331L18.6666 6.99998M14 2.33331L9.33329 6.99998M4.66663 14V23.3333C4.66663 23.9522 4.91246 24.5456 5.35004 24.9832C5.78763 25.4208 6.38112 25.6666 6.99996 25.6666H21C21.6188 25.6666 22.2123 25.4208 22.6499 24.9832C23.0875 24.5456 23.3333 23.9522 23.3333 23.3333V14" 
      stroke="#8E8E93" 
      strokeWidth={2.33333} 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    />
  </Svg>
);

const FreezeIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 2V22M12 2L9.5 4.5M12 2L14.5 4.5M12 22L9.5 19.5M12 22L14.5 19.5M3.34 7L20.66 17M3.34 7L6.76 7.92M3.34 7L4.26 10.42M20.66 17L17.24 16.08M20.66 17L19.74 13.58M20.66 7L3.34 17M20.66 7L17.24 7.92M20.66 7L19.74 10.42M3.34 17L6.76 16.08M3.34 17L4.26 13.58"
      stroke="#FFFFFF"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

type RankOverview = {
  currentStreak: number;
  perfectDays: number;
  protectedStreakDays: number;
  calendar: Array<{
    date: string;
    questsCompleted: number;
    perfectDay: boolean;
    streakProtected: boolean;
  }>;
} | undefined;

export const StreakView = ({ overview }: { overview?: RankOverview }) => {
  const today = new Date();
  const [displayMonth, setDisplayMonth] = useState(today.getMonth());
  const [displayYear, setDisplayYear] = useState(today.getFullYear());

  const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  const DAY_LABELS = ["Mo", "Tu", "We", "Th", "Fr", "Sat", "Su"];

  const getDaysInMonth = (month: number, year: number) =>
    new Date(year, month + 1, 0).getDate();

  const getFirstDayOfMonth = (month: number, year: number) => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1; // Mon-based (0=Mon, 6=Sun)
  };

  const daysInMonth = getDaysInMonth(displayMonth, displayYear);
  const firstDay = getFirstDayOfMonth(displayMonth, displayYear);

  const calendarCells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const handlePrevMonth = () => {
    if (displayMonth === 0) {
      setDisplayMonth(11);
      setDisplayYear((y) => y - 1);
    } else {
      setDisplayMonth((m) => m - 1);
    }
  };

  const activityByDay = new Map(
    (overview?.calendar ?? []).map((activity) => [
      Number(activity.date.slice(-2)),
      activity,
    ]),
  );

  const handleNextMonth = () => {
    if (displayMonth === 11) {
      setDisplayMonth(0);
      setDisplayYear((y) => y + 1);
    } else {
      setDisplayMonth((m) => m + 1);
    }
  };

  return (
    <ScrollView 
      showsVerticalScrollIndicator={false} 
      contentContainerStyle={styles.scrollContent}
    >
      {/* Green Banner Hero */}
      <View style={styles.greenBanner}>
        <View style={styles.bannerContent}>
          <View>
            <Text style={styles.giantNumber}>{overview?.currentStreak ?? 0}</Text>
            <Text style={styles.giantSub}>day streak!</Text>
          </View>
          <View style={styles.flameContainer}>
            <Image 
              source={require("../../../../assets/Group 17.png")} 
              style={styles.heroFlame} 
              contentFit="contain" 
            />
          </View>
        </View>
      </View>

      {/* Overlapping Info Card */}
      <View style={styles.infoCardContainer}>
        <View style={styles.infoCard}>
          <Image 
            source={require("../../../../assets/Group 17.png")} 
            style={styles.cardIcon} 
            contentFit="contain" 
          />
          <Text style={styles.infoCardText}>
            Keep your Perfect Streak by doing a lesson every day!
          </Text>
        </View>
      </View>

      {/* Month Selection */}
      <View style={styles.monthHeaderRow}>
        <Text style={styles.monthHeaderText}>{MONTH_NAMES[displayMonth]} {displayYear}</Text>
        <View style={styles.monthArrows}>
          <TouchableOpacity onPress={handlePrevMonth} style={styles.monthArrowBtn}>
            <Ionicons name="chevron-back" size={20} color="#8E8E93" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleNextMonth} style={styles.monthArrowBtn}>
            <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsCardsRow}>
        <View style={styles.statCard}>
          <View style={styles.perfectBadge}>
            <Text style={styles.perfectBadgeText}>PERFECT</Text>
          </View>
          <View style={styles.statValueRow}>
            <Image 
              source={require("../../../../assets/Group 17.png")} 
              style={styles.statIcon} 
              contentFit="contain" 
            />
            <Text style={styles.statValueText}>{overview?.perfectDays ?? 0}</Text>
          </View>
          <Text style={styles.statCardLabelText}>Days practiced</Text>
        </View>
        
        <View style={styles.statCard}>
          <View style={styles.statValueRow}>
            <View style={styles.freezeIconBg}>
              <FreezeIcon />
            </View>
            <Text style={styles.statValueText}>{overview?.protectedStreakDays ?? 0}</Text>
          </View>
          <Text style={styles.statCardLabelText}>Freezes used</Text>
        </View>
      </View>

      {/* Calendar Grid */}
      <View style={styles.calContainer}>
        <View style={styles.calDayLabelsRow}>
          {DAY_LABELS.map((d) => (
            <Text key={d} style={styles.calDayLabel}>{d}</Text>
          ))}
        </View>

        <View style={styles.calGrid}>
          {calendarCells.map((day, idx) => {
            const activity = day === null ? undefined : activityByDay.get(day);
            const isToday =
              day === today.getDate() &&
              displayMonth === today.getMonth() &&
              displayYear === today.getFullYear();
            const isHighlighted = !!activity?.perfectDay || !!activity?.streakProtected || (activity?.questsCompleted ?? 0) > 0;
            
            return (
              <View key={idx} style={styles.calCell}>
                {day !== null && (
                  <View
                    style={[
                      styles.calDay,
                      isToday && styles.calDayActive,
                      isHighlighted && styles.calDayHighlighted,
                    ]}
                  >
                    <Text
                      style={[
                        styles.calDayText,
                        isToday && styles.calDayTextActive,
                        isHighlighted && styles.calDayTextHighlighted,
                      ]}
                    >
                      {day}
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </View>
      
      <View style={{ height: 100 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    backgroundColor: '#FFFFFF',
  },
  greenBanner: {
    backgroundColor: '#58CC02',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 60,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  giantNumber: {
    fontSize: 80,
    fontWeight: '900',
    color: '#FFFFFF',
    fontFamily: 'DIN Round Pro',
    lineHeight: 88,
  },
  giantSub: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'DIN Round Pro',
    marginTop: -5,
  },
  flameContainer: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroFlame: {
    width: '100%',
    height: '100%',
  },
  infoCardContainer: {
    marginTop: -40,
    paddingHorizontal: 20,
    zIndex: 10,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 2,
    borderColor: '#F0F0F0',
  },
  cardIcon: {
    width: 24,
    height: 32,
    marginRight: 16,
  },
  infoCardText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#3C3C3C',
    fontFamily: 'DIN Round Pro',
    lineHeight: 22,
  },
  monthHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginTop: 32,
    marginBottom: 16,
  },
  monthHeaderText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#3C3C3C',
    fontFamily: 'DIN Round Pro',
  },
  monthArrows: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  monthArrowBtn: {
    padding: 8,
    marginLeft: 8,
  },
  statsCardsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E5E5',
    borderRadius: 16,
    padding: 16,
    alignItems: 'flex-start',
    position: 'relative',
  },
  perfectBadge: {
    position: 'absolute',
    top: -12,
    alignSelf: 'center',
    backgroundColor: '#58CC02',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    zIndex: 20,
  },
  perfectBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
    fontFamily: 'DIN Round Pro',
    letterSpacing: 0.5,
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statIcon: {
    width: 22,
    height: 30,
    marginRight: 8,
  },
  freezeIconBg: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#1CB0F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  statValueText: {
    fontSize: 26,
    fontWeight: '900',
    color: '#3C3C3C',
    fontFamily: 'DIN Round Pro',
  },
  statCardLabelText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#9CA3AF',
    fontFamily: 'DIN Round Pro',
  },
  calContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    marginHorizontal: 20,
    padding: 16,
    paddingBottom: 24,
  },
  calDayLabelsRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  calDayLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '800',
    color: '#A0A0A0',
    fontFamily: 'DIN Round Pro',
  },
  calGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calCell: {
    width: `${100 / 7}%` as any,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calDay: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calDayActive: {
    backgroundColor: '#58CC02',
  },
  calDayHighlighted: {
    borderWidth: 1.5,
    borderColor: '#58CC02',
    backgroundColor: '#F8FFF0',
  },
  calDayText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3C3C3C',
    fontFamily: 'DIN Round Pro',
  },
  calDayTextActive: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  calDayTextHighlighted: {
    color: '#58CC02',
    fontWeight: '900',
  },
});
