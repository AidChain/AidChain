import WalrusTestDashboard from "@/components/WalrusTestDashboard";
import Landing from "@/pages/landing/Landing";
import Image from "next/image";

export default function Home() {
  return (
    <main className="min-h-screen bg-white dark:bg-black">
      {/* <WalrusTestDashboard /> */}
      <Landing />
    </main>
  );
}
