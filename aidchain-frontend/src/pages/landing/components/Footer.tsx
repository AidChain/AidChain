'use client'

import AnimatedContent from "@/components/AnimatedContent"
import Image from "next/image";
import suiLogo from "@/assets/sui-logo.svg"; 
import bgaLogo from "@/assets/BGA-Logo-Primary-Rev.png"; 
import theGraphLogo from "@/assets/TheGraph-Logo-Light.svg"; 
import cnbLogo from "@/assets/CNB-Logomark-White.png"; 
import googleLogo from "@/assets/google-white-logo.png";
import logo from "@/assets/logo.svg";
import { XOutlined, LinkedinOutlined, InstagramOutlined, DiscordOutlined } from '@ant-design/icons';
import GradientBorderButton from "@/components/GradientBorderButton";
import { useRouter } from 'next/navigation';

export default function Footer() {
    const router = useRouter();
    
    const scrollToSection = (sectionId: string) => {
    // Check if we're on the landing page
    if (window.location.pathname === '/') {
      // If on landing page, scroll to section
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }
    } else {
      // If on another page (like dashboard), redirect to landing page with section
      router.push(`/#${sectionId}`);
    }
  };

    const logos = [
        {
            logo: suiLogo,
            logoAlt: "Sui Logo"
        },
        {
            logo: bgaLogo,
            logoAlt: "Blockchain For Good Alliance Logo"
        },
        {
            logo: theGraphLogo,
            logoAlt: "The Graph Logo"
        },
        {
            logo: cnbLogo,
            logoAlt: "Chat and Build Logo"
        },
        {
            logo: googleLogo,
            logoAlt: "Google Logo"
        }
    ];

    const links = [
        {
            pageName: "Home",
            link: "home"
        },
        {
            pageName: "Terms of Use",
            link: ""
        },
        {
            pageName: "Privacy Policy",
            link: ""
        }
    ];

    const contacts = [
        {
            logo: <XOutlined />,
            link: ""
        },
        {
            logo: <LinkedinOutlined />,
            link: ""
        },
        {
            logo: <InstagramOutlined />,
            link: ""
        },
        {
            logo: <DiscordOutlined />,
            link: ""
        }
    ]

    return <AnimatedContent>
        <section 
            id="footer" 
            className="relative flex flex-col justify-start items-center w-screen gap-12 pb-[4rem]" 
        >
            <div className="flex flex-col justify-center items-center gap-[2rem] w-screen min-h-[70vh] mb-[4rem]"
            style={{
                backgroundImage: "url('/background.jpg')", // Path from public folder
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
            }}>
                <h1 className="text-center text-2xl sm:text-3xl font-bold py-2 bg-clip-text text-white">
                    Powered By
                </h1>  
                <div className="flex flex-col sm:flex-row flex-wrap justify-center items-center gap-[4rem] sm:gap-[8rem] w-[80vw]">
                    {
                        logos.map((item, index) =>
                            <Image key={index} src={item.logo} alt={item.logoAlt} height={48} fill={false}/>
                        )
                    }
                </div>
            </div>
            <div className="flex flex-col gap-[4rem] md:flex-row w-[80vw] md:gap-[2rem]">
                <div className="flex flex-2 flex-col gap-[2rem] md:gap-[8rem]">
                    <div className="flex items-center gap-2">
                        <div className="w-12 h-12">
                            <Image src={logo} alt="logo" />
                        </div>
                        <span className="text-white font-medium text-xl sm:text-2xl tracking-widest">AIDCHAIN</span>
                    </div>
                    <p className="text-lg text-slate-400">Copyright © 2025 Team ADC. All rights reserved.</p>
                </div>
                <div className="flex flex-1 flex-col gap-4">
                    <h2 className="text-lg sm:text-xl text-blue-500 font-semibold">PAGES</h2>
                    {links.map((item, index) => 
                        <a key={index} className="text-lg text-slate-300 hover:text-white cursor-pointer transition-colors duration-200" onClick={() => {scrollToSection(item.link)}}>
                            {item.pageName}
                        </a>)}
                </div>
                <div className="flex flex-1 flex-col gap-4 h-fill">
                    <h2 className="text-lg sm:text-xl text-blue-500 font-semibold">CONTACT US</h2>
                    <div className="flex w-fit gap-2">
                        {contacts.map((item, index) => 
                            <GradientBorderButton key={index} size="sm" circle={true}>
                                {item.logo}
                            </GradientBorderButton>
                            )
                        }
                    </div>
                </div>
            </div>
        </section>
    </AnimatedContent>
}