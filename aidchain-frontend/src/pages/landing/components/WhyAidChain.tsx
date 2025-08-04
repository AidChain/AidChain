import AnimatedContent from "@/components/AnimatedContent"
import SpotlightCard from "@/components/SpotlightCard"

export default function WhyAidChain() {
    return <AnimatedContent>
            <section id="why-aidchain" className="relative flex flex-col justify-start items-center w-screen gap-12 mb-[8rem]">
                <div className="flex flex-col justify-start items-center gap-4">
                    <h1 className="w-[80vw] text-center text-4xl sm:text-6xl font-bold bg-gradient-to-r from-teal-200 to-blue-500 py-2 bg-clip-text text-transparent">
                        Why AidChain?
                    </h1>  
                    <p className="w-[75vw] text-center text-slate-300 text-lg sm:text-xl">We believe giving should be direct, transparent, and truly impactful. Here’s how we’re different.</p>
                </div>
                <div className="flex flex-col lg:flex-row gap-4 w-[80vw]">
                    <SpotlightCard className="custom-spotlight-card" spotlightColor="rgba(29, 78, 216, 0.3)">
                        <div className="flex flex-col gap-8">
                            <h2 className="text-3xl sm:text-4xl font-semibold">100% Direct, No Hidden Fees</h2>
                            <p className="text-slate-300 text-md sm:text-lg">Every donation goes straight to the people who need it most - either to individuals with access, or through trusted local partners. No platform cuts. No middlemen.</p>
                        </div>
                    </SpotlightCard>
                    <SpotlightCard className="custom-spotlight-card" spotlightColor="rgba(29, 78, 216, 0.3)">
                        <div className="flex flex-col gap-8">
                            <h2 className="text-3xl sm:text-4xl font-semibold">Transparent and Traceable</h2>
                            <p className="text-slate-300 text-md sm:text-lg">Track how your donation is spent in real time through blockchain explorers like The Graph and Blockscout. We don’t just promise transparency - we prove it.</p>
                        </div>
                    </SpotlightCard>
                    <SpotlightCard className="custom-spotlight-card" spotlightColor="rgba(29, 78, 216, 0.3)">
                        <div className="flex flex-col gap-8">
                            <h2 className="text-3xl sm:text-4xl font-semibold">Smart and Secure Giving</h2>
                            <p className="text-slate-300 text-md sm:text-lg">Spending limits and usage restrictions ensure funds are used responsibly. Even recipients without digital access are supported through verified organizations - all managed by secure smart contracts on the SUI blockchain.</p>
                        </div>
                    </SpotlightCard>
                </div>
            </section>
        </AnimatedContent>
}