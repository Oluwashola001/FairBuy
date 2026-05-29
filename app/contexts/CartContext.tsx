// app/contexts/CartContext.tsx
import { supabase } from "@/lib/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

export type Product = {
  id: number | string;
  name: string;
  price: number;
  image?: string;
  description?: string;
  quantity?: number;
};

export type ShippingDetails = {
  fullName: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  postalCode: string;
  phone: string;
};

type CartContextType = {
  cart: Product[];
  shipping: ShippingDetails | null;
  addToCart: (product: Product) => void;
  removeFromCart: (id: number | string) => void;
  clearCart: () => void;
  updateQuantity: (id: number | string, qty: number) => void;
  setShipping: (details: ShippingDetails) => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [cart, setCart] = useState<Product[]>([]);
  const [shipping, setShippingState] = useState<ShippingDetails | null>(null);
  
  // CRITICAL: Prevents overwriting the cloud cart with an empty array on app startup
  const [isInitialized, setIsInitialized] = useState(false);

  // Load cart + shipping from Supabase (or fallback to local if logged out)
  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user && user.user_metadata) {
          // User is logged in: Load from Cloud
          if (user.user_metadata.cart) {
            setCart(user.user_metadata.cart);
          }
          if (user.user_metadata.shipping) {
            setShippingState(user.user_metadata.shipping);
          }
        } else {
          // User is a guest: Load from Local Storage
          const storedCart = await AsyncStorage.getItem("cart");
          if (storedCart) setCart(JSON.parse(storedCart));

          const storedShipping = await AsyncStorage.getItem("shipping");
          if (storedShipping) setShippingState(JSON.parse(storedShipping));
        }
      } catch (error) {
        console.error("Error loading cart data:", error);
      } finally {
        setIsInitialized(true); // Data is loaded, safe to allow saves now
      }
    };
    
    loadData();
  }, []);

  // Save cart whenever it changes
  useEffect(() => {
    if (!isInitialized) return; // Don't save on the initial render!

    const saveCart = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Save to Cloud
        await supabase.auth.updateUser({ data: { cart } });
      } else {
        // Save to Local Storage
        AsyncStorage.setItem("cart", JSON.stringify(cart));
      }
    };
    
    saveCart();
  }, [cart, isInitialized]);

  // Save shipping whenever it changes
  useEffect(() => {
    if (!isInitialized) return; // Don't save on the initial render!

    const saveShipping = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Save to Cloud
        await supabase.auth.updateUser({ data: { shipping } });
      } else {
        // Save to Local Storage
        if (shipping) AsyncStorage.setItem("shipping", JSON.stringify(shipping));
      }
    };
    
    saveShipping();
  }, [shipping, isInitialized]);

  // ✅ Add or increment product
  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: (item.quantity || 1) + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  // ✅ Remove product completely
  const removeFromCart = (id: number | string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  // ✅ Update quantity directly
  const updateQuantity = (id: number | string, qty: number) => {
    if (qty < 1) return;
    setCart((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: qty } : item
      )
    );
  };

  // ✅ Clear cart
  const clearCart = () => setCart([]);

  // ✅ Save shipping details
  const setShipping = (details: ShippingDetails) => {
    setShippingState(details);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        shipping,
        addToCart,
        removeFromCart,
        clearCart,
        updateQuantity,
        setShipping,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }
  return context;
};