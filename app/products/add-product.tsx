// app/products/add-product.tsx
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

// Import theme context
import { useTheme } from '../contexts/ThemeContext';

const { width } = Dimensions.get('window');
const brandColor = '#4B56E9';

// Categories matching your home screen exactly (excluding 'Home' as it's not a product category)
const categories = ['Electronic', 'Fashion', 'Beauty', 'Health', 'Sports', 'Fitness', 'Appliance', 'Jewelry', 'Furniture', 'Gaming'];

export default function AddProductScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  
  // Form state
  const [productName, setProductName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [productImage, setProductImage] = useState<string | null>(null);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Create dynamic styles
  const styles = createStyles(theme);

  // Image picker function - FIXED TO SAVE PERMANENTLY!
  const pickImage = async () => {
    try {
      // Request permission first
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert(
          'Permission Required',
          'Please allow access to your photo library to upload images.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Launch image picker with updated options
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        allowsMultipleSelection: false,
      });

      console.log('Image picker result:', result); // Debug log

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0];
        console.log('Selected image URI (temporary):', selectedImage.uri);
        
        // COPY IMAGE TO PERMANENT STORAGE
        try {
          const fileName = `product_image_${Date.now()}.jpeg`;
          const permanentUri = `${FileSystem.documentDirectory}${fileName}`;
          
          await FileSystem.copyAsync({
            from: selectedImage.uri,
            to: permanentUri,
          });
          
          console.log('Image copied to permanent location:', permanentUri);
          setProductImage(permanentUri);
          
        } catch (copyError) {
          console.error('Error copying image:', copyError);
          Alert.alert('Error', 'Failed to save image. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  // Form validation
  const validateForm = () => {
    if (!productName.trim()) {
      Alert.alert('Validation Error', 'Please enter a product name.');
      return false;
    }
    if (!description.trim()) {
      Alert.alert('Validation Error', 'Please enter a product description.');
      return false;
    }
    if (!price.trim() || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid price.');
      return false;
    }
    if (!quantity.trim() || isNaN(parseInt(quantity)) || parseInt(quantity) <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid quantity.');
      return false;
    }
    if (!selectedCategory) {
      Alert.alert('Validation Error', 'Please select a category.');
      return false;
    }
    if (!deliveryMethod.trim()) {
      Alert.alert('Validation Error', 'Please enter delivery method.');
      return false;
    }
    return true;
  };

  // Generate unique ID for product
  const generateProductId = () => {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // Save product function - UPDATED TO NAVIGATE TO SUCCESS SCREEN!
  const handleAddProduct = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    
    try {
      // Create product object
      const newProduct = {
        id: generateProductId(),
        name: productName.trim(),
        description: description.trim(),
        price: parseFloat(price),
        category: selectedCategory,
        image: productImage,
        quantity: parseInt(quantity),
        deliveryMethod: deliveryMethod.trim(),
        rating: 0, // New products start with 0 rating
        reviews: 0, // New products start with 0 reviews
        discount: 0, // No discount for new products initially
        dateAdded: new Date().toISOString(),
        isUserGenerated: true, // Flag to identify user-generated products
        // Additional details for product details screen
        specifications: {
          // You can expand this later
          quantity: parseInt(quantity),
          delivery: deliveryMethod.trim()
        },
        sellerInfo: {
          // You can add seller info later when you implement user authentication
          sellerId: 'current_user', // Placeholder
          addedDate: new Date().toISOString()
        }
      };

      // Get existing products from AsyncStorage
      const existingProductsJson = await AsyncStorage.getItem('userProducts');
      const existingProducts = existingProductsJson ? JSON.parse(existingProductsJson) : [];

      // Add new product to the beginning of the array (higher priority)
      const updatedProducts = [newProduct, ...existingProducts];

      // Save back to AsyncStorage
      await AsyncStorage.setItem('userProducts', JSON.stringify(updatedProducts));

      console.log('Product saved successfully:', newProduct); // Debug log

      // Navigate to success screen instead of showing alert
      router.push('./product-added-successfully');

    } catch (error) {
      console.error('Error saving product:', error);
      Alert.alert('Error', 'Failed to save product. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // IMPROVED Category Dropdown - Now Scrollable!
  const CategoryDropdown = () => (
    showCategoryDropdown && (
      <View style={styles.dropdown}>
        <ScrollView 
          style={styles.dropdownScroll} 
          showsVerticalScrollIndicator={true}
          nestedScrollEnabled={true}
          bounces={true}
        >
          {categories.map((category, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.dropdownItem,
                index === categories.length - 1 && styles.lastDropdownItem
              ]}
              onPress={() => {
                setSelectedCategory(category);
                setShowCategoryDropdown(false);
              }}
            >
              <Text style={styles.dropdownItemText}>{category}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    )
  );

  return (
    <View style={styles.container}>
      <StatusBar style={theme.statusBar} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <Text style={styles.headerIcon}>🛒</Text>
          <Text style={styles.titleText}>Add New Product</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView 
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          bounces={true}
          keyboardShouldPersistTaps="handled"
        >
          {/* Image Upload */}
          <TouchableOpacity style={styles.imageUploadContainer} onPress={pickImage}>
            {productImage ? (
              <View style={styles.imagePreviewContainer}>
                <Image source={{ uri: productImage }} style={styles.imagePreview} />
                <View style={styles.changeImageOverlay}>
                  <Ionicons name="camera" size={20} color="#fff" />
                  <Text style={styles.changeImageText}>Change</Text>
                </View>
              </View>
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="camera" size={32} color={theme.textTertiary} />
                <Text style={styles.uploadText}>+ Upload Image</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Product Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Product Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Wireless Headphones"
              placeholderTextColor={theme.textTertiary}
              value={productName}
              onChangeText={setProductName}
              returnKeyType="next"
            />
          </View>

          {/* Category Selection */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Category</Text>
            <TouchableOpacity 
              style={styles.categorySelector}
              onPress={() => setShowCategoryDropdown(!showCategoryDropdown)}
            >
              <Text style={[
                styles.categorySelectorText, 
                selectedCategory ? { color: theme.text } : { color: theme.textTertiary }
              ]}>
                {selectedCategory || 'Select category'}
              </Text>
              <Ionicons 
                name={showCategoryDropdown ? "chevron-up" : "chevron-down"} 
                size={20} 
                color={theme.textSecondary} 
              />
            </TouchableOpacity>
            <CategoryDropdown />
          </View>

          {/* Description */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Tell buyers about the product"
              placeholderTextColor={theme.textTertiary}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Price and Quantity Row */}
          <View style={styles.rowContainer}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Price($)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 15000"
                placeholderTextColor={theme.textTertiary}
                value={price}
                onChangeText={setPrice}
                keyboardType="numeric"
                returnKeyType="next"
              />
            </View>

            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Quantity</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 20"
                placeholderTextColor={theme.textTertiary}
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="numeric"
                returnKeyType="next"
              />
            </View>
          </View>

          {/* Delivery Method */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Delivery Method</Text>
            <TextInput
              style={styles.input}
              placeholder="Local Delivery, Pickup, etc."
              placeholderTextColor={theme.textTertiary}
              value={deliveryMethod}
              onChangeText={setDeliveryMethod}
              returnKeyType="done"
            />
          </View>

          {/* Add Product Button */}
          <TouchableOpacity 
            style={[styles.addButton, isSubmitting && styles.addButtonDisabled]}
            onPress={handleAddProduct}
            disabled={isSubmitting}
          >
            <Text style={styles.addButtonText}>
              {isSubmitting ? 'Adding Product...' : 'Add Product'}
            </Text>
          </TouchableOpacity>

          {/* Bottom Spacing for comfortable scrolling */}
          <View style={{ height: 120 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// Dynamic styles function
const createStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: theme.background,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  headerIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  titleText: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.text,
  },
  headerSpacer: {
    width: 40, // Same width as back button for centering
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40, // Extra padding at bottom for comfortable scrolling
  },
  imageUploadContainer: {
    alignSelf: 'center',
    marginBottom: 32,
  },
  imagePlaceholder: {
    width: 120,
    height: 120,
    backgroundColor: theme.surface,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.border,
    borderStyle: 'dashed',
  },
  uploadText: {
    marginTop: 8,
    fontSize: 14,
    color: theme.textTertiary,
    fontWeight: '500',
  },
  imagePreviewContainer: {
    position: 'relative',
  },
  imagePreview: {
    width: 120,
    height: 120,
    borderRadius: 12,
  },
  changeImageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  changeImageText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: theme.text,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 14,
  },
  categorySelector: {
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categorySelectorText: {
    fontSize: 16,
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: theme.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    zIndex: 1000,
    maxHeight: 200,
    shadowColor: theme.shadow.split('(')[0],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  dropdownScroll: {
    flex: 1,
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  lastDropdownItem: {
    borderBottomWidth: 0, // Remove border from last item
  },
  dropdownItemText: {
    fontSize: 16,
    color: theme.text,
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  halfWidth: {
    flex: 1,
  },
  addButton: {
    backgroundColor: brandColor,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: brandColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  addButtonDisabled: {
    opacity: 0.6,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});