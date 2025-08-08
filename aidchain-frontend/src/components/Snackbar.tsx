import React, { useState, useEffect } from 'react';
import { CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon, InformationCircleIcon, XMarkIcon } from '@heroicons/react/24/solid';

interface SnackbarProps {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
  position?: 'top' | 'bottom';
}

const Snackbar: React.FC<SnackbarProps> = ({
  message,
  type = 'info',
  isVisible,
  onClose,
  duration = 4000,
  position = 'bottom'
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      return () => clearTimeout(timer);
    } else {
      setIsAnimating(false);
    }
  }, [isVisible, duration]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      onClose();
    }, 300); // Match the exit animation duration
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="w-5 h-5 text-green-400" />;
      case 'error':
        return <XCircleIcon className="w-5 h-5 text-red-400" />;
      case 'warning':
        return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-400" />;
      case 'info':
      default:
        return <InformationCircleIcon className="w-5 h-5 text-blue-400" />;
    }
  };

  const getColorClasses = () => {
    switch (type) {
      case 'success':
        return 'border-green-500/30 bg-green-900/20';
      case 'error':
        return 'border-red-500/30 bg-red-900/20';
      case 'warning':
        return 'border-yellow-500/30 bg-yellow-900/20';
      case 'info':
      default:
        return 'border-blue-500/30 bg-blue-900/20';
    }
  };

  if (!isVisible) return null;

  return (
    <div 
      className={`fixed left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 ease-in-out ${
        position === 'top' ? 'top-4' : 'bottom-4'
      } ${
        isAnimating 
          ? `opacity-100 ${position === 'top' ? 'translate-y-0' : 'translate-y-0'} scale-100` 
          : `opacity-0 ${position === 'top' ? '-translate-y-4' : 'translate-y-4'} scale-95`
      }`}
    >
      <div className={`
        min-w-80 max-w-md mx-4 p-4 rounded-xl shadow-2xl backdrop-blur-md border
        bg-gray-800/90 text-white border-gray-700/50 ${getColorClasses()}
        transform transition-all duration-300 ease-out
      `}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getIcon()}
            <p className="text-sm font-medium text-gray-100 flex-1">
              {message}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="ml-3 p-1 rounded-full hover:bg-white/10 transition-colors duration-200 flex-shrink-0"
          >
            <XMarkIcon className="w-4 h-4 text-gray-400 hover:text-gray-200" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Demo component to showcase the snackbar
const SnackbarDemo: React.FC = () => {
  const [snackbars, setSnackbars] = useState<Array<{
    id: number;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    isVisible: boolean;
  }>>([]);

  const showSnackbar = (message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    const id = Date.now();
    setSnackbars(prev => [...prev, { id, message, type, isVisible: true }]);
  };

  const closeSnackbar = (id: number) => {
    setSnackbars(prev => prev.filter(snackbar => snackbar.id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-md mx-auto space-y-4">
        <h1 className="text-2xl font-bold text-white mb-8 text-center">
          Dark Theme Snackbar Demo
        </h1>
        
        <div className="space-y-3">
          <button
            onClick={() => showSnackbar('Success! Your action was completed.', 'success')}
            className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors duration-200"
          >
            Show Success Snackbar
          </button>
          
          <button
            onClick={() => showSnackbar('Error! Something went wrong.', 'error')}
            className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors duration-200"
          >
            Show Error Snackbar
          </button>
          
          <button
            onClick={() => showSnackbar('Warning! Please check your input.', 'warning')}
            className="w-full px-4 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium transition-colors duration-200"
          >
            Show Warning Snackbar
          </button>
          
          <button
            onClick={() => showSnackbar('Info: Here\'s some helpful information.', 'info')}
            className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200"
          >
            Show Info Snackbar
          </button>
        </div>

        <div className="mt-8 p-4 bg-gray-800 rounded-lg">
          <h3 className="text-white font-medium mb-2">Features:</h3>
          <ul className="text-gray-300 text-sm space-y-1">
            <li>• Smooth enter/exit animations</li>
            <li>• Auto-dismiss after 4 seconds</li>
            <li>• Manual close button</li>
            <li>• Multiple types with icons</li>
            <li>• Glassmorphism dark theme</li>
            <li>• Responsive design</li>
          </ul>
        </div>
      </div>

      {/* Render all active snackbars */}
      {snackbars.map((snackbar, index) => (
        <div
          key={snackbar.id}
          style={{
            transform: `translateY(${index * -70}px)` // Stack multiple snackbars
          }}
        >
          <Snackbar
            message={snackbar.message}
            type={snackbar.type}
            isVisible={snackbar.isVisible}
            onClose={() => closeSnackbar(snackbar.id)}
            position="bottom"
          />
        </div>
      ))}
    </div>
  );
};

export default Snackbar;