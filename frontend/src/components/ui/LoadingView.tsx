import React from 'react';

interface LoadingViewProps {
  message?: string;
  minHeight?: string;
}

export function LoadingView({ message = 'Cargando...', minHeight = '400px' }: LoadingViewProps) {
  return (
    <div 
      className="flex flex-col items-center justify-center w-full py-20"
      style={{ minHeight }}
    >
      <div className="relative">
        {/* Spinner animado principal */}
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-100 border-t-pink-500"></div>
        
        {/* Efecto de pulso en el fondo */}
        <div className="absolute inset-0 animate-ping rounded-full h-12 w-12 border-2 border-pink-500/20"></div>
      </div>
      
      <p className="mt-4 text-gray-500 font-medium animate-pulse tracking-wide">
        {message}
      </p>
    </div>
  );
}
