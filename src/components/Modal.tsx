'use client'

import { CloseOutlined } from '@ant-design/icons';
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

interface ModalProps {
  children: React.ReactNode;
  header: string;
  isOpen: boolean;
  onClose: () => void
}

export default function Modal({ children, header, isOpen, onClose }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Animate modal in
      gsap.fromTo(overlayRef.current, 
        { opacity: 0 },
        { opacity: 1, duration: 0.2, ease: "power2.out" }
      );
      gsap.fromTo(modalRef.current,
        { scale: 0.8, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.3, ease: "back.out(1.7)" }
      );
    }
  }, [isOpen]);

  const handleClose = () => {
    // Animate modal out
    gsap.to(overlayRef.current, {
      opacity: 0,
      duration: 0.2,
      ease: "power2.in"
    });
    gsap.to(modalRef.current, {
      scale: 0.8,
      opacity: 0,
      duration: 0.2,
      ease: "power2.in",
      onComplete: onClose
    });
  };

  if (!isOpen) return null;

  return (
    <div 
      ref={overlayRef}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div 
        ref={modalRef}
        className="bg-black backdrop-blur-lg border border-white/20 rounded-2xl p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-white">{header}</h3>
          <button
            onClick={handleClose}
            className="cursor-pointer p-2 hover:bg-white/10 rounded-full transition-colors duration-200"
          >
            <CloseOutlined 
              className="text-white/70 hover:text-white px-1 py-1"
              style={{ fontSize: '20px' }}
            />
          </button>
        </div>

        <div className="text-center space-y-4">
          {children}
        </div>
      </div>
    </div>
  );
}