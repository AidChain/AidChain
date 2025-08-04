import NavBar from '@/components/NavBar';

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-black text-white">
      {/* Add NavBar at the top */}
      <NavBar />
      
      <div className="container mx-auto px-4 py-20">
        <div className="text-center">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-teal-200 to-blue-500 bg-clip-text text-transparent mb-8">
            Welcome to AidChain
          </h1>
          <p className="text-xl text-slate-300 mb-12">
            Your transparent donation platform is ready
          </p>
          
          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8">
              <h3 className="text-2xl font-semibold mb-4">Donate</h3>
              <p className="text-slate-300">Send crypto donations directly to those in need</p>
            </div>
            
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8">
              <h3 className="text-2xl font-semibold mb-4">Track</h3>
              <p className="text-slate-300">Monitor your donations with blockchain transparency</p>
            </div>
            
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8">
              <h3 className="text-2xl font-semibold mb-4">Impact</h3>
              <p className="text-slate-300">See the real-world impact of your contributions</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}