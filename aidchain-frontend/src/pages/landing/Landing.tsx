import NavBar from '../../components/NavBar';
import Hero from './components/Hero';
import WhyAidChain from './components/WhyAidChain';
import HowItWorks from './components/HowItWorks';
import Footer from './components/Footer';

// create landing page
export default function Landing() {
    return <main>
        <NavBar />
        <Hero />
        <WhyAidChain />
        <HowItWorks />
        <Footer />
    </main>
}