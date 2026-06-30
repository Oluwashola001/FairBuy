// app/products/edit-product.tsx
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
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

// Categories matching your home screen exactly
const categories = ['Electronic', 'Fashion', 'Beauty', 'Health', 'Sports', 'Fitness', 'Appliance', 'Jewelry', 'Furniture', 'Gaming'];

export default function EditProductScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const { id } = useLocalSearchParams();
  
  // Form state
  const [productName, setProductName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [productImage, setProductImage] = useState<string | null>(null);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Load existing product data
  useEffect(() => {
    if (!id) {
      Alert.alert("Error", "No product ID provided.");
      router.back();
      return;
    }

    const fetchProduct = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;

        if (data) {
          setProductName(data.name || data.title || '');
          setDescription(data.description || '');
          setPrice(data.price?.toString() || '');
          setQuantity((data.quantity || 0).toString());
          setDeliveryMethod(data.delivery_method || '');
          setSelectedCategory(data.category || '');
          
          const imgUrl = data.image_url || data.image;
          setProductImage(imgUrl);
          setOriginalImage(imgUrl); // Save this to check if user changes it later
        }
      } catch (error: any) {
        console.error("Error fetching product:", error);
        Alert.alert("Error", "Could not load product details.");
        router.back();
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchProduct();
  }, [id]);

  const styles = createStyles(theme);

  // Simplified Image Picker - Just get the URI to preview, upload happens on submit
  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert(
          'Permission Required',
          'Please allow access to your photo library to upload images.',
          [{ text: 'OK' }]
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5, // Compress to save bandwidth
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setProductImage(result.assets[0].uri);
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
    if (!quantity.trim() || isNaN(parseInt(quantity)) || parseInt(quantity) < 0) {
      Alert.alert('Validation Error', 'Please enter a valid quantity.');
      return false;
    }
    if (!selectedCategory) {
      Alert.alert('Validation Error', 'Please select a category.');
      return false;
    }
    if (!productImage) {
      Alert.alert('Validation Error', 'Please select a product image.');
      return false;
    }
    return true;
  };

  // Save product directly to Supabase
  const handleUpdateProduct = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("You must be logged in as a seller.");

      let finalImageUrl = productImage;

      // Only upload a new image if the URI changed and it's not a web URL (meaning it's a local file)
      if (productImage !== originalImage && productImage && !productImage.startsWith('http')) {
        const response = await fetch(productImage);
        const blob = await response.blob();
        const arrayBuffer = await new Response(blob).arrayBuffer();
        
        const fileExt = productImage.split('.').pop() || 'jpeg';
        const fileName = `${user.id}/${Date.now()}_update.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(fileName, arrayBuffer, {
            contentType: `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`,
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(fileName);
          
        finalImageUrl = publicUrl;
      }

      // 3. Update the actual product details in the Database
      const { error: dbError } = await supabase
        .from('products')
        .update({
          name: productName.trim(),
          description: description.trim(),
          price: parseFloat(price),
          category: selectedCategory,
          image_url: finalImageUrl,
          quantity: parseInt(quantity),
          delivery_method: deliveryMethod.trim(),
        })
        .eq('id', id);

      if (dbError) throw dbError;

      // 4. Navigate back to products list!
      Alert.alert("Success", "Product updated successfully!");
      router.back();

    } catch (error: any) {
      console.error('Error updating product:', error);
      Alert.alert('Error', error.message || 'Failed to update product. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

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

  if (isLoadingData) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={brandColor} />
        <Text style={{ marginTop: 12, color: theme.textSecondary }}>Loading product data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <Text style={styles.headerIcon}>✏️</Text>
          <Text style={styles.titleText}>Edit Product</Text>
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
          <TouchableOpacity style={styles.imageUploadContainer} onPress={pickImage} disabled={isSubmitting}>
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
              editable={!isSubmitting}
            />
          </View>

          {/* Category Selection */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Category</Text>
            <TouchableOpacity 
              style={styles.categorySelector}
              onPress={() => !isSubmitting && setShowCategoryDropdown(!showCategoryDropdown)}
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
              editable={!isSubmitting}
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
                editable={!isSubmitting}
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
                editable={!isSubmitting}
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
              editable={!isSubmitting}
            />
          </View>

          {/* Save Product Button */}
          <TouchableOpacity 
            style={[styles.addButton, isSubmitting && styles.addButtonDisabled]}
            onPress={handleUpdateProduct}
            disabled={isSubmitting}
          >
            <Text style={styles.addButtonText}>
              {isSubmitting ? 'Saving Changes...' : 'Save Changes'}
            </Text>
          </TouchableOpacity>

          <View style={{ height: 120 }} />
        </ScrollView>
      </KeyboardAvoidingView>
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
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingBottom: 20,
    backgroundColor: theme.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
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
    width: 40, 
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
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
    backgroundColor: 'rgba(0,0,0,0.6)',
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
    shadowColor: theme.shadow?.split('(')[0] || '#000',
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
    borderBottomWidth: 0,
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