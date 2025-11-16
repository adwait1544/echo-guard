import React from 'react';

const AudioLogo = ({ className }: { className?: string }) => {
  return (
    <div className={`flex items-center ${className}`}>
      <img 
        src="Audio.png" 
        alt="Audio Logo" 
        className="h-8 md:h-10"
      />
    </div>
  );
};

export default AudioLogo;
