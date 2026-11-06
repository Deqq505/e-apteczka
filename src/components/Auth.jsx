import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useForm } from 'react-hook-form';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const { register, handleSubmit, watch, reset, formState: { errors, isSubmitting } } = useForm();
  const password = watch("password");

  const onSubmit = async (data) => {
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email: data.email, password: data.password });
        if (error) throw new Error('Nieprawidłowy email lub hasło.');
      } else {
        const { error } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: { data: { imie: data.imie, nazwisko: data.nazwisko } }
        });
        
        if (error) throw error;
        
        setSuccessMsg('Konto utworzone! Potwierdź rejestrację na swoim mailu.');
        reset(); 
      }
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setErrorMsg('');
    setSuccessMsg('');
    reset(); 
  };

  return (
    <div className="max-w-md mx-auto mt-3 bg-white p-8 border border-slate-100 rounded-3xl shadow-xl custom-fade">
      <h2 className="text-3xl font-bold mb-6 text-center">
        {isLogin ? 'Zaloguj się' : 'Stwórz konto'}
      </h2>
      
      {errorMsg && <div className="bg-red-50 text-red-500 p-4 rounded-xl mb-6 text-sm font-medium">{errorMsg}</div>}
      {successMsg && <div className="bg-green-50 text-green-600 p-4 rounded-xl mb-6 text-sm font-medium border border-green-100 text-center">{successMsg}</div>}

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        {!isLogin && (
          <div className="flex gap-4">
            <div className="w-full">
              <input 
                type="text" 
                placeholder="Imię" 
                {...register("imie", { required: "Podaj imię" })} 
                className={`w-full bg-slate-50 p-4 rounded-xl outline-none focus:ring-2 ${errors.imie ? 'ring-red-500 focus:ring-red-500' : 'focus:ring-black'}`} 
              />
              {errors.imie && <span className="text-red-500 text-xs font-medium pl-1 mt-1 block">{errors.imie.message}</span>}
            </div>
            <div className="w-full">
              <input 
                type="text" 
                placeholder="Nazwisko" 
                {...register("nazwisko", { required: "Podaj nazwisko" })} 
                className={`w-full bg-slate-50 p-4 rounded-xl outline-none focus:ring-2 ${errors.nazwisko ? 'ring-red-500 focus:ring-red-500' : 'focus:ring-black'}`} 
              />
              {errors.nazwisko && <span className="text-red-500 text-xs font-medium pl-1 mt-1 block">{errors.nazwisko.message}</span>}
            </div>
          </div>
        )}

        <div className="w-full">
          <input 
            type="email" 
            placeholder="Adres email" 
            {...register("email", { required: "Podaj adres email" })} 
            className={`w-full bg-slate-50 p-4 rounded-xl outline-none focus:ring-2 ${errors.email ? 'ring-red-500 focus:ring-red-500' : 'focus:ring-black'}`} 
          />
          {errors.email && <span className="text-red-500 text-xs font-medium pl-1 mt-1 block">{errors.email.message}</span>}
        </div>

        <div className="w-full relative">
          <input 
            type={showPassword ? "text" : "password"} 
            placeholder="Hasło" 
            {...register("password", { required: "Podaj hasło" })} 
            className={`w-full bg-slate-50 p-4 rounded-xl outline-none focus:ring-2 pr-16 ${errors.password ? 'ring-red-500 focus:ring-red-500' : 'focus:ring-black'}`} 
          />
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-4 text-xs font-bold text-slate-400 hover:text-black uppercase">
            {showPassword ? 'Ukryj' : 'Pokaż'}
          </button>
          {errors.password && <span className="text-red-500 text-xs font-medium pl-1 mt-1 block">{errors.password.message}</span>}
        </div>

        {!isLogin && (
          <div className="w-full">
            <input 
              type={showPassword ? "text" : "password"} 
              placeholder="Powtórz hasło" 
              {...register("confirmPassword", { required: "Potwierdź hasło", validate: value => value === password || "Hasła nie są identyczne!" })} 
              className={`w-full bg-slate-50 p-4 rounded-xl outline-none focus:ring-2 ${errors.confirmPassword ? 'ring-red-500 focus:ring-red-500' : 'focus:ring-black'}`} 
            />
            {errors.confirmPassword && <span className="text-red-500 text-xs font-medium pl-1 mt-1 block">{errors.confirmPassword.message}</span>}
          </div>
        )}

        <button type="submit" disabled={isSubmitting} className="mt-4 bg-black text-white font-bold py-4 rounded-xl hover:bg-slate-800 transition-colors disabled:bg-slate-300">
          {isSubmitting ? 'Przetwarzanie...' : (isLogin ? 'Zaloguj się' : 'Załóż konto')}
        </button>
      </form>

      <div className="mt-8 text-center">
        <p className="text-slate-500 text-sm">
          {isLogin ? "Nie masz jeszcze konta? " : "Masz już konto? "}
          <button type="button" onClick={toggleMode} className="font-bold text-black hover:underline">
            {isLogin ? "Zarejestruj się" : "Zaloguj się"}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Auth;