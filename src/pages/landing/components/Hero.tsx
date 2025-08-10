'use client'

import DarkVeil from '../../../components/HeroBackground';
import { WalletButton } from '@/components/WalletButton';

// create landing page
export default function Hero() {
    return <section id="home" className="relative flex justify-center items-center h-screen w-screen mb-[8rem]">
            <div className="absolute inset-0 z-10">
                <DarkVeil />
            </div>
            <div className="mt-[12rem] md:mt-[8rem] lg:mt-[4rem] relative z-20 flex flex-col items-center text-center gap-12">
                <div className="flex flex-col items-center gap-4 w-[80vw]">
                    <h1 className="text-5xl sm:text-7xl font-bold bg-gradient-to-r from-teal-200 to-blue-500 py-2 bg-clip-text text-transparent">
                        Empowering the Less Fortunate.
                    </h1>              
                    <h2 className="text-white text-4xl sm:text-6xl font-semibold">With Blockchain. For Good.</h2>
                </div>
                <p className="w-[75vw] text-slate-300 text:lg sm:text-xl">A transparent donation platform where 100% of your crypto goes directly to the needy — either directly or through trusted local organizations when individuals lack access.</p>
                <WalletButton variant="donate" size='xl'/>
            </div>
        </section>
}