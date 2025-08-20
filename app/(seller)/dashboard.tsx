// app/(seller)/dashboard.tsx
import { useRouter } from 'expo-router';
import React, { useState } from "react";
import {
  Image,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from '../contexts/ThemeContext';

const brandColor = "#4B56E9";
const router = useRouter();

// Onboarding Modal Component
const OnboardingModal = ({ visible, step, onNext, onSkip }) => {
  const { theme } = useTheme();
  
  const steps = [
    {
      title: "Add New Products", 
      description: "Quickly add new products to your store and start selling immediately",
      element: "addProduct",
      position: { top: 194, left: 14 },
      arrowDirection: "bottomLeft"
    },
    {
      title: "Manage Orders",
      description: "View and manage all your recent orders in one convenient place",
      element: "orders",
      position: { bottom: 66, left: 68 },
      arrowDirection: "bottomLeft"
    },
    {
      title: "Track Your Sales",
      description: "Monitor your total earnings and track your business growth over time",
      element: "totalSales",
      position: { top: 10, left: 30 },
      arrowDirection: "bottomLeft"
    }
  ];

  const currentStep = steps[step];

  const getArrowStyle = (direction) => {
    const baseArrow = {
      position: 'absolute',
      width: 0,
      height: 0,
      backgroundColor: 'transparent',
      borderStyle: 'solid',
    };

    switch (direction) {
      case 'topLeft':
        return {
          ...baseArrow,
          top: -10,
          left: 30,
          borderLeftWidth: 10,
          borderRightWidth: 10,
          borderBottomWidth: 10,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderBottomColor: theme.card,
        };
      case 'bottomLeft':
        return {
          ...baseArrow,
          bottom: -10,
          left: 30,
          borderLeftWidth: 10,
          borderRightWidth: 10,
          borderTopWidth: 10,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderTopColor: theme.card,
        };
      default:
        return baseArrow;
    }
  };

  const modalStyles = createModalStyles(theme);

  if (!visible || !currentStep) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={modalStyles.onboardingOverlay}>
        {/* Positioned Tooltip */}
        <View style={[modalStyles.tooltipContainer, currentStep.position]}>
          <View style={getArrowStyle(currentStep.arrowDirection)} />
          <Text style={modalStyles.tooltipTitle}>{currentStep.title}</Text>
          <Text style={modalStyles.tooltipDescription}>{currentStep.description}</Text>
          <View style={modalStyles.tooltipButtons}>
            <TouchableOpacity onPress={onSkip} style={modalStyles.skipButton}>
              <Text style={modalStyles.skipButtonText}>Skip</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onNext} style={modalStyles.nextButton}>
              <Text style={modalStyles.nextButtonText}>
                {step === 2 ? 'Get Started' : 'Next'}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={modalStyles.stepIndicator}>
            {steps.map((_, index) => (
              <View 
                key={index} 
                style={[
                  modalStyles.stepDot, 
                  index === step && modalStyles.activeStepDot
                ]} 
              />
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default function SellerDashboard() {
  const { theme, isDark } = useTheme();
  
  // Onboarding state
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [onboardingStep, setOnboardingStep] = useState(0);

  const handleNextOnboarding = () => {
    setTimeout(() => {
      if (onboardingStep < 2) {
        setOnboardingStep(onboardingStep + 1);
      } else {
        setShowOnboarding(false);
      }
    }, 1200); // 1.2 second delay for slower transition
  };

  const handleSkipOnboarding = () => {
    setShowOnboarding(false);
  };

  const isElementHighlighted = (elementType) => {
    if (!showOnboarding) return false;
    
    switch (onboardingStep) {
      case 2: return elementType === 'totalSales';
      case 0: return elementType === 'addProduct';
      case 1: return elementType === 'orders';
      default: return false;
    }
  };

  const stats = [
    { 
      icon: "💰", 
      value: "$15,000", 
      label: "Total Sales",
      iconColor: "#FF6B35"
    },
    { 
      icon: "📦", 
      value: "12", 
      label: "Active Products",
      iconColor: "#4B56E9"
    },
    { 
      icon: "🛒", 
      value: "3", 
      label: "New Orders",
      iconColor: "#10B981"
    },
  ];

  const actions = [
    { 
      icon: "➕", 
      label: "Add Product", 
      onPress: () => router.push('/products/add-product'),
      backgroundColor: brandColor
    },
    { 
      icon: "🛒", 
      label: "View Orders", 
      onPress: () => {},
      backgroundColor: brandColor
    },
    { 
      icon: "🔒", 
      label: "View Earnings", 
      onPress: () => {},
      backgroundColor: brandColor
    },
    { 
      icon: "💬", 
      label: "Messages", 
      onPress: () => {},
      backgroundColor: brandColor
    },
  ];

  const orders = [
    {
      id: 1,
      product: "Ergonomic Chair",
      user: "@rachelsmith",
      status: "Pending",
      statusColor: "#F59E0B",
      image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=100&h=100&fit=crop&crop=center",
    },
    {
      id: 2,
      product: "Playstation 5",
      user: "@rachelsmith",
      status: "Shipped",
      statusColor: "#3B82F6",
      image: "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=100&h=100&fit=crop&crop=center",
    },
    {
      id: 3,
      product: "iPhone 14 pro max",
      user: "@rachelsmith",
      status: "Completed",
      statusColor: "#10B981",
      image: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=100&h=100&fit=crop&crop=center",
    },
    // ... (rest of orders data - keeping all the orders for scrolling)
    {
      id: 4,
      product: "iPhone 14 pro max",
      user: "@rachelsmith",
      status: "Completed",
      statusColor: "#10B981",
      image: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=100&h=100&fit=crop&crop=center",
    },
    {
      id: 5,
      product: "Ergonomic Chair",
      user: "@rachelsmith",
      status: "Pending",
      statusColor: "#F59E0B",
      image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=100&h=100&fit=crop&crop=center",
    },
    {
      id: 6,
      product: "Ergonomic Chair",
      user: "@rachelsmith",
      status: "Pending",
      statusColor: "#F59E0B",
      image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=100&h=100&fit=crop&crop=center",
    },
    {
      id: 7,
      product: "Ergonomic Chair",
      user: "@rachelsmith",
      status: "Pending",
      statusColor: "#F59E0B",
      image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=100&h=100&fit=crop&crop=center",
    },
    {
      id: 8,
      product: "Playstation 5",
      user: "@rachelsmith",
      status: "Shipped",
      statusColor: "#3B82F6",
      image: "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=100&h=100&fit=crop&crop=center",
    },
    {
      id: 9,
      product: "iPhone 14 pro max",
      user: "@rachelsmith",
      status: "Completed",
      statusColor: "#10B981",
      image: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=100&h=100&fit=crop&crop=center",
    },
    {
      id: 10,
      product: "iPhone 14 pro max",
      user: "@rachelsmith",
      status: "Completed",
      statusColor: "#10B981",
      image: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=100&h=100&fit=crop&crop=center",
    }
  ];

  const styles = createStyles(theme);

  return (
    <View style={styles.mainContainer}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={theme.background}
      />
      <SafeAreaView style={styles.safe} edges={["top"]}>
        {/* Blur overlay for non-highlighted elements */}
        {showOnboarding && (
          <View style={styles.blurOverlay} pointerEvents="none" />
        )}

        <ScrollView 
          style={styles.container} 
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View 
            style={[
              styles.header,
              showOnboarding && !isElementHighlighted('header') && styles.blurredElement
            ]}
          >
            <Text style={styles.greeting}>Welcome back 👨‍💼</Text>
          </View>

          {/* Notification Banner */}
          <View 
            style={[
              styles.banner,
              showOnboarding && !isElementHighlighted('banner') && styles.blurredElement
            ]}
          >
            <Text style={styles.bannerIcon}>🔔</Text>
            <Text style={styles.bannerText}>You have 2 new messages.</Text>
          </View>

          {/* Stats Cards */}
          <View 
            style={[
              styles.statsContainer,
              showOnboarding && !isElementHighlighted('totalSales') && styles.blurredElement
            ]}
          >
            {stats.map((item, index) => (
              <View 
                key={index} 
                style={[
                  styles.statCard,
                  index === 0 && isElementHighlighted('totalSales') && styles.highlightedElement
                ]}
              >
                <View style={styles.statHeader}>
                  <Text style={styles.statIcon}>{item.icon}</Text>
                </View>
                <Text style={styles.statValue}>{item.value}</Text>
                <Text style={styles.statLabel}>{item.label}</Text>
                {item.subLabel && (
                  <Text style={styles.statSubLabel}>{item.subLabel}</Text>
                )}
              </View>
            ))}
          </View>

          {/* Action Buttons */}
          <View 
            style={[
              styles.actionsContainer,
              showOnboarding && !isElementHighlighted('addProduct') && styles.blurredElement
            ]}
          >
            {actions.map((action, index) => (
              <TouchableOpacity 
                key={index} 
                style={[
                  styles.actionButton, 
                  { backgroundColor: action.backgroundColor },
                  index === 0 && isElementHighlighted('addProduct') && styles.highlightedElement
                ]} 
                onPress={action.onPress}
                activeOpacity={0.8}
              >
                <Text style={styles.actionIcon}>{action.icon}</Text>
                <Text style={styles.actionText}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Recent Orders Section */}
          <View 
            style={[
              styles.ordersSection,
              showOnboarding && !isElementHighlighted('orders') && styles.blurredElement,
              isElementHighlighted('orders') && styles.highlightedElement
            ]}
          >
            <Text style={styles.sectionTitle}>Recent Orders</Text>
            
            {orders.map((order) => (
              <View key={order.id} style={styles.orderItem}>
                <Image source={{ uri: order.image }} style={styles.orderImage} />
                <View style={styles.orderInfo}>
                  <Text style={styles.orderProduct}>{order.product}</Text>
                  <Text style={styles.orderUser}>{order.user}</Text>
                </View>
                <View style={styles.orderStatusContainer}>
                  <Text style={[styles.orderStatus, { color: order.statusColor }]}>
                    {order.status}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Bottom Spacing for Navigation */}
          <View style={styles.bottomSpacing} />
        </ScrollView>

        {/* Onboarding Modal */}
        <OnboardingModal
          visible={showOnboarding}
          step={onboardingStep}
          onNext={handleNextOnboarding}
          onSkip={handleSkipOnboarding}
        />
      </SafeAreaView>
    </View>
  );
}

const createStyles = (theme) => StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: theme.background,
  },
  safe: {
    flex: 1,
    backgroundColor: theme.background,
  },
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  // Onboarding styles
  blurOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    zIndex: 1,
  },
  blurredElement: {
    opacity: 0.3,
  },
  highlightedElement: {
    zIndex: 10,
    elevation: 20,
    shadowColor: brandColor,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
  },
  header: {
    marginBottom: 20,
  },
  greeting: {
    fontSize: 22,
    fontWeight: "700",
    color: theme.text,
    lineHeight: 28,
  },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 24,
  },
  bannerIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  bannerText: {
    fontSize: 14,
    color: "#92400E",
    fontWeight: "500",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 28,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.card,
    paddingVertical: 20,
    paddingHorizontal: 12,
    borderRadius: 16,
    alignItems: "center",
    ...theme.shadow,
  },
  statHeader: {
    marginBottom: 12,
  },
  statIcon: {
    fontSize: 32,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: theme.textSecondary,
    textAlign: "center",
    fontWeight: "500",
  },
  statSubLabel: {
    fontSize: 12,
    color: theme.textTertiary,
    textAlign: "center",
    marginTop: 2,
  },
  actionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 32,
    gap: 12,
  },
  actionButton: {
    width: "48%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    shadowColor: brandColor,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  actionIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  actionText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
    textAlign: "center",
  },
  ordersSection: {
    backgroundColor: theme.card,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 20,
    ...theme.shadow,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.text,
    marginBottom: 16,
  },
  orderItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  orderImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginRight: 16,
  },
  orderInfo: {
    flex: 1,
  },
  orderProduct: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.text,
    marginBottom: 4,
  },
  orderUser: {
    fontSize: 14,
    color: theme.textSecondary,
    fontWeight: "500",
  },
  orderStatusContainer: {
    alignItems: "flex-end",
  },
  orderStatus: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "right",
  },
  bottomSpacing: {
    height: 100, // Space for bottom navigation
  },
});

const createModalStyles = (theme) => StyleSheet.create({
  // Enhanced Onboarding Styles
  onboardingOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
  },
  tooltipContainer: {
    position: 'absolute',
    backgroundColor: theme.card,
    borderRadius: 16,
    padding: 20,
    width: 280,
    ...theme.shadow,
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 15,
    borderWidth: 1,
    borderColor: theme.border,
  },
  tooltipTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  tooltipDescription: {
    fontSize: 14,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  tooltipButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  skipButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: 'center',
    backgroundColor: theme.surface,
  },
  skipButtonText: {
    color: theme.textSecondary,
    fontWeight: '600',
    fontSize: 14,
  },
  nextButton: {
    flex: 1,
    backgroundColor: brandColor,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.border,
  },
  activeStepDot: {
    backgroundColor: brandColor,
    width: 12,
  },
});