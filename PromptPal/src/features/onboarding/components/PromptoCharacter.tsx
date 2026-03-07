import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withSequence,
    withSpring,
    Easing,
    withDelay,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

export type PromptoState =
    | 'idle'
    | 'speaking'
    | 'excited'
    | 'thinking'
    | 'celebrating'
    | 'waving'
    | 'pointing';

interface PromptoCharacterProps {
    state?: PromptoState;
    size?: 'sm' | 'md' | 'lg';
    message?: string;
}

const SIZES = {
    sm: { container: 80, face: 60, eye: 8, mouth: 10, iconSize: 16 },
    md: { container: 120, face: 90, eye: 10, mouth: 14, iconSize: 20 },
    lg: { container: 160, face: 120, eye: 14, mouth: 18, iconSize: 28 },
};

export function PromptoCharacter({
    state = 'idle',
    size = 'md',
    message,
}: PromptoCharacterProps) {
    const s = SIZES[size];

    // Animation shared values
    const bobY = useSharedValue(0);
    const scaleX = useSharedValue(1);
    const scaleY = useSharedValue(1);
    const rotation = useSharedValue(0);
    const eyeScale = useSharedValue(1);
    const mouthScale = useSharedValue(1);
    const glowOpacity = useSharedValue(0.3);
    const sparkleOpacity = useSharedValue(0);

    // Idle bobbing animation
    useEffect(() => {
        bobY.value = withRepeat(
            withSequence(
                withTiming(-6, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
                withTiming(6, { duration: 1200, easing: Easing.inOut(Easing.ease) })
            ),
            -1,
            true
        );

        glowOpacity.value = withRepeat(
            withSequence(
                withTiming(0.6, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
                withTiming(0.2, { duration: 1500, easing: Easing.inOut(Easing.ease) })
            ),
            -1,
            true
        );
    }, []);

    // State-specific animations
    useEffect(() => {
        switch (state) {
            case 'excited':
            case 'celebrating':
                scaleX.value = withRepeat(
                    withSequence(
                        withSpring(1.15, { damping: 4, stiffness: 200 }),
                        withSpring(1, { damping: 4, stiffness: 200 })
                    ),
                    3,
                    true
                );
                scaleY.value = withRepeat(
                    withSequence(
                        withSpring(0.9, { damping: 4, stiffness: 200 }),
                        withSpring(1, { damping: 4, stiffness: 200 })
                    ),
                    3,
                    true
                );
                sparkleOpacity.value = withRepeat(
                    withSequence(
                        withTiming(1, { duration: 300 }),
                        withTiming(0, { duration: 300 })
                    ),
                    5,
                    true
                );
                rotation.value = withSequence(
                    withTiming(-5, { duration: 100 }),
                    withRepeat(
                        withSequence(
                            withTiming(5, { duration: 150 }),
                            withTiming(-5, { duration: 150 })
                        ),
                        4,
                        true
                    ),
                    withTiming(0, { duration: 100 })
                );
                break;

            case 'thinking':
                rotation.value = withRepeat(
                    withSequence(
                        withTiming(8, { duration: 800, easing: Easing.inOut(Easing.ease) }),
                        withTiming(-8, { duration: 800, easing: Easing.inOut(Easing.ease) })
                    ),
                    -1,
                    true
                );
                eyeScale.value = withRepeat(
                    withSequence(
                        withTiming(0.6, { duration: 400 }),
                        withDelay(600, withTiming(1, { duration: 300 }))
                    ),
                    -1,
                    false
                );
                break;

            case 'speaking':
                mouthScale.value = withRepeat(
                    withSequence(
                        withTiming(1.3, { duration: 200 }),
                        withTiming(0.8, { duration: 200 })
                    ),
                    -1,
                    true
                );
                break;

            case 'waving':
                rotation.value = withRepeat(
                    withSequence(
                        withTiming(15, { duration: 300 }),
                        withTiming(-15, { duration: 300 })
                    ),
                    3,
                    true
                );
                break;

            case 'pointing':
                rotation.value = withSequence(
                    withTiming(-5, { duration: 200 }),
                    withTiming(0, { duration: 200 })
                );
                break;

            default:
                scaleX.value = withTiming(1, { duration: 300 });
                scaleY.value = withTiming(1, { duration: 300 });
                rotation.value = withTiming(0, { duration: 300 });
                eyeScale.value = withTiming(1, { duration: 300 });
                mouthScale.value = withTiming(1, { duration: 300 });
                sparkleOpacity.value = withTiming(0, { duration: 300 });
                break;
        }
    }, [state]);

    // Animated styles
    const bodyStyle = useAnimatedStyle(() => ({
        transform: [
            { translateY: bobY.value },
            { scaleX: scaleX.value },
            { scaleY: scaleY.value },
            { rotate: `${rotation.value}deg` },
        ],
    }));

    const eyeAnimStyle = useAnimatedStyle(() => ({
        transform: [{ scaleY: eyeScale.value }],
    }));

    const mouthAnimStyle = useAnimatedStyle(() => ({
        transform: [{ scaleY: mouthScale.value }],
    }));

    const glowStyle = useAnimatedStyle(() => ({
        opacity: glowOpacity.value,
    }));

    const sparkleStyle = useAnimatedStyle(() => ({
        opacity: sparkleOpacity.value,
    }));

    const getMouthExpression = () => {
        switch (state) {
            case 'excited':
            case 'celebrating':
                return '◡';
            case 'thinking':
                return '~';
            case 'speaking':
                return 'O';
            default:
                return '‿';
        }
    };

    const getAccessoryIcon = (): keyof typeof Ionicons.glyphMap | null => {
        switch (state) {
            case 'thinking':
                return 'bulb-outline';
            case 'celebrating':
                return 'trophy-outline';
            case 'pointing':
                return 'hand-right-outline';
            default:
                return null;
        }
    };

    const accessoryIcon = getAccessoryIcon();

    return (
        <View style={[localStyles.wrapper, { width: s.container + 40, height: s.container + 60 }]}>
            {/* Glow effect */}
            <Animated.View
                style={[
                    localStyles.glow,
                    {
                        width: s.container + 20,
                        height: s.container + 20,
                        borderRadius: (s.container + 20) / 2,
                    },
                    glowStyle,
                ]}
            />

            {/* Sparkles (for celebrating state) */}
            <Animated.View style={[localStyles.sparkleContainer, sparkleStyle]}>
                <Ionicons name="star" size={12} color="#F59E0B" style={[localStyles.sparkle, { top: -10, left: 0 }]} />
                <Ionicons name="sparkles" size={12} color="#BB86FC" style={[localStyles.sparkle, { top: 5, right: -5 }]} />
                <Ionicons name="star" size={12} color="#03DAC6" style={[localStyles.sparkle, { bottom: 10, left: -8 }]} />
                <Ionicons name="sparkles" size={12} color="#F59E0B" style={[localStyles.sparkle, { bottom: 0, right: 0 }]} />
            </Animated.View>

            {/* Main body */}
            <Animated.View style={[bodyStyle]}>
                <View
                    style={[
                        localStyles.body,
                        {
                            width: s.face,
                            height: s.face,
                            borderRadius: s.face * 0.38,
                        },
                    ]}
                >
                    {/* Antenna */}
                    <View style={[localStyles.antenna, { top: -s.face * 0.16 }]}>
                        <View style={localStyles.antennaStalk} />
                        <View style={localStyles.antennaBall} />
                    </View>

                    {/* Face */}
                    <View style={localStyles.faceContainer}>
                        {/* Eyes */}
                        <View style={localStyles.eyeRow}>
                            <Animated.View
                                style={[
                                    localStyles.eye,
                                    { width: s.eye, height: s.eye, borderRadius: s.eye / 2 },
                                    eyeAnimStyle,
                                ]}
                            />
                            <Animated.View
                                style={[
                                    localStyles.eye,
                                    { width: s.eye, height: s.eye, borderRadius: s.eye / 2 },
                                    eyeAnimStyle,
                                ]}
                            />
                        </View>

                        {/* Mouth */}
                        <Animated.View style={mouthAnimStyle}>
                            <Text
                                style={[
                                    localStyles.mouth,
                                    { fontSize: s.mouth },
                                ]}
                            >
                                {getMouthExpression()}
                            </Text>
                        </Animated.View>
                    </View>

                    {/* Cheek blush */}
                    {(state === 'excited' || state === 'celebrating') && (
                        <>
                            <View style={[localStyles.cheek, localStyles.cheekLeft]} />
                            <View style={[localStyles.cheek, localStyles.cheekRight]} />
                        </>
                    )}
                </View>

                {/* Accessory icon */}
                {accessoryIcon && (
                    <View style={localStyles.accessory}>
                        <Ionicons name={accessoryIcon} size={s.iconSize} color="#F59E0B" />
                    </View>
                )}
            </Animated.View>

            {/* Speech bubble */}
            {message && (
                <Animated.View style={localStyles.speechBubble}>
                    <View style={localStyles.speechTail} />
                    <Text style={localStyles.speechText}>{message}</Text>
                </Animated.View>
            )}
        </View>
    );
}

const localStyles = StyleSheet.create({
    wrapper: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    glow: {
        position: 'absolute',
        backgroundColor: '#BB86FC',
    },
    sparkleContainer: {
        position: 'absolute',
        width: '100%',
        height: '100%',
    },
    sparkle: {
        position: 'absolute',
    },
    body: {
        backgroundColor: '#BB86FC',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#BB86FC',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
    },
    antenna: {
        position: 'absolute',
        alignItems: 'center',
    },
    antennaStalk: {
        width: 3,
        height: 12,
        backgroundColor: '#03DAC6',
        borderRadius: 1.5,
    },
    antennaBall: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#03DAC6',
        position: 'absolute',
        top: -6,
        shadowColor: '#03DAC6',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 6,
    },
    faceContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    eyeRow: {
        flexDirection: 'row',
        gap: 16,
    },
    eye: {
        backgroundColor: '#FFFFFF',
        shadowColor: '#FFFFFF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 4,
    },
    mouth: {
        color: '#FFFFFF',
        textAlign: 'center',
        fontWeight: '700',
    },
    cheek: {
        width: 10,
        height: 6,
        borderRadius: 5,
        backgroundColor: '#FF6B8A',
        opacity: 0.5,
        position: 'absolute',
        bottom: '30%',
    },
    cheekLeft: {
        left: '12%',
    },
    cheekRight: {
        right: '12%',
    },
    accessory: {
        position: 'absolute',
        top: -8,
        right: -20,
    },
    speechBubble: {
        backgroundColor: '#2A2A2A',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 10,
        marginTop: 8,
        maxWidth: 220,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    speechTail: {
        position: 'absolute',
        top: -6,
        left: '50%',
        marginLeft: -6,
        width: 12,
        height: 12,
        backgroundColor: '#2A2A2A',
        transform: [{ rotate: '45deg' }],
        borderTopWidth: 1,
        borderLeftWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    speechText: {
        color: '#E0E0E0',
        fontSize: 13,
        lineHeight: 18,
        textAlign: 'center',
        fontWeight: '500',
    },
});
