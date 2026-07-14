import Hero from '../components/Hero'
import ProblemSection from '../components/ProblemSection'
import HowItWorks from '../components/HowItWorks'
import WaitlistForm from '../components/WaitlistForm'
import Footer from '../components/Footer'
import Navbar from '../components/Navbar'
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg">
      <Navbar />
      <Hero />
      <ProblemSection />
      <HowItWorks />
      <WaitlistForm />
      <Footer />
    </div>
  )
}
