import { MessageCircle } from 'lucide-react'

export default function WhatsAppButton() {
  const phoneNumber = '+971501234567' // Replace with your business WhatsApp number
  const message = 'Hi! I have a question about CareCraftz products.'
  
  const handleClick = () => {
    const encodedMessage = encodeURIComponent(message)
    window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, '_blank')
  }

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-green-500 text-white rounded-full shadow-lg hover:scale-110 hover:shadow-xl transition-all duration-300 flex items-center justify-center group"
      aria-label="Chat on WhatsApp"
    >
      <MessageCircle className="w-7 h-7 group-hover:animate-pulse" />
      
      {/* Tooltip */}
      <span className="absolute right-full mr-3 bg-gray-800 text-white text-sm px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap pointer-events-none">
        Chat with us
      </span>
    </button>
  )
}
