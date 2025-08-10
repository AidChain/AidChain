interface GradientButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  circle?: boolean;
}

interface SizeClasses {
  [key: string]: string;
}

export default function GradientBorderButton({ 
  children, 
  onClick, 
  className = "",
  size = "md",
  disabled = false,
  type = "button",
  circle = false
}: GradientButtonProps) {
  
  const sizeClasses: SizeClasses = circle ? 
  { 
    sm: "px-6 py-6 text-sm",
    md: "px-8 py-8 text-base",
    lg: "px-10 py-10 text-lg",
    xl: "px-12 py-12 text-xl"
  } :
  { 
    sm: "px-12 py-6 text-sm",
    md: "px-20 py-8 text-base",
    lg: "px-24 py-8 text-lg",
    xl: "px-28 py-10 text-xl"
  };

  const handleClick = (): void => {
    if (!disabled && onClick) {
      onClick();
    }
  };

  return (
    <button
      type={type}
      onClick={handleClick}
      disabled={disabled}
      className={`
        relative
        cursor-pointer
        ${sizeClasses[size]}
        w-auto
        text-nowrap
        font-semibold
        text-white
        bg-black
        rounded-full
        transition-all
        duration-300
        ease-in-out
        transform
        hover:scale-105
        hover:shadow-xl
        hover:shadow-blue-500/50
        active:scale-95
        group
        overflow-hidden
        disabled:opacity-50
        disabled:cursor-not-allowed
        disabled:hover:scale-100
        ${className}
      `}
    >
      {/* Gradient Border */}
      <div className={`
        absolute 
        inset-0 
        bg-gradient-to-r 
        from-teal-200 to-blue-500
        rounded-xl 
        p-[2px]
        transition-all
        duration-300
        group-hover:p-[3px]
        ${disabled ? '' : 'group-hover:p-[3px]'}
      `}>
        <div className={`
          w-full
          h-full 
          bg-black 
          rounded-[50px]
          flex 
          items-center 
          justify-center
          transition-all
          duration-300
          ${disabled ? '' : 'group-hover:bg-transparent'}
        `}>
          <span className="relative z-10 transition-all duration-300">
            {children}
          </span>
        </div>
      </div>
      
      {/* Hover Gradient Background */}
      <div className={`
        absolute 
        inset-[2px] 
        bg-gradient-to-r 
        hover:bg-gradient-to-r hover:from-teal-200 hover:to-blue-500
        rounded-[10px]
        opacity-0
        transition-opacity
        duration-300
        ${disabled ? '' : 'group-hover:opacity-100'}
      `} />
    </button>
  );
};