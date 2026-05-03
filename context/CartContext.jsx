// context/CartContext.jsx
"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

const CartContext = createContext(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const loadCart = () => {
      const savedCart = localStorage.getItem("cart");
      if (savedCart) {
        try {
          const parsedCart = JSON.parse(savedCart);
          setCartItems(parsedCart);
        } catch (error) {
          console.error("Error loading cart from localStorage:", error);
        }
      }
      setIsInitialized(true);
    };
    
    loadCart();
  }, []);

  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem("cart", JSON.stringify(cartItems));
    }
  }, [cartItems, isInitialized]);

  const addToCart = useCallback((product, quantity) => {
    setCartItems((prevItems) => {
      const existingItem = prevItems.find((item) => item._id === product._id);

      if (existingItem) {
        return prevItems.map((item) =>
          item._id === product._id
            ? {
                ...item,
                selectedQuantity: Math.min(
                  item.selectedQuantity + quantity,
                  item.maxQuantity
                ),
              }
            : item
        );
      }

      const newItem = {
        _id: product._id,
        name: product.name,
        slug: product.slug,
        sellingPrice: product.sellingPrice,
        originalPrice: product.originalPrice,
        quantity: product.quantity,
        selectedQuantity: Math.min(quantity, product.quantity),
        SKU: product.SKU,
        photos: product.photos,
        colors: product.colors,
        inventory: product.inventory || "",
        category: product.category || "",
        maxQuantity: product.quantity,
      };

      return [...prevItems, newItem];
    });
  }, []);

  const removeFromCart = useCallback((productId) => {
    setCartItems((prevItems) => prevItems.filter((item) => item._id !== productId));
  }, []);

  const updateQuantity = useCallback((productId, quantity) => {
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item._id === productId
          ? {
              ...item,
              selectedQuantity: Math.min(Math.max(1, quantity), item.maxQuantity),
            }
          : item
      )
    );
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  const getCartTotal = useCallback(() => {
    return cartItems.reduce(
      (total, item) => total + item.sellingPrice * item.selectedQuantity,
      0
    );
  }, [cartItems]);

  const getCartCount = useCallback(() => {
    return cartItems.reduce((count, item) => count + item.selectedQuantity, 0);
  }, [cartItems]);

  const isInCart = useCallback((productId) => {
    return cartItems.some((item) => item._id === productId);
  }, [cartItems]);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartTotal,
        getCartCount,
        isInCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};