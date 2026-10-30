import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { User, Settings, LogOut, UserCircle } from 'lucide-react';

const Header = ({ session, onNavigate }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [imie, setImie] = useState('');
  const menuRef = useRef(null);

  useEffect(() => {
    const fetchImie = async () => {
      if (session?.user?.id) {
        const { data } = await supabase
          .from('uzytkownicy')
          .select('imie')
          .eq('id_uzytkownika', session.user.id)
          .single();
        if (data?.imie) setImie(data.imie);
      }
    };
    fetchImie();
  }, [session]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogoClick = () => {
    if (onNavigate) onNavigate('home');
    window.dispatchEvent(new Event('resetToHome'));
  };

  const handleOpenSettings = () => {
    if (onNavigate) onNavigate('home'); 
    setTimeout(() => {
      window.dispatchEvent(new Event('openCabinetSettings'));
    }, 100);
    
    setIsMenuOpen(false);
  };

  const handleLogout = async () => {
    setIsMenuOpen(false);
    await supabase.auth.signOut();
  };

  const displayName = imie || session?.user?.email?.split('@')[0] || 'Konto';

  return (
    <header className="w-full bg-white border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
        
        <div 
          className="flex items-center gap-3 cursor-pointer group" 
          onClick={handleLogoClick}
        >
          <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105">
            <span className="text-white text-2xl font-bold pb-1">+</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            e-Apteczka
          </h1>
        </div>

        {session && (
          <div className="relative" ref={menuRef}>
            
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex items-center gap-2 px-4 h-10 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors focus:outline-none"
            >
              <UserCircle className="w-5 h-5 text-slate-600" />
              <span className="text-sm font-medium text-slate-700 max-w-[120px] truncate">
                {displayName}
              </span>
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-100 rounded-xl shadow-lg py-2 custom-fade z-50">
                <div className="px-4 py-2 border-b border-slate-50 mb-1">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Moje konto</p>
                </div>
                
                
                <button 
                  onClick={() => { onNavigate('profile'); setIsMenuOpen(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors flex items-center gap-2"
                >
                  <User className="w-4 h-4" />
                  Twój profil
                </button>
                
                <button 
                  onClick={handleOpenSettings}
                  className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors flex items-center gap-2"
                >
                  <Settings className="w-4 h-4" />
                  Ustawienia szafki
                </button>

                <div className="h-px bg-slate-100 my-1"></div>

                <button 
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2 font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  Wyloguj się
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </header>
  );
};

export default Header;