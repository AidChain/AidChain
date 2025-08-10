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
      logout();
      router.push('/');
    }
    else {
      onTabChange(itemId);
    }
  };

  return (
    <>
      {/* Desktop Side Menu */}
      <div className="hidden md:flex fixed w-64 bg-black/10 backdrop-blur-md border-white/20 h-screen lg:h-full flex-col shadow-xl border-r">
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

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
        <div className="bg-black/10 backdrop-blur-md border border-white/20 border-t">
          <div className="flex items-center justify-around px-4 py-2">
            {mainMenuItems.slice(0, 4).map((item) => (
              <button
                key={item.id}
                onClick={() => handleMenuClick(item.id)}
                className={`cursor-pointer flex flex-1 flex-col items-center justify-center p-3 rounded-2xl transition-all duration-200 ${
                  activeTab === item.id
                    ? 'text-white bg-gradient-to-r from-teal-200 to-blue-500 shadow-xl shadow-blue-500/50' 
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <div className="text-lg mb-1">
                  {item.icon}
                </div>
                <span className="text-xs font-medium truncate">
                  {item.label}
                </span>
              </button>
            ))}
            
            {/* Logout button for mobile */}
            <button
              onClick={() => handleMenuClick('logout')}
              className="cursor-pointer flex flex-1 flex-col items-center justify-center p-3 rounded-2xl transition-all duration-200 min-w-0 text-slate-300 hover:text-white'"
            >
              <div className="text-lg mb-1">
                <LogoutOutlined />
              </div>
              <span className="text-xs font-medium truncate">
                Logout
              </span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};