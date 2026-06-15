import { Plus } from 'lucide-react'
import { useCart } from '../contexts/CartContext'

interface Product {
  id: string
  name: string
  subtitle: string
  price: number
  currency: 'PKR' | 'AED'
  image: string
  bgColor: string
  shadowColor: string
}

interface ProductCardProps {
  product: Product
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart()

  const formatPrice = (price: number, currency: 'PKR' | 'AED') => {
    if (currency === 'PKR') {
      return `From ₨${price.toLocaleString()}`
    }
    return `From $${price.toFixed(2)} USD`
  }

  return (
    <div 
      className="relative rounded-3xl p-6 flex flex-col items-center transition-transform hover:scale-[1.02]"
      style={{ 
        backgroundColor: product.bgColor,
        boxShadow: `6px 6px 0px ${product.shadowColor}`
      }}
    >
      {/* Plus Button */}
      <button 
        onClick={() => addToCart({
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
          currency: product.currency,
          location: product.currency === 'PKR' ? 'Pakistan' : 'UAE',
          delivery_charge: product.currency === 'PKR' ? 200 : 15
        })}
        className="absolute top-4 left-4 w-8 h-8 flex items-center justify-center text-[#2b2b2b] hover:bg-white/30 rounded-full transition-colors"
      >
        <Plus className="w-5 h-5" />
      </button>

      {/* Product Image */}
      <div className="w-full aspect-square flex items-center justify-center mb-4">
        <img 
          src={product.image} 
          alt={product.name}
          className="max-w-full max-h-full object-contain drop-shadow-lg"
        />
      </div>

      {/* Product Info */}
      <div className="text-center mt-auto">
        <h3 className="font-semibold text-[#2b2b2b] text-lg">{product.name}</h3>
        <p className="text-[#2b2b2b]/70 text-sm italic mb-2">{product.subtitle}</p>
        <p className="text-[#2b2b2b] font-medium text-sm">
          {formatPrice(product.price, product.currency)}
        </p>
      </div>
    </div>
  )
}
