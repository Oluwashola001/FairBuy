import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

const { width } = Dimensions.get('window');
const brandColor = '#4B56E9';

export default function ProfileScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const [profileImage, setProfileImage] = useState('https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face');
  const [isUploading, setIsUploading] = useState(false);
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // Request permissions and load saved profile image
    requestPermissions();
    loadProfileImage();
  }, []);

  // Load saved profile image from AsyncStorage
  const loadProfileImage = async () => {
    try {
      const savedImage = await AsyncStorage.getItem('profileImage');
      if (savedImage) {
        setProfileImage(savedImage);
      }
    } catch (error) {
      console.error('Error loading profile image:', error);
    }
  };

  // Save profile image to AsyncStorage
  const saveProfileImage = async (imageUri) => {
    try {
      await AsyncStorage.setItem('profileImage', imageUri);
      console.log('Profile image saved successfully:', imageUri);
    } catch (error) {
      console.error('Error saving profile image:', error);
      Alert.alert('Error', 'Failed to save profile image');
    }
  };

  const requestPermissions = async () => {
    try {
      console.log('Requesting permissions...');
      
      if (Platform.OS !== 'web') {
        // Request camera permissions
        const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
        console.log('Camera permission status:', cameraPermission.status);
        
        // Request media library permissions
        const mediaLibraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        console.log('Media library permission status:', mediaLibraryPermission.status);
        
        if (cameraPermission.status === 'granted' && mediaLibraryPermission.status === 'granted') {
          setPermissionsGranted(true);
          console.log('All permissions granted');
        } else {
          console.log('Permissions not granted');
          Alert.alert(
            'Permissions Required',
            'This app needs camera and photo library access to update your profile picture. Please grant permissions in your device settings.',
            [
              { text: 'Cancel', style: 'cancel' },
              { 
                text: 'Open Settings', 
                onPress: () => {
                  // On iOS, this will prompt user to go to settings
                  // On Android, you might need to use a library like expo-linking
                  console.log('Redirect to settings');
                }
              }
            ]
          );
        }
      } else {
        setPermissionsGranted(true);
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
      Alert.alert('Error', 'Failed to request permissions');
    }
  };

  const showImagePickerOptions = () => {
    if (!permissionsGranted && Platform.OS !== 'web') {
      Alert.alert(
        'Permissions Required',
        'Please grant camera and photo library permissions to update your profile picture.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Grant Permissions', onPress: requestPermissions }
        ]
      );
      return;
    }

    Alert.alert(
      "Update Profile Picture",
      "Choose how you'd like to update your profile picture",
      [
        {
          text: "Camera",
          onPress: openCamera,
          style: "default",
        },
        {
          text: "Photo Library",
          onPress: openImageLibrary,
          style: "default",
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ],
      { cancelable: true }
    );
  };

  const openCamera = async () => {
    try {
      console.log('Opening camera...');
      setIsUploading(true);
      
      // Check permissions again before opening camera
      const permission = await ImagePicker.getCameraPermissionsAsync();
      console.log('Current camera permission:', permission);
      
      if (permission.status !== 'granted') {
        const newPermission = await ImagePicker.requestCameraPermissionsAsync();
        if (newPermission.status !== 'granted') {
          Alert.alert('Permission Required', 'Camera permission is required to take photos.');
          setIsUploading(false);
          return;
        }
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images, // Updated API
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: false,
      });

      console.log('Camera result:', result);

      if (!result.canceled && result.assets && result.assets[0]) {
        const newImageUri = result.assets[0].uri;
        console.log('New image URI:', newImageUri);
        setProfileImage(newImageUri);
        await saveProfileImage(newImageUri);
        Alert.alert('Success', 'Profile picture updated successfully!');
      } else {
        console.log('Camera was canceled or no image selected');
      }
    } catch (error) {
      console.error('Error opening camera:', error);
      Alert.alert('Error', `Failed to open camera: ${error.message || 'Unknown error'}`);
    } finally {
      setIsUploading(false);
    }
  };

  const openImageLibrary = async () => {
    try {
      console.log('Opening image library...');
      setIsUploading(true);
      
      // Check permissions again before opening library
      const permission = await ImagePicker.getMediaLibraryPermissionsAsync();
      console.log('Current media library permission:', permission);
      
      if (permission.status !== 'granted') {
        const newPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        console.log('New media library permission:', newPermission);
        if (newPermission.status !== 'granted') {
          Alert.alert('Permission Required', 'Photo library permission is required to select photos.');
          setIsUploading(false);
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images, // Updated API
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: false,
      });

      console.log('Image library result:', result);

      if (!result.canceled && result.assets && result.assets[0]) {
        const newImageUri = result.assets[0].uri;
        console.log('New image URI:', newImageUri);
        setProfileImage(newImageUri);
        await saveProfileImage(newImageUri);
        Alert.alert('Success', 'Profile picture updated successfully!');
      } else {
        console.log('Image library was canceled or no image selected');
      }
    } catch (error) {
      console.error('Error opening image library:', error);
      Alert.alert('Error', `Failed to open photo library: ${error.message || 'Unknown error'}`);
    } finally {
      setIsUploading(false);
    }
  };

  const OrderItem = ({ image, title, date, price, index }) => {
    const itemFadeAnim = useRef(new Animated.Value(0)).current;
    const itemSlideAnim = useRef(new Animated.Value(30)).current;

    useEffect(() => {
      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(itemFadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(itemSlideAnim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ]).start();
      }, index * 150);

      return () => clearTimeout(timer);
    }, []);

    const styles = createStyles(theme);

    return (
      <Animated.View
        style={[
          styles.orderItem,
          {
            opacity: itemFadeAnim,
            transform: [{ translateY: itemSlideAnim }],
          },
        ]}
      >
        <Image source={{ uri: image }} style={styles.orderImage} />
        <View style={styles.orderInfo}>
          <Text style={styles.orderTitle}>{title}</Text>
          <Text style={styles.orderDate}>{date}</Text>
          <Text style={styles.orderPrice}>{price}</Text>
        </View>
      </Animated.View>
    );
  };

  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <StatusBar style={theme.statusBar} />
      
      <ScrollView showsVerticalScrollIndicator={false} bounces={true}>
        {/* Header */}
        <Animated.View
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Profile</Text>
          <TouchableOpacity style={styles.settingsButton} onPress={() => router.push('../settings')}>
            <Ionicons name="settings-outline" size={24} color={theme.text} />
          </TouchableOpacity>
        </Animated.View>

        {/* User Profile Section */}
        <Animated.View
          style={[
            styles.userSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <TouchableOpacity 
            style={styles.avatarContainer}
            onPress={showImagePickerOptions}
            activeOpacity={0.8}
          >
            <Image
              source={{ uri: profileImage }}
              style={styles.avatar}
              onError={(error) => {
                console.log('Image load error:', error);
                // Fallback to default image if custom image fails to load
                setProfileImage('https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face');
              }}
            />
            <View style={styles.avatarGlow} />
            
            {/* Camera Icon Overlay */}
            <View style={styles.cameraOverlay}>
              {isUploading ? (
                <Animated.View style={styles.uploadingIndicator}>
                  <Ionicons name="cloud-upload-outline" size={16} color="#fff" />
                </Animated.View>
              ) : (
                <Ionicons name="camera" size={16} color="#fff" />
              )}
            </View>
            
            {/* Edit Icon Badge */}
            <View style={styles.editBadge}>
              <Ionicons name="pencil" size={12} color="#fff" />
            </View>
          </TouchableOpacity>
          
          <View style={styles.userInfo}>
            <Text style={styles.userName}>Rachel Smith</Text>
            <Text style={styles.userEmail}>rachelsmith@gmail.com</Text>
            <TouchableOpacity style={styles.editProfileButton} onPress={showImagePickerOptions}>
              <Text style={styles.editProfileText}>Tap to edit photo</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* My Orders Section */}
        <Animated.View
          style={[
            styles.ordersSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.sectionTitle}>My Orders</Text>
          
          <OrderItem
            image="https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=60&h=60&fit=crop"
            title="Ergonomic Chair"
            date="July, 14 2025."
            price="$230"
            index={0}
          />
          
          <OrderItem
            image="https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=60&h=60&fit=crop"
            title="Playstation 5"
            date="May, 18 2025."
            price="$399"
            index={1}
          />
          
          <OrderItem
            image="https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=60&h=60&fit=crop"
            title="iPhone 14 pro max"
            date="May, 10 2025."
            price="$399"
            index={2}
          />

          <TouchableOpacity style={styles.viewAllButton}>
            <Text style={styles.viewAllText}>View All</Text>
            <Ionicons name="chevron-forward" size={18} color={brandColor} />
          </TouchableOpacity>
        </Animated.View>

        {/* Switch to Seller Mode Button */}
        <Animated.View
          style={[
            styles.buttonSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <TouchableOpacity style={styles.sellerModeButton} onPress={() => router.push('/become-seller')}>
            <Text style={styles.sellerModeText}>Switch to Seller Mode</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Help & Support */}
        <Animated.View
          style={[
            styles.helpSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <TouchableOpacity style={styles.helpButton}>
            <View style={styles.helpContent}>
              <View style={styles.helpIconContainer}>
                <Ionicons name="logo-facebook" size={20} color={brandColor} />
              </View>
              <Text style={styles.helpText}>Help & Support</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        </Animated.View>

        {/* Sign Out Button */}
        <Animated.View
          style={[
            styles.signOutSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <TouchableOpacity style={styles.signOutButton} onPress={() => router.push('/auth/login')}>
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </Animated.View>

         
      </ScrollView>
    </View>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.text,
  },
  settingsButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.surface,
  },
  avatarGlow: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 44,
    backgroundColor: brandColor,
    opacity: 0.1,
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    backgroundColor: brandColor,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.background,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  uploadingIndicator: {
    transform: [{ rotate: '45deg' }],
  },
  editBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 24,
    height: 24,
    backgroundColor: '#10B981',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.background,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  userInfo: {
    marginLeft: 16,
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: theme.textSecondary,
    marginBottom: 6,
  },
  editProfileButton: {
    paddingVertical: 2,
  },
  editProfileText: {
    fontSize: 12,
    color: brandColor,
    fontWeight: '500',
  },
  ordersSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 20,
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: theme.card,
    borderRadius: 12,
    padding: 4,
    ...theme.shadow,
  },
  orderImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: theme.surface,
  },
  orderInfo: {
    marginLeft: 16,
    flex: 1,
  },
  orderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 14,
    color: theme.textSecondary,
    marginBottom: 4,
  },
  orderPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: brandColor,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingVertical: 8,
  },
  viewAllText: {
    fontSize: 16,
    color: brandColor,
    fontWeight: '600',
    marginRight: 4,
  },
  buttonSection: {
    marginBottom: 24,
  },
  sellerModeButton: {
    backgroundColor: brandColor,
    paddingVertical: 16,
    alignItems: 'center',
    marginHorizontal: 0,
    shadowColor: brandColor,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  sellerModeText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  helpSection: {
    marginBottom: 24,
  },
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  helpContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  helpIconContainer: {
    width: 32,
    height: 32,
    backgroundColor: '#EEF2FF',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  helpText: {
    fontSize: 16,
    color: theme.text,
    fontWeight: '500',
  },
  signOutSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  signOutButton: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  signOutText: {
    fontSize: 16,
    color: '#EF4444',
    fontWeight: '800',
  },
});