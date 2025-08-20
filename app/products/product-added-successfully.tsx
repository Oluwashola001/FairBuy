// app/product-success.tsx
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import {
  Animated,
  Dimensions,
  Image,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

const { width, height } = Dimensions.get('window');

export default function ProductSuccessScreen() {
  const { theme, isDark } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Get product details from navigation params
  const productData = params.productData ? JSON.parse(params.productData) : null;

  const scaleValue = new Animated.Value(0);
  const fadeValue = new Animated.Value(0);
  const checkmarkScale = new Animated.Value(0);
  const checkmarkRotation = new Animated.Value(0);
  
  // Balloon animations - 12 balloons with different behaviors
  const balloon1Y = new Animated.Value(-80);
  const balloon2Y = new Animated.Value(-120);
  const balloon3Y = new Animated.Value(-60);
  const balloon4Y = new Animated.Value(-100);
  const balloon5Y = new Animated.Value(-140);
  const balloon6Y = new Animated.Value(-70);
  const balloon7Y = new Animated.Value(-110);
  const balloon8Y = new Animated.Value(-90);
  const balloon9Y = new Animated.Value(-130);
  const balloon10Y = new Animated.Value(-50);
  const balloon11Y = new Animated.Value(-160);
  const balloon12Y = new Animated.Value(-75);
  
  // Balloon swing animations (left-right movement)
  const balloon1X = new Animated.Value(0);
  const balloon2X = new Animated.Value(0);
  const balloon3X = new Animated.Value(0);
  const balloon4X = new Animated.Value(0);
  const balloon5X = new Animated.Value(0);
  const balloon6X = new Animated.Value(0);
  const balloon7X = new Animated.Value(0);
  const balloon8X = new Animated.Value(0);
  const balloon9X = new Animated.Value(0);
  const balloon10X = new Animated.Value(0);
  const balloon11X = new Animated.Value(0);
  const balloon12X = new Animated.Value(0);

  React.useEffect(() => {
    // Success animation
    Animated.parallel([
      Animated.spring(scaleValue, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(fadeValue, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Checkmark animation - scale up with slight rotation
    Animated.sequence([
      Animated.delay(200),
      Animated.parallel([
        Animated.spring(checkmarkScale, {
          toValue: 1.2,
          tension: 100,
          friction: 3,
          useNativeDriver: true,
        }),
        Animated.timing(checkmarkRotation, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
      Animated.spring(checkmarkScale, {
        toValue: 1,
        tension: 80,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();

    // Dropping balloons with swinging motion
    const animateBalloons = () => {
      // Vertical dropping animations
      const dropAnimations = [
        Animated.loop(
          Animated.timing(balloon1Y, {
            toValue: height + 100,
            duration: 6000,
            useNativeDriver: true,
          })
        ),
        Animated.loop(
          Animated.timing(balloon2Y, {
            toValue: height + 100,
            duration: 7000,
            useNativeDriver: true,
          })
        ),
        Animated.loop(
          Animated.timing(balloon3Y, {
            toValue: height + 100,
            duration: 5500,
            useNativeDriver: true,
          })
        ),
        Animated.loop(
          Animated.timing(balloon4Y, {
            toValue: height + 100,
            duration: 6500,
            useNativeDriver: true,
          })
        ),
        Animated.loop(
          Animated.timing(balloon5Y, {
            toValue: height + 100,
            duration: 8000,
            useNativeDriver: true,
          })
        ),
        Animated.loop(
          Animated.timing(balloon6Y, {
            toValue: height + 100,
            duration: 5800,
            useNativeDriver: true,
          })
        ),
        Animated.loop(
          Animated.timing(balloon7Y, {
            toValue: height + 100,
            duration: 7200,
            useNativeDriver: true,
          })
        ),
        Animated.loop(
          Animated.timing(balloon8Y, {
            toValue: height + 100,
            duration: 6200,
            useNativeDriver: true,
          })
        ),
        Animated.loop(
          Animated.timing(balloon9Y, {
            toValue: height + 100,
            duration: 7800,
            useNativeDriver: true,
          })
        ),
        Animated.loop(
          Animated.timing(balloon10Y, {
            toValue: height + 100,
            duration: 5300,
            useNativeDriver: true,
          })
        ),
        Animated.loop(
          Animated.timing(balloon11Y, {
            toValue: height + 100,
            duration: 6800,
            useNativeDriver: true,
          })
        ),
        Animated.loop(
          Animated.timing(balloon12Y, {
            toValue: height + 100,
            duration: 6100,
            useNativeDriver: true,
          })
        ),
      ];

      // Horizontal swinging animations
      const swingAnimations = [
        Animated.loop(
          Animated.sequence([
            Animated.timing(balloon1X, {
              toValue: 20,
              duration: 2000,
              useNativeDriver: true,
            }),
            Animated.timing(balloon1X, {
              toValue: -20,
              duration: 2000,
              useNativeDriver: true,
            }),
          ])
        ),
        Animated.loop(
          Animated.sequence([
            Animated.timing(balloon2X, {
              toValue: -15,
              duration: 2500,
              useNativeDriver: true,
            }),
            Animated.timing(balloon2X, {
              toValue: 15,
              duration: 2500,
              useNativeDriver: true,
            }),
          ])
        ),
        Animated.loop(
          Animated.sequence([
            Animated.timing(balloon3X, {
              toValue: 25,
              duration: 1800,
              useNativeDriver: true,
            }),
            Animated.timing(balloon3X, {
              toValue: -25,
              duration: 1800,
              useNativeDriver: true,
            }),
          ])
        ),
        Animated.loop(
          Animated.sequence([
            Animated.timing(balloon4X, {
              toValue: -18,
              duration: 2200,
              useNativeDriver: true,
            }),
            Animated.timing(balloon4X, {
              toValue: 18,
              duration: 2200,
              useNativeDriver: true,
            }),
          ])
        ),
        Animated.loop(
          Animated.sequence([
            Animated.timing(balloon5X, {
              toValue: 12,
              duration: 2800,
              useNativeDriver: true,
            }),
            Animated.timing(balloon5X, {
              toValue: -12,
              duration: 2800,
              useNativeDriver: true,
            }),
          ])
        ),
        Animated.loop(
          Animated.sequence([
            Animated.timing(balloon6X, {
              toValue: -22,
              duration: 1900,
              useNativeDriver: true,
            }),
            Animated.timing(balloon6X, {
              toValue: 22,
              duration: 1900,
              useNativeDriver: true,
            }),
          ])
        ),
        Animated.loop(
          Animated.sequence([
            Animated.timing(balloon7X, {
              toValue: 16,
              duration: 2400,
              useNativeDriver: true,
            }),
            Animated.timing(balloon7X, {
              toValue: -16,
              duration: 2400,
              useNativeDriver: true,
            }),
          ])
        ),
        Animated.loop(
          Animated.sequence([
            Animated.timing(balloon8X, {
              toValue: -14,
              duration: 2100,
              useNativeDriver: true,
            }),
            Animated.timing(balloon8X, {
              toValue: 14,
              duration: 2100,
              useNativeDriver: true,
            }),
          ])
        ),
        Animated.loop(
          Animated.sequence([
            Animated.timing(balloon9X, {
              toValue: 19,
              duration: 2600,
              useNativeDriver: true,
            }),
            Animated.timing(balloon9X, {
              toValue: -19,
              duration: 2600,
              useNativeDriver: true,
            }),
          ])
        ),
        Animated.loop(
          Animated.sequence([
            Animated.timing(balloon10X, {
              toValue: -21,
              duration: 1700,
              useNativeDriver: true,
            }),
            Animated.timing(balloon10X, {
              toValue: 21,
              duration: 1700,
              useNativeDriver: true,
            }),
          ])
        ),
        Animated.loop(
          Animated.sequence([
            Animated.timing(balloon11X, {
              toValue: 13,
              duration: 2700,
              useNativeDriver: true,
            }),
            Animated.timing(balloon11X, {
              toValue: -13,
              duration: 2700,
              useNativeDriver: true,
            }),
          ])
        ),
        Animated.loop(
          Animated.sequence([
            Animated.timing(balloon12X, {
              toValue: -17,
              duration: 2300,
              useNativeDriver: true,
            }),
            Animated.timing(balloon12X, {
              toValue: 17,
              duration: 2300,
              useNativeDriver: true,
            }),
          ])
        ),
      ];

      Animated.parallel([...dropAnimations, ...swingAnimations]).start();
    };

    // Start balloon animation after a short delay
    setTimeout(animateBalloons, 500);
  }, []);

  const handleGoHome = () => {
    router.push('/(seller)/dashboard');
  };

  const handleAddAnother = () => {
    router.back();
  };

  const styles = createStyles(theme);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style={isDark ? "light" : "dark"} />
      
      {/* Animated Dropping Balloons */}
      <Animated.View style={[
        styles.balloon, 
        styles.balloon1, 
        { 
          transform: [
            { translateY: balloon1Y },
            { translateX: balloon1X }
          ] 
        }
      ]}>
        <View style={styles.balloonBody1} />
        <View style={styles.balloonString} />
      </Animated.View>

      <Animated.View style={[
        styles.balloon, 
        styles.balloon2, 
        { 
          transform: [
            { translateY: balloon2Y },
            { translateX: balloon2X }
          ] 
        }
      ]}>
        <View style={styles.balloonBody2} />
        <View style={styles.balloonString} />
      </Animated.View>

      <Animated.View style={[
        styles.balloon, 
        styles.balloon3, 
        { 
          transform: [
            { translateY: balloon3Y },
            { translateX: balloon3X }
          ] 
        }
      ]}>
        <View style={styles.balloonBody3} />
        <View style={styles.balloonString} />
      </Animated.View>

      <Animated.View style={[
        styles.balloon, 
        styles.balloon4, 
        { 
          transform: [
            { translateY: balloon4Y },
            { translateX: balloon4X }
          ] 
        }
      ]}>
        <View style={styles.balloonBody4} />
        <View style={styles.balloonString} />
      </Animated.View>

      <Animated.View style={[
        styles.balloon, 
        styles.balloon5, 
        { 
          transform: [
            { translateY: balloon5Y },
            { translateX: balloon5X }
          ] 
        }
      ]}>
        <View style={styles.balloonBody5} />
        <View style={styles.balloonString} />
      </Animated.View>

      <Animated.View style={[
        styles.balloon, 
        styles.balloon6, 
        { 
          transform: [
            { translateY: balloon6Y },
            { translateX: balloon6X }
          ] 
        }
      ]}>
        <View style={styles.balloonBody6} />
        <View style={styles.balloonString} />
      </Animated.View>

      <Animated.View style={[
        styles.balloon, 
        styles.balloon7, 
        { 
          transform: [
            { translateY: balloon7Y },
            { translateX: balloon7X }
          ] 
        }
      ]}>
        <View style={styles.balloonBody7} />
        <View style={styles.balloonString} />
      </Animated.View>

      <Animated.View style={[
        styles.balloon, 
        styles.balloon8, 
        { 
          transform: [
            { translateY: balloon8Y },
            { translateX: balloon8X }
          ] 
        }
      ]}>
        <View style={styles.balloonBody8} />
        <View style={styles.balloonString} />
      </Animated.View>

      <Animated.View style={[
        styles.balloon, 
        styles.balloon9, 
        { 
          transform: [
            { translateY: balloon9Y },
            { translateX: balloon9X }
          ] 
        }
      ]}>
        <View style={styles.balloonBody9} />
        <View style={styles.balloonString} />
      </Animated.View>

      <Animated.View style={[
        styles.balloon, 
        styles.balloon10, 
        { 
          transform: [
            { translateY: balloon10Y },
            { translateX: balloon10X }
          ] 
        }
      ]}>
        <View style={styles.balloonBody10} />
        <View style={styles.balloonString} />
      </Animated.View>

      <Animated.View style={[
        styles.balloon, 
        styles.balloon11, 
        { 
          transform: [
            { translateY: balloon11Y },
            { translateX: balloon11X }
          ] 
        }
      ]}>
        <View style={styles.balloonBody11} />
        <View style={styles.balloonString} />
      </Animated.View>

      <Animated.View style={[
        styles.balloon, 
        styles.balloon12, 
        { 
          transform: [
            { translateY: balloon12Y },
            { translateX: balloon12X }
          ] 
        }
      ]}>
        <View style={styles.balloonBody12} />
        <View style={styles.balloonString} />
      </Animated.View>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.closeButton}
          onPress={() => router.push('/(tabs)/home')}
        >
          <Ionicons name="close" size={24} color={theme.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Success Animation */}
      <Animated.View 
        style={[
          styles.successContainer,
          {
            transform: [{ scale: scaleValue }],
            opacity: fadeValue,
          }
        ]}
      >        
        <Animated.View 
          style={[
            styles.successIcon,
            {
              transform: [
                { scale: checkmarkScale },
                { 
                  rotate: checkmarkRotation.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '10deg'],
                  })
                }
              ]
            }
          ]}
        >
          <Ionicons name="checkmark-circle" size={80} color="#00C851" />
        </Animated.View>
        
        <Text style={styles.successTitle}>Product Added Successfully!</Text>
        <Text style={styles.successSubtitle}>
          Your product is now live and available to buyers
        </Text>
      </Animated.View>

      {/* Product Preview */}
      {productData && (
        <Animated.View style={[styles.productPreview, { opacity: fadeValue }]}>
          <View style={styles.previewCard}>
            {productData.image ? (
              <Image source={{ uri: productData.image }} style={styles.previewImage} />
            ) : (
              <View style={styles.placeholderImage}>
                <Ionicons name="image-outline" size={40} color={theme.textTertiary} />
              </View>
            )}
            
            <View style={styles.previewDetails}>
              <Text style={styles.previewName} numberOfLines={2}>
                {productData.name}
              </Text>
              <Text style={styles.previewPrice}>${productData.price}</Text>
              <Text style={styles.previewCategory}>{productData.category}</Text>
            </View>
          </View>
        </Animated.View>
      )}

      {/* Action Buttons */}
      <Animated.View style={[styles.actionContainer, { opacity: fadeValue }]}>
        <TouchableOpacity 
          style={styles.primaryButton}
          onPress={handleGoHome}
          activeOpacity={0.8}
        >
          <Ionicons name="home-outline" size={20} color="#fff" />
          <Text style={styles.primaryButtonText}>Go to Home</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.secondaryButton}
          onPress={handleAddAnother}
          activeOpacity={0.8}
        >
          <Ionicons name="add-outline" size={20} color="#4B56E9" />
          <Text style={styles.secondaryButtonText}>Add Another Product</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Stats */}
      <Animated.View style={[styles.statsContainer, { opacity: fadeValue }]}>
        <View style={styles.statItem}>
          <Ionicons name="eye-outline" size={16} color={theme.textSecondary} />
          <Text style={styles.statText}>Visible to all buyers</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="time-outline" size={16} color={theme.textSecondary} />
          <Text style={styles.statText}>Live immediately</Text>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const createStyles = (theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  successContainer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 30,
    zIndex: 2,
  },
  successIcon: {
    marginBottom: 20,
  },
  // Balloon Styles
  balloon: {
    position: 'absolute',
    alignItems: 'center',
    opacity: 0.9,
  },
  balloon1: { left: '8%' },
  balloon2: { left: '18%' },
  balloon3: { left: '28%' },
  balloon4: { left: '38%' },
  balloon5: { left: '48%' },
  balloon6: { left: '58%' },
  balloon7: { left: '68%' },
  balloon8: { left: '78%' },
  balloon9: { left: '12%' },
  balloon10: { left: '22%' },
  balloon11: { left: '42%' },
  balloon12: { left: '72%' },
  
  // Balloon bodies with different colors
  balloonBody1: {
    width: 35,
    height: 45,
    backgroundColor: '#FF6B6B',
    borderRadius: 17.5,
    borderTopLeftRadius: 17.5,
    borderTopRightRadius: 17.5,
    borderBottomLeftRadius: 17.5,
    borderBottomRightRadius: 0,
  },
  balloonBody2: {
    width: 32,
    height: 42,
    backgroundColor: '#4ECDC4',
    borderRadius: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 0,
  },
  balloonBody3: {
    width: 38,
    height: 48,
    backgroundColor: '#45B7D1',
    borderRadius: 19,
    borderTopLeftRadius: 19,
    borderTopRightRadius: 19,
    borderBottomLeftRadius: 19,
    borderBottomRightRadius: 0,
  },
  balloonBody4: {
    width: 34,
    height: 44,
    backgroundColor: '#96CEB4',
    borderRadius: 17,
    borderTopLeftRadius: 17,
    borderTopRightRadius: 17,
    borderBottomLeftRadius: 17,
    borderBottomRightRadius: 0,
  },
  balloonBody5: {
    width: 36,
    height: 46,
    backgroundColor: '#FFEAA7',
    borderRadius: 18,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 0,
  },
  balloonBody6: {
    width: 33,
    height: 43,
    backgroundColor: '#A29BFE',
    borderRadius: 16.5,
    borderTopLeftRadius: 16.5,
    borderTopRightRadius: 16.5,
    borderBottomLeftRadius: 16.5,
    borderBottomRightRadius: 0,
  },
  balloonBody7: {
    width: 37,
    height: 47,
    backgroundColor: '#FD79A8',
    borderRadius: 18.5,
    borderTopLeftRadius: 18.5,
    borderTopRightRadius: 18.5,
    borderBottomLeftRadius: 18.5,
    borderBottomRightRadius: 0,
  },
  balloonBody8: {
    width: 35,
    height: 45,
    backgroundColor: '#00B894',
    borderRadius: 17.5,
    borderTopLeftRadius: 17.5,
    borderTopRightRadius: 17.5,
    borderBottomLeftRadius: 17.5,
    borderBottomRightRadius: 0,
  },
  balloonBody9: {
    width: 39,
    height: 49,
    backgroundColor: '#E17055',
    borderRadius: 19.5,
    borderTopLeftRadius: 19.5,
    borderTopRightRadius: 19.5,
    borderBottomLeftRadius: 19.5,
    borderBottomRightRadius: 0,
  },
  balloonBody10: {
    width: 31,
    height: 41,
    backgroundColor: '#00CEC9',
    borderRadius: 15.5,
    borderTopLeftRadius: 15.5,
    borderTopRightRadius: 15.5,
    borderBottomLeftRadius: 15.5,
    borderBottomRightRadius: 0,
  },
  balloonBody11: {
    width: 36,
    height: 46,
    backgroundColor: '#6C5CE7',
    borderRadius: 18,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 0,
  },
  balloonBody12: {
    width: 34,
    height: 44,
    backgroundColor: '#74B9FF',
    borderRadius: 17,
    borderTopLeftRadius: 17,
    borderTopRightRadius: 17,
    borderBottomLeftRadius: 17,
    borderBottomRightRadius: 0,
  },
  
  // Balloon string
  balloonString: {
    width: 1,
    height: 40,
    backgroundColor: '#666',
    marginTop: -2,
  },
  
  successTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 16,
    color: theme.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 22,
  },
  productPreview: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  previewCard: {
    backgroundColor: theme.card,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  previewImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: theme.surface,
  },
  placeholderImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: theme.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewDetails: {
    flex: 1,
    marginLeft: 16,
  },
  previewName: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 4,
  },
  previewPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4B56E9',
    marginBottom: 4,
  },
  previewCategory: {
    fontSize: 14,
    color: theme.textSecondary,
    backgroundColor: theme.surface,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  actionContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  primaryButton: {
    backgroundColor: '#4B56E9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#4B56E9',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  secondaryButton: {
    backgroundColor: theme.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4B56E9',
  },
  secondaryButtonText: {
    color: '#4B56E9',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
  },
  statText: {
    fontSize: 14,
    color: theme.textSecondary,
    marginLeft: 4,
  },
});