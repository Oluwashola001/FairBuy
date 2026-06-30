// app/products/my-products.tsx
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

const brandColor = "#4B56E9";

export default function MyProductsScreen() {
  const { theme, isDark } = useTheme();
  const router = useRouter();

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMyProducts = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('seller_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error: any) {
      console.error("Error fetching products:", error.message);
    }
  };

  useFocusEffect(
    useCallback(() => {
      const initFetch = async () => {
        setLoading(true);
        await fetchMyProducts();
        setLoading(false);
      };
      initFetch();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMyProducts();
    setRefreshing(false);
  };

  const handleDelete = (productId: string, productName: string) => {
    Alert.alert(
      "Delete Product",
      `Are you sure you want to remove "${productName}" from your store?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await supabase.from('products').delete().eq('id', productId);
              if (error) throw error;
              // Remove from local state to update UI instantly
              setProducts(prev => prev.filter(p => p.id !== productId));
            } catch (err: any) {
              Alert.alert("Error", "Could not delete product: " + err.message);
            }
          }
        }
      ]
    );
  };

  const styles = createStyles(theme);

  const renderProduct = ({ item }: { item: any }) => (
    <View style={styles.productCard}>
      <Image 
        source={{ uri: item.image_url || 'https://via.placeholder.com/150' }} 
        style={styles.productImage} 
      />
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>{item.title || item.name}</Text>
        <Text style={styles.productPrice}>${Number(item.price).toFixed(2)}</Text>
        
        <View style={styles.stockContainer}>
            <View style={[styles.stockDot, { backgroundColor: item.quantity > 0 ? '#10B981' : '#EF4444' }]} />
            <Text style={styles.stockText}>
                {item.quantity > 0 ? `${item.quantity} in stock` : 'Out of Stock'}
            </Text>
        </View>
      </View>

      <View style={styles.actionButtons}>
        {/* Assumes you have an edit product screen, passing the ID */}
        <TouchableOpacity 
          style={styles.editButton} 
          onPress={() => router.push({ pathname: '/products/edit-product', params: { id: item.id } })}
        >
          <Ionicons name="pencil" size={18} color={brandColor} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.deleteButton} 
          onPress={() => handleDelete(item.id, item.title || item.name)}
        >
          <Ionicons name="trash-outline" size={18} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style={isDark ? "light" : "dark"} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Products</Text>
        <TouchableOpacity onPress={() => router.push('/products/add-product')} style={styles.addBtn}>
          <Ionicons name="add" size={24} color={brandColor} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={brandColor} />
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderProduct}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={brandColor} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="cube-outline" size={48} color={brandColor} />
              </View>
              <Text style={styles.emptyTitle}>No Products Yet</Text>
              <Text style={styles.emptySub}>You haven't added any items to your store.</Text>
              <TouchableOpacity 
                style={styles.addFirstBtn}
                onPress={() => router.push('/products/add-product')}
              >
                <Text style={styles.addFirstBtnText}>Add Your First Product</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </SafeAreaView>
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
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    marginTop: 42,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.text,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(75, 86, 233, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: theme.surface,
    borderRadius: 20,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: theme.shadow?.split('(')[0] || '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: theme.background,
  },
  productInfo: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  productName: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: brandColor,
    marginBottom: 6,
  },
  stockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stockDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  stockText: {
    fontSize: 13,
    color: theme.textSecondary,
    fontWeight: '500',
  },
  actionButtons: {
    justifyContent: 'center',
    paddingVertical: 4,
    paddingLeft: 12,
    borderLeftWidth: 1,
    borderLeftColor: theme.border,
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(75, 86, 233, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14, // Creates comfortable breathing room between the buttons
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(75, 86, 233, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.text,
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 15,
    color: theme.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 40,
  },
  addFirstBtn: {
    backgroundColor: brandColor,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: brandColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addFirstBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});