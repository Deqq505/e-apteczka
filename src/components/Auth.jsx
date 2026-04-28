import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [imie, setImie] = useState('');
  const [nazwisko, setNazwisko] = useState('');
  

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw new Error('Nieprawidłowy email lub hasło.');
      } else {
        if (password !== confirmPassword) throw new Error('Hasła nie są identyczne!');
        
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { imie, nazwisko } }
        });
        
        if (error) throw error;
        
        setSuccessMsg('Konto utworzone! Potwierdź rejestrację na swoim mailu.');
        
        
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setImie('');
        setNazwisko('');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-3 bg-white p-8 border border-slate-100 rounded-3xl shadow-xl">
      <h2 className="text-3xl font-bold mb-6 text-center">
        {isLogin ? 'Zaloguj się' : 'Stwórz konto'}
      </h2>
      
      {error && <div className="bg-red-50 text-red-500 p-4 rounded-xl mb-6 text-sm font-medium">{error}</div>}
      {successMsg && <div className="bg-green-50 text-green-600 p-4 rounded-xl mb-6 text-sm font-medium border border-green-100 text-center">{successMsg}</div>}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {!isLogin && (
          <div className="flex gap-4">
            <input type="text" placeholder="Imię" value={imie} onChange={(e) => setImie(e.target.value)} required className="w-full bg-slate-50 p-4 rounded-xl outline-none focus:ring-2 focus:ring-black" />
            <input type="text" placeholder="Nazwisko" value={nazwisko} onChange={(e) => setNazwisko(e.target.value)} required className="w-full bg-slate-50 p-4 rounded-xl outline-none focus:ring-2 focus:ring-black" />
          </div>
        )}

        <input type="email" placeholder="Adres email" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-slate-50 p-4 rounded-xl outline-none focus:ring-2 focus:ring-black" />

        <div className="relative">
          <input type={showPassword ? "text" : "password"} placeholder="Hasło" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full bg-slate-50 p-4 rounded-xl outline-none focus:ring-2 focus:ring-black pr-16" />
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-4 text-xs font-bold text-slate-400 hover:text-black uppercase">
            {showPassword ? 'Ukryj' : 'Pokaż'}
          </button>
        </div>

        {!isLogin && (
          <input type={showPassword ? "text" : "password"} placeholder="Powtórz hasło" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="bg-slate-50 p-4 rounded-xl outline-none focus:ring-2 focus:ring-black" />
        )}

        <button type="submit" disabled={loading} className="mt-4 bg-black text-white font-bold py-4 rounded-xl hover:bg-slate-800 transition-colors disabled:bg-slate-300">
          {loading ? 'Przetwarzanie...' : (isLogin ? 'Zaloguj się' : 'Załóż konto')}
        </button>
      </form>

      <div className="mt-8 text-center">
        <p className="text-slate-500 text-sm">
          {isLogin ? "Nie masz jeszcze konta? " : "Masz już konto? "}
          <button type="button" onClick={() => { setIsLogin(!isLogin); setError(''); setSuccessMsg(''); }} className="font-bold text-black hover:underline">
            {isLogin ? "Zarejestruj się" : "Zaloguj się"}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Auth;