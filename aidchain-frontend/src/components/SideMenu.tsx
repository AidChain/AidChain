import { LogoutOutlined, GiftOutlined, HeartOutlined, FileTextOutlined } from '@ant-design/icons';
import { useZkLogin } from '@/providers/ZkLoginProvider';
import { useRouter } from 'next/navigation';
import logo from '@/assets/logo.svg';
import Image from 'next/image';
import SideMenuItem from './SideMenuItem';

interface SideMenuProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export default function SideMenu({ 
  activeTab, 
  onTabChange
}: SideMenuProps) {
  const router = useRouter();
  
  const mainMenuItems = [
    { id: 'donor', icon: <GiftOutlined />, label: 'Donor' },
    { id: 'recipient', icon: <HeartOutlined />, label: 'Recipient' },
    { id: 'documentation', icon: <FileTextOutlined />, label: 'Documentation' },
  ];

  const bottomMenuItems = [
    { id: 'logout', icon: <LogoutOutlined />, label: 'Logout' },
  ];

  const { 
    logout
  } = useZkLogin();

  const handleMenuClick = (itemId: string): void => {
    if (itemId === 'documentation') {
      window.open('https://github.com/AidChain', '_blank');
    }
    else if (itemId === 'logout') {
      // Handle logout logic here
      logout(); // Your existing logout function
      router.push('/'); // Redirect to landing page
    }
    else {
      onTabChange(itemId);
    }
  };

  return (
    <div className="w-64 bg-black/10 backdrop-blur-md border border-white/20 h-full flex flex-col shadow-xl border-r">
      {/* Logo */}
      <div className="p-6 mb-6 border-b border-gray-800">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 flex items-center justify-center">
            <Image src={logo} alt="logo" width={80} />
          </div>
          <span className="text-white font-medium text-xl sm:text-2xl tracking-widest">AIDCHAIN</span>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-4 space-y-2">
        {mainMenuItems.map((item) => (
          <SideMenuItem
            key={item.id}
            icon={item.icon}
            label={item.label}
            isActive={activeTab === item.id}
            onClick={() => handleMenuClick(item.id)}
          />
        ))}
      </nav>

      {/* Bottom Navigation */}
      <div className="p-4 border-t border-gray-800 space-y-2">
        {bottomMenuItems.map((item) => (
          <SideMenuItem
            key={item.id}
            icon={item.icon}
            label={item.label}
            isActive={activeTab === item.id}
            onClick={() => handleMenuClick(item.id)}
          />
        ))}
      </div>
    </div>
  );
};