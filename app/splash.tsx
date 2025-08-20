// app/splash.tsx
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, Dimensions, Image, StyleSheet, Text, View } from 'react-native';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
  const router = useRouter();
  
  // Animation values
  const logoScale = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(30)).current;
  const backgroundScale = useRef(new Animated.Value(0.8)).current;
  const shimmerOpacity = useRef(new Animated.Value(0)).current;
  const pulseScale = useRef(new Animated.Value(1)).current;
  const sparkleOpacity = useRef(new Animated.Value(0)).current;
  const sparkleRotation = useRef(new Animated.Value(0)).current;
  const loadingDots = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  useEffect(() => {
    // Start background animations
    const animateIn = () => {
      // Background pulse animation
      Animated.timing(backgroundScale, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }).start();

      // Start pulse animation
      const startPulse = () => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseScale, {
              toValue: 1.1,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(pulseScale, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
          ])
        ).start();
      };

      // Start loading dots animation
      const animateLoadingDots = () => {
        const createDotAnimation = (dot: Animated.Value, delay: number) => {
          return Animated.loop(
            Animated.sequence([
              Animated.timing(dot, {
                toValue: 1,
                duration: 400,
                delay,
                useNativeDriver: true,
              }),
              Animated.timing(dot, {
                toValue: 0.3,
                duration: 400,
                useNativeDriver: true,
              }),
            ])
          );
        };

        Animated.stagger(200, [
          createDotAnimation(loadingDots[0], 0),
          createDotAnimation(loadingDots[1], 0),
          createDotAnimation(loadingDots[2], 0),
        ]).start();
      };

      // Logo animation - enhanced with bounce effect
      Animated.sequence([
        Animated.parallel([
          Animated.timing(logoScale, {
            toValue: 1.1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(logoOpacity, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(logoScale, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        startPulse();
      });

      // Shimmer effect on logo
      setTimeout(() => {
        Animated.sequence([
          Animated.timing(shimmerOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(shimmerOpacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      }, 800);

      // Text animation - enhanced with spring effect
      setTimeout(() => {
        Animated.parallel([
          Animated.spring(textOpacity, {
            toValue: 1,
            tension: 100,
            friction: 8,
            useNativeDriver: true,
          }),
          Animated.spring(textTranslateY, {
            toValue: 0,
            tension: 100,
            friction: 8,
            useNativeDriver: true,
          }),
        ]).start(() => {
          // Start sparkle animations
          Animated.parallel([
            Animated.timing(sparkleOpacity, {
              toValue: 1,
              duration: 500,
              useNativeDriver: true,
            }),
            Animated.loop(
              Animated.timing(sparkleRotation, {
                toValue: 1,
                duration: 3000,
                useNativeDriver: true,
              })
            ),
          ]).start();
          
          // Start loading animation
          setTimeout(animateLoadingDots, 200);
        });
      }, 400);
    };

    // Start animation after a small delay
    setTimeout(animateIn, 300);

    // Navigate to next screen with exit animation
    const timeout = setTimeout(() => {
      // Exit animation - Instagram/TikTok style zoom out to center
      Animated.parallel([
        Animated.timing(logoScale, {
          toValue: 0,           // Scale down to nothing
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 0,           // Fade out quickly
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(textOpacity, {
          toValue: 0,           // Fade out text
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(backgroundScale, {
          toValue: 0,           // Scale down background elements too
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        router.replace('/get-started');
      });
    }, 5000);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <View style={styles.container}>
      {/* Animated background circles */}
      <Animated.View 
        style={[
          styles.backgroundCircle1,
          {
            transform: [{ scale: backgroundScale }],
          }
        ]}
      />
      <Animated.View 
        style={[
          styles.backgroundCircle2,
          {
            transform: [
              { scale: backgroundScale },
              { rotate: sparkleRotation.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', '360deg'],
              }) },
            ],
          }
        ]}
      />

      {/* Animated gradient overlay */}
      <Animated.View 
        style={[
          styles.gradientOverlay,
          {
            opacity: backgroundScale.interpolate({
              inputRange: [0.8, 1],
              outputRange: [0, 0.3],
              extrapolate: 'clamp',
            }),
          }
        ]}
      />

      <View style={styles.logoContainer}>
        <Animated.View 
          style={[
            styles.logoCircle,
            {
              transform: [{ scale: logoScale }],
              opacity: logoOpacity,
            }
          ]}
        >
          <Image source={require('@/assets/images/logo.png')} style={styles.logo} />
          
          {/* Shimmer effect overlay */}
          <Animated.View 
            style={[
              styles.shimmerOverlay,
              {
                opacity: shimmerOpacity,
              }
            ]}
          />
          
          {/* Pulse effect around logo */}
          <Animated.View 
            style={[
              styles.pulseRing,
              {
                transform: [{ scale: pulseScale }],
                opacity: pulseScale.interpolate({
                  inputRange: [1, 1.1],
                  outputRange: [0.3, 0],
                  extrapolate: 'clamp',
                }),
              }
            ]}
          />
        </Animated.View>
        
        <Animated.View 
          style={[
            styles.textContainer,
            {
              opacity: textOpacity,
              transform: [{ translateY: textTranslateY }],
            }
          ]}
        >
          <Text style={styles.appName}>FairTrade</Text>
          <Text style={styles.trademark}>®</Text>
          
          {/* Sparkle elements around text */}
          <Animated.View 
            style={[
              styles.sparkle1,
              {
                opacity: sparkleOpacity,
                transform: [{
                  rotate: sparkleRotation.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg'],
                  }),
                }],
              }
            ]}
          />
          <Animated.View 
            style={[
              styles.sparkle2,
              {
                opacity: sparkleOpacity,
                transform: [{
                  rotate: sparkleRotation.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['360deg', '0deg'],
                  }),
                }],
              }
            ]}
          />
          <Animated.View 
            style={[
              styles.sparkle3,
              {
                opacity: sparkleOpacity,
                transform: [{
                  scale: sparkleRotation.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [1, 1.2, 1],
                  }),
                }],
              }
            ]}
          />
        </Animated.View>
      </View>

      {/* Loading dots */}
      <Animated.View 
        style={[
          styles.loadingContainer,
          {
            opacity: textOpacity,
          }
        ]}
      >
        <View style={styles.loadingDots}>
          {loadingDots.map((dot, index) => (
            <Animated.View
              key={index}
              style={[
                styles.loadingDot,
                {
                  opacity: dot,
                  transform: [{
                    scale: dot.interpolate({
                      inputRange: [0.3, 1],
                      outputRange: [0.8, 1.2],
                      extrapolate: 'clamp',
                    }),
                  }],
                }
              ]}
            />
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#4B56E9',
  },
  backgroundCircle1: {
    position: 'absolute',
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: (width * 0.8) / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    top: height * 0.1,
    left: -width * 0.2,
  },
  backgroundCircle2: {
    position: 'absolute',
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: (width * 0.6) / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    bottom: height * 0.1,
    right: -width * 0.1,
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(75, 86, 233, 0.4)',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  logoCircle: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: '#DADBFB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  logo: {
    width: 65,
    height: 65,
    resizeMode: 'contain',
    zIndex: 2,
  },
  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 20,
    zIndex: 3,
  },
  pulseRing: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    zIndex: 1,
  },
  textContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    position: 'relative',
  },
  appName: {
    fontSize: 42,
    color: '#ffffff',
    fontWeight: '600',
    letterSpacing: -0.5,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  trademark: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '400',
    marginTop: 2,
    marginLeft: 2,
    opacity: 0.9,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  sparkle1: {
    position: 'absolute',
    width: 8,
    height: 8,
    backgroundColor: '#ffffff',
    borderRadius: 4,
    top: -10,
    left: -20,
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 5,
  },
  sparkle2: {
    position: 'absolute',
    width: 6,
    height: 6,
    backgroundColor: '#ffffff',
    borderRadius: 3,
    top: 10,
    right: -25,
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 3,
    elevation: 5,
  },
  sparkle3: {
    position: 'absolute',
    width: 4,
    height: 4,
    backgroundColor: '#ffffff',
    borderRadius: 2,
    top: -5,
    right: 10,
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 5,
  },
  loadingContainer: {
    position: 'absolute',
    bottom: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ffffff',
    marginHorizontal: 4,
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 3,
    elevation: 3,
  },
});