import { useNavigate } from 'react-router-dom'
import { Recycle, Leaf, Droplets, ArrowRight } from 'lucide-react'
import PageFrame from '../components/PageFrame'

function RefillInner() {
  const navigate = useNavigate()

  const steps = [
    {
      icon: <Recycle className="w-8 h-8" />,
      title: 'Return Your Empty',
      desc: 'Bring back your empty CareCraftz bottles to any of our refill stations or mail them back to us.',
      color: 'bg-[#e8f5e9]'
    },
    {
      icon: <Droplets className="w-8 h-8" />,
      title: 'Refill Fresh',
      desc: 'We sanitize and refill your bottles with your favorite formulas at a fraction of the cost.',
      color: 'bg-[#e3f2fd]'
    },
    {
      icon: <Leaf className="w-8 h-8" />,
      title: 'Repeat & Save',
      desc: 'Every refill saves you money and keeps plastic out of landfills. Good for you, good for the planet.',
      color: 'bg-[#fce4ec]'
    }
  ]

  const benefits = [
    'Up to 40% savings on every refill',
    'Zero single-use plastic waste',
    'Same premium quality, less packaging',
    'Free refill pouch with first purchase',
    'Convenient drop-off locations',
    'Earn loyalty points on every refill'
  ]

  return (
    <div className="pt-24 pb-16 px-4 sm:px-8 lg:px-12 max-w-7xl mx-auto">

      {/* Hero section */}
      <div className="text-center mb-16">
        <h1 className="text-5xl md:text-6xl font-light text-[#2b2b2b] mb-4">Refill. Reuse. Rejoice.</h1>
        <p className="text-[#696a67] text-lg max-w-2xl mx-auto leading-relaxed">
          Our refill program cuts waste and saves you money. Because good skin shouldn't cost the earth.
        </p>
      </div>

      {/* How it works */}
      <section className="mb-20">
        <h2 className="text-3xl font-semibold text-[#2b2b2b] mb-10 text-center">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((step, i) => (
            <div key={i} className={`${step.color} rounded-2xl p-8 flex flex-col items-center text-center`}>
              <div className="w-16 h-16 rounded-full bg-white shadow-md flex items-center justify-center text-[#2b2b2b] mb-6">
                {step.icon}
              </div>
              <h3 className="text-xl font-semibold text-[#2b2b2b] mb-3">{step.title}</h3>
              <p className="text-[#696a67] text-sm leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits */}
      <section className="mb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-3xl font-semibold text-[#2b2b2b] mb-6">Why Refill?</h2>
            <ul className="space-y-4">
              {benefits.map((benefit, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#8DEBD1] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-[#2b2b2b] text-xs font-bold">✓</span>
                  </div>
                  <span className="text-[#2b2b2b]">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-[#F4956A] rounded-3xl p-8 flex flex-col justify-center items-center text-center">
            <p className="text-white text-lg mb-6 font-medium">Ready to start your refill journey?</p>
            <button
              onClick={() => navigate('/shop')}
              className="bg-white text-[#2b2b2b] px-8 py-3 rounded-full font-semibold hover:bg-white/90 transition-colors flex items-center gap-2"
            >
              Shop Refillable Products <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-[#fbfcf4] rounded-3xl p-8 md:p-12 mb-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-4xl md:text-5xl font-light text-[#2b2b2b] mb-2">10K+</div>
            <div className="text-[#696a67] text-sm">Bottles Refilled</div>
          </div>
          <div>
            <div className="text-4xl md:text-5xl font-light text-[#2b2b2b] mb-2">2.5T</div>
            <div className="text-[#696a67] text-sm">Plastic Saved</div>
          </div>
          <div>
            <div className="text-4xl md:text-5xl font-light text-[#2b2b2b] mb-2">40%</div>
            <div className="text-[#696a67] text-sm">Average Savings</div>
          </div>
          <div>
            <div className="text-4xl md:text-5xl font-light text-[#2b2b2b] mb-2">12</div>
            <div className="text-[#696a67] text-sm">Refill Stations</div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="text-center">
        <h2 className="text-3xl font-semibold text-[#2b2b2b] mb-4">Join the Refill Revolution</h2>
        <p className="text-[#696a67] mb-8 max-w-xl mx-auto">
          Every refill is a step toward a cleaner planet. Start making a difference today.
        </p>
        <button
          onClick={() => navigate('/shop')}
          className="bg-[#2b2b2b] text-white px-10 py-4 rounded-full font-semibold hover:bg-black transition-colors"
        >
          Shop Refillable Products
        </button>
      </section>

    </div>
  )
}

export default function Refill() {
  return (
    <PageFrame frameColor="#F4956A" showFooter={true}>
      <RefillInner />
    </PageFrame>
  )
}
