interface SideMenuItemProps {
  icon: React.ReactNode;
  label: string; 
  isActive: boolean;
  onClick?: () => void;
}

export default function SideMenuItem({ 
  icon,
  label, 
  isActive, 
  onClick }: SideMenuItemProps) {

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-lg transition-all duration-200 hover:cursor-pointer relative ${
        isActive 
          ? 'text-white bg-gradient-to-r from-teal-200 to-blue-500 shadow-xl shadow-blue-500/50' 
          : 'text-slate-300 hover:text-white'
      }`}
    >
      <div>
        {icon}
      </div>
      <span className="font-medium">{label}</span>
    </button>
  );
};