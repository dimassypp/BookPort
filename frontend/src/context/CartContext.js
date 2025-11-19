// CartContext.js
import React, { createContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]); // Ubah dari cartItems ke cart
  const [cartItems, setCartItems] = useState([]); // Tetap ada untuk backward compatibility

  // Load keranjang dari localStorage saat awal
  useEffect(() => {
    const storedCart = localStorage.getItem('cart');
    if (storedCart) {
      const parsedCart = JSON.parse(storedCart);
      setCart(parsedCart);
      setCartItems(parsedCart);
    }
  }, []);

  // Simpan keranjang ke localStorage setiap kali berubah
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
    setCartItems(cart); // Sync keduanya
  }, [cart]);

  const addItemToCart = (buku, jumlah = 1) => {
    setCart(prevCart => {
      const itemExists = prevCart.find(item => item.buku_id === buku.id);

      if (itemExists) {
        // Update jumlah
        return prevCart.map(item =>
          item.buku_id === buku.id 
            ? { ...item, jumlah: item.jumlah + jumlah } 
            : item
        );
      } else {
        // Tambah item baru
        return [...prevCart, { 
          buku_id: buku.id, 
          nama: buku.judul, 
          harga: buku.harga, 
          jumlah: jumlah, 
          gambar: buku.gambar_url,
          // Tambahan untuk compatibility dengan HomePage
          id: buku.id,
          judul: buku.judul,
          gambar_url: buku.gambar_url,
          quantity: jumlah
        }];
      }
    });
  };

  const removeItemFromCart = (buku_id) => {
    setCart(prevCart => prevCart.filter(item => item.buku_id !== buku_id));
  };

  const updateItemQuantity = (buku_id, jumlah) => {
    if (jumlah <= 0) {
      removeItemFromCart(buku_id);
    } else {
      setCart(prevCart => prevCart.map(item =>
        item.buku_id === buku_id ? { ...item, jumlah: jumlah, quantity: jumlah } : item
      ));
    }
  };

  const clearCart = () => {
    setCart([]);
  };

  return (
    <CartContext.Provider value={{ 
      cart,           // Untuk Navbar
      cartItems,      // Untuk CartPage
      addItemToCart, 
      removeItemFromCart, 
      updateItemQuantity, 
      clearCart 
    }}>
      {children}
    </CartContext.Provider>
  );
};

export default CartContext;