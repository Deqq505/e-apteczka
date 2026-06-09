import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Auth from './components/Auth';
import Profile from './components/Profile';
import Dashboard from './components/Dashboard';
import { supabase } from './supabaseClient';

function App() {
  const [session, setSession] = useState(null);
  const [toast, setToast] = useState(null);
  const [currentView, setCurrentView] = useState('home');

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      
      if (event === 'SIGNED_IN') {
        setCurrentView('home');
        showToast('Zalogowano pomyślnie!', 'success');
      } else if (event === 'SIGNED_OUT') {
        showToast('Wylogowano pomyślnie.', 'info');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 relative">
      
      {toast && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className={`px-4 py-3 rounded-full shadow-md border flex items-center gap-2 ${
            toast.type === 'success' 
              ? 'bg-slate-900 border-slate-800 text-white' 
              : 'bg-white border-slate-200 text-slate-800'
          }`}>
            {toast.type === 'success' ? (
              <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
            ) : (
              <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            )}
            <p className="text-sm font-medium whitespace-nowrap">{toast.message}</p>
          </div>
        </div>
      )}

      <Header session={session} onNavigate={setCurrentView} />
      
      <main className="p-4">
        {!session ? (
          <Auth />
        ) : (
          currentView === 'profile' ? (
            <Profile session={session} />
          ) : (
            <Dashboard showToast={showToast} />
          )
        )}
      </main>
    </div>
  );
}

export default App;