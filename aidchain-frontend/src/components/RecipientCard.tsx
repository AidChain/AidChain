import Image from 'next/image';

interface RecipientCardProps {
  id: string;
  recipient: string;
  image?: string;
}

export default function RecipientCard({
    id,
    recipient,
    image
  }:RecipientCardProps) {
  return (
    <>
      <div className="w-full mx-auto">
        {/* Frosted Glass Card */}
        <div className="cursor-pointer relative bg-white/10 backdrop-blur-lg border border-blue-400/40 rounded-2xl px-6 py-4 hover:shadow-md
        hover:shadow-blue-700/50 transition-all duration-300 ease-in-out">
          {/* Gradient overlay for extra glass effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/30 to-transparent rounded-2xl pointer-events-none" />
          
          <div className="relative z-10">
            {/* Profile Section */}
            <div className="flex items-center justify-between w-full">
              {/* Profile Picture */}
              <div className="flex items-center gap-2">
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/30">
                  <Image
                    src="https://picsum.photos/200"
                    alt="Profile Picture"
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-white/90 text-lg font-mono px-3 py-1 rounded-lg">
                    Test Recipient Name
                </span>
                </div>
              </div>
            </div>
          </div>  
        </div>  
    </>
  );
}