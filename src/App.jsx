import React, { useEffect, useState } from 'react';
import Header from './components/Header';
import Auth from './components/Auth';
import { supabase } from './supabaseClient';

function App() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <Header />
      
      <main className="max-w-5xl mx-auto px-6 py-12">
        {!session ? (
          <Auth />
        ) : (
          <div className="bg-white p-12 rounded-[40px] border border-slate-100 shadow-sm text-center">
            <h1 className="text-4xl font-bold mb-4">Zalogowałeś się!</h1>
            <p className="text-slate-500 mb-8">
              Witaj: <span className="font-bold text-black">{session.user.email}</span>
            </p>
            
            <button 
              onClick={() => supabase.auth.signOut()} 
              className="px-6 py-3 bg-red-50 text-red-500 font-bold rounded-xl hover:bg-red-100 transition-colors"
            >
              Wyloguj mnie
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;