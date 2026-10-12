import React, { createContext, useContext, useEffect, useState } from 'react'
import { DEFAULT_OPS_SETTINGS, computeCartMoney, type ShippingSettings } from '../lib/opsSettings'
import { useStorefrontIdentity } from './StorefrontIdentityContext'

interface CartItem {
  id: string
  name: string
  price: number
  image: string
  quantity: number
  location: 'Pakistan' | 'UAE'
  delivery_charge: number
  currency: 'PKR' | 'AED'
}

type AddToCartInput = {
  id: string
  name: string
  price: number
  image: string
  location?: 'Pakistan' | 'UAE'
  delivery_charge?: number
  currency?: 'PKR' | 'AED'
  quantity?: number
}

interface CartContextType {
  items: CartItem[]
  addToCart: (product: AddToCartInput) => void
  removeFromCart: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  replaceItems: (next: CartItem[]) => void
  clearCart: () => void
  totalItems: number
  totalPriceByCurrency: { PKR: number; AED: number }
  deliveryChargesByCurrency: { PKR: number; AED: number }
  grandTotalByCurrency: { PKR: number; AED: number }
  shipping: ShippingSettings
  isCartOpen: boolean
  setIsCartOpen: (open: boolean) => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { ops } = useStorefrontIdentity()
  const shipping = ops?.shipping ?? DEFAULT_OPS_SETTINGS.shipping

  const [items, setItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('cart')
    return saved ? JSON.parse(saved) : []
  })
  const [isCartOpen, setIsCartOpen] = useState(false)

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items))
  }, [items])

  const addToCart = (product: AddToCartInput) => {
    const qty = Math.max(1, product.quantity ?? 1)
    setItems((prev) => {
      const existing = prev.find((item) => item.id === product.id)
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + qty } : item,
        )
      }
      const newItem: CartItem = {
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity: qty,
        location: product.location || 'UAE',
        delivery_charge: product.delivery_charge || 0,
        currency: product.currency || 'AED',
      }
      return [...prev, newItem]
    })
  }

  const removeFromCart = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id)
      return
    }
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, quantity } : item)))
  }

  const replaceItems = (next: CartItem[]) => {
    setItems(next)
  }

  const clearCart = () => {
    setItems([])
  }

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)

  const money = computeCartMoney(items, shipping)

  const value: CartContextType = {
    items,
    addToCart,
    removeFromCart,
    updateQuantity,
    replaceItems,
    clearCart,
    totalItems,
    totalPriceByCurrency: money.subtotal,
    deliveryChargesByCurrency: money.delivery,
    grandTotalByCurrency: money.grandTotal,
    shipping,
    isCartOpen,
    setIsCartOpen,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
