import React, { createContext, useContext, useState, useEffect } from 'react'

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

interface CartContextType {
  items: CartItem[]
  addToCart: (product: { id: string; name: string; price: number; image: string; location?: 'Pakistan' | 'UAE'; delivery_charge?: number; currency?: 'PKR' | 'AED' }) => void
  removeFromCart: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  totalItems: number
  totalPriceByCurrency: { PKR: number; AED: number }
  deliveryChargesByCurrency: { PKR: number; AED: number }
  grandTotalByCurrency: { PKR: number; AED: number }
  isCartOpen: boolean
  setIsCartOpen: (open: boolean) => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('cart')
    return saved ? JSON.parse(saved) : []
  })
  const [isCartOpen, setIsCartOpen] = useState(false)

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items))
  }, [items])

  const addToCart = (product: { id: string; name: string; price: number; image: string; location?: 'Pakistan' | 'UAE'; delivery_charge?: number; currency?: 'PKR' | 'AED' }) => {
    setItems(prev => {
      const existing = prev.find(item => item.id === product.id)
      if (existing) {
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      const newItem: CartItem = {
        ...product,
        quantity: 1,
        location: product.location || 'UAE',
        delivery_charge: product.delivery_charge || 0,
        currency: product.currency || 'AED'
      }
      return [...prev, newItem]
    })
  }

  const removeFromCart = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id))
  }

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id)
      return
    }
    setItems(prev =>
      prev.map(item => (item.id === id ? { ...item, quantity } : item))
    )
  }

  const clearCart = () => {
    setItems([])
  }

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  
  // Calculate totals by currency
  const totals = items.reduce(
    (acc, item) => {
      const itemTotal = item.price * item.quantity
      const deliveryTotal = item.delivery_charge * item.quantity
      
      if (item.currency === 'PKR') {
        acc.price.PKR += itemTotal
        acc.delivery.PKR += deliveryTotal
      } else {
        acc.price.AED += itemTotal
        acc.delivery.AED += deliveryTotal
      }
      return acc
    },
    { price: { PKR: 0, AED: 0 }, delivery: { PKR: 0, AED: 0 } }
  )
  
  const totalPriceByCurrency = totals.price
  const deliveryChargesByCurrency = totals.delivery
  const grandTotalByCurrency = {
    PKR: totals.price.PKR + totals.delivery.PKR,
    AED: totals.price.AED + totals.delivery.AED
  }

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        totalPriceByCurrency,
        deliveryChargesByCurrency,
        grandTotalByCurrency,
        isCartOpen,
        setIsCartOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
