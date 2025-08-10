import NavBar from '../../components/NavBar';
import Hero from './components/Hero';
import WhyAidChain from './components/WhyAidChain';
import GlobalDonationTracker from './components/GlobalDonationTracker';
import HowItWorks from './components/HowItWorks';
import Footer from './components/Footer';
import Providers from '@/providers/Providers';

// create landing page
export default function Landing() {
    return <main>
        <Providers>
            <NavBar />
            <Hero />
            <GlobalDonationTracker />
            <WhyAidChain />
            <HowItWorks />
            <Footer />
        </Providers>
    </main>
}