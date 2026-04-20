import React from 'react';

const Header = () => {
  return (
    <header className="border-b border-slate-100 bg-white sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white font-bold">
            +
          </div>
          <span className="text-xl font-bold tracking-tight">e-Apteczka</span>
        </div>
      </div>
    </header>
  );
};

export default Header;