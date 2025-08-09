import AnimatedContent from "@/components/AnimatedContent";
import StepCard from "@/components/StepCard";
import placeholder from "@/assets/food_carefree.webp";
import donate from "@/assets/donate.png";
import spend from "@/assets/spend.png";
import track from "@/assets/track.png";

export default function HowItWorks() {
    const steps = [
        {
            imageOnRight: true,
            label: "STEP ONE",
            title: "Donate",
            description: "Connect your wallet and send funds securely using the SUI blockchain. Donations are processed by a smart contract with no middlemen.",
            imageSrc: donate,
            imageAlt: "Step one image"
        },
        {
            imageOnRight: false,
            label: "STEP TWO",
            title: "Verified Distribution",
            description: "Recipients with mobile or card access receive donations directly. For those without access, trusted organizations in the region receive funds on their behalf and ensure essentials are delivered.",
            imageSrc: placeholder,
            imageAlt: "Step two image"
        },
        {
            imageOnRight: true,
            label: "STEP THREE",
            title: "Spend With Purpose",
            description: "Funds can only be used for essentials such as food, education, and healthcare - either by the recipient using their card or via verified vendor purchases made by partner organizations.",
            imageSrc: spend,
            imageAlt: "Step three image"
        },
        {
            imageOnRight: false,
            label: "STEP FOUR",
            title: "Track Every Cent",
            description: "Every donation and every expense is traceable via The Graph, allowing donors full transparency into where and how funds are used.",
            imageSrc: track,
            imageAlt: "Step four image"
        }
    ]

    const stepCards = () => {
        return <>
        {
            steps.map((item, index) => <AnimatedContent key={index} direction="horizontal" reverse={!item.imageOnRight ? true : false}>
                <StepCard 
                    imageOnRight={item.imageOnRight} 
                    label={item.label}
                    title={item.title} 
                    description={item.description} 
                    imageSrc={item.imageSrc} 
                    imageAlt={item.imageAlt} 
                />
            </AnimatedContent>
            )
        }
        </>
    }

    return <section id="how-it-works" className="flex flex-col justify-start items-center w-screen gap-10 mb-[8rem]">
            <AnimatedContent>
                <h1 className="w-[80vw] text-center text-4xl sm:text-6xl font-bold bg-gradient-to-r from-teal-200 to-blue-500 py-2 bg-clip-text text-transparent">
                    How Your Crypto Donation Changes Lives
                </h1>
            </AnimatedContent>
            <div className="flex flex-col justify-start items-center gap-8 sm:gap-16">
                {steps.map((item, index) => 
                    <AnimatedContent key={index} direction="horizontal" reverse={item.imageOnRight ? true : false}>
                        <StepCard 
                            imageOnRight={item.imageOnRight} 
                            label={item.label}
                            title={item.title} 
                            description={item.description} 
                            imageSrc={item.imageSrc} 
                            imageAlt={item.imageAlt} 
                        />
                    </AnimatedContent>
                )}
            </div>
        </section>
}