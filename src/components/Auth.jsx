import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { useForm } from 'react-hook-form';
import { Turnstile } from '@marsidev/react-turnstile';

const Auth = () => {
  const [view, setView] = useState('login');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [captchaToken, setCaptchaToken] = useState(null);
  const turnstileRef = useRef();

  const { register, handleSubmit, watch, reset, formState: { errors, isSubmitting } } = useForm();
  
  const password = watch("password") || "";


  const passwordReqs = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password)
  };
  
  const isPasswordStrong = Object.values(passwordReqs).every(Boolean);

  // oczekiwanie na zmiane hasla z mail
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setView('update_password');
        setSuccessMsg('Zostałeś pomyślnie zweryfikowany. Wpisz nowe hasło poniżej.');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const onSubmit = async (data) => {
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (view === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ 
          email: data.email, 
          password: data.password,
          options: { captchaToken }
        });
        if (error) throw new Error('Nieprawidłowy email lub hasło.');
        
      } else if (view === 'register') {
        if (!isPasswordStrong) throw new Error('Hasło nie spełnia wymagań bezpieczeństwa.');

        const { error } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: { 
            data: { imie: data.imie, nazwisko: data.nazwisko },
            captchaToken 
          }
        });
        
        if (error) throw error;
        
        setSuccessMsg('Konto utworzone! Potwierdź rejestrację na swoim mailu.');
        reset();
        setTimeout(() => switchView('login'), 3000);
        
      } else if (view === 'reset') {
        const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
          redirectTo: window.location.origin, 
          captchaToken
        });
        
        if (error) throw error;
        
        setSuccessMsg('Na Twój adres email wysłano link do resetowania hasła.');
        reset();
        
      } else if (view === 'update_password') {
        if (!isPasswordStrong) throw new Error('Hasło nie spełnia wymagań bezpieczeństwa.');

        const { error } = await supabase.auth.updateUser({
          password: data.password
        });

        if (error) throw error;

        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('logi_aktywnosci').insert([{
            id_uzytkownika: user.id,
            operacja: 'edycja',
            szczegoly: 'Użytkownik zresetował hasło'
          }]);
        }

        setSuccessMsg('Hasło zostało zmienione! Zaloguj się nowym hasłem.');
        reset();
        setTimeout(() => switchView('login'), 4000);
      }
    } catch (err) {
      setErrorMsg(err.message);
      if (turnstileRef.current) turnstileRef.current.reset();
      setCaptchaToken(null);
    }
  };

  const switchView = (newView) => {
    setView(newView);
    setErrorMsg('');
    setSuccessMsg('');
    setCaptchaToken(null);
    reset(); 
  };

  return (
    <div className="max-w-md mx-auto mt-3 bg-white p-8 border border-slate-100 rounded-3xl shadow-xl custom-fade">
      <h2 className="text-3xl font-bold mb-6 text-center">
        {view === 'login' ? 'Zaloguj się' : view === 'register' ? 'Stwórz konto' : view === 'reset' ? 'Zresetuj hasło' : 'Ustaw nowe hasło'}
      </h2>
      
      {errorMsg && <div className="bg-red-50 text-red-500 p-4 rounded-xl mb-6 text-sm font-medium">{errorMsg}</div>}
      {successMsg && <div className="bg-green-50 text-green-600 p-4 rounded-xl mb-6 text-sm font-medium border border-green-100 text-center">{successMsg}</div>}

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        
        {view === 'register' && (
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

        {view !== 'update_password' && (
          <div className="w-full">
            <input 
              type="email" 
              placeholder="Adres email" 
              {...register("email", { required: "Podaj adres email" })} 
              className={`w-full bg-slate-50 p-4 rounded-xl outline-none focus:ring-2 ${errors.email ? 'ring-red-500 focus:ring-red-500' : 'focus:ring-black'}`} 
            />
            {errors.email && <span className="text-red-500 text-xs font-medium pl-1 mt-1 block">{errors.email.message}</span>}
          </div>
        )}

        {view !== 'reset' && (
          <>
            <div className="w-full relative">
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder={view === 'update_password' ? "Nowe hasło" : "Hasło"} 
                {...register("password", { required: "Podaj hasło" })} 
                className={`w-full bg-slate-50 p-4 rounded-xl outline-none focus:ring-2 pr-16 ${errors.password ? 'ring-red-500 focus:ring-red-500' : 'focus:ring-black'}`} 
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-4 text-xs font-bold text-slate-400 hover:text-black uppercase">
                {showPassword ? 'Ukryj' : 'Pokaż'}
              </button>
              {errors.password && <span className="text-red-500 text-xs font-medium pl-1 mt-1 block">{errors.password.message}</span>}
            </div>

            
            {(view === 'register' || view === 'update_password') && (
              <div className="px-2 py-1 text-xs space-y-1 font-medium">
                <p className={passwordReqs.length ? "text-green-600" : "text-slate-400"}>{passwordReqs.length ? '✓' : '○'} Min. 8 znaków</p>
                <p className={passwordReqs.upper ? "text-green-600" : "text-slate-400"}>{passwordReqs.upper ? '✓' : '○'} Przynajmniej 1 wielka litera</p>
                <p className={passwordReqs.lower ? "text-green-600" : "text-slate-400"}>{passwordReqs.lower ? '✓' : '○'} Przynajmniej 1 mała litera</p>
                <p className={passwordReqs.number ? "text-green-600" : "text-slate-400"}>{passwordReqs.number ? '✓' : '○'} Przynajmniej 1 cyfra</p>
                <p className={passwordReqs.special ? "text-green-600" : "text-slate-400"}>{passwordReqs.special ? '✓' : '○'} Przynajmniej 1 znak specjalny</p>
              </div>
            )}
          </>
        )}

        {(view === 'register' || view === 'update_password') && (
          <div className="w-full">
            <input 
              type={showPassword ? "text" : "password"} 
              placeholder="Powtórz hasło" 
              {...register("confirmPassword", { 
                required: "Potwierdź hasło", 
                validate: value => value === password || "Hasła nie są identyczne!" 
              })} 
              className={`w-full bg-slate-50 p-4 rounded-xl outline-none focus:ring-2 ${errors.confirmPassword ? 'ring-red-500 focus:ring-red-500' : 'focus:ring-black'}`} 
            />
            {errors.confirmPassword && <span className="text-red-500 text-xs font-medium pl-1 mt-1 block">{errors.confirmPassword.message}</span>}
          </div>
        )}

        {view === 'register' && (
          <div className="w-full pl-1 mt-1">
            <label className="flex items-start gap-3 cursor-pointer">
              <input 
                type="checkbox" 
                {...register("regulamin", { required: "Musisz zaakceptować regulamin, aby kontynuować." })}
                className="mt-1 w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer" 
              />
              <span className="text-xs text-slate-600 leading-tight">
                Akceptuję <a href="#" className="font-semibold text-slate-900 hover:underline">Regulamin serwisu</a> oraz <a href="#" className="font-semibold text-slate-900 hover:underline">Politykę Prywatności</a>. *
              </span>
            </label>
            {errors.regulamin && <span className="text-red-500 text-xs font-medium pl-7 mt-1 block">{errors.regulamin.message}</span>}
          </div>
        )}

        {/* widget captcha */}
        {view !== 'update_password' && (
          <div className="mt-2 flex justify-center">
            <Turnstile
              ref={turnstileRef}
              siteKey={import.meta.env.VITE_PUBLIC_TURNSTILE_SITE_KEY}
              onSuccess={(token) => setCaptchaToken(token)}
              onError={() => setCaptchaToken(null)}
              onExpire={() => setCaptchaToken(null)}
              options={{ theme: 'light' }}
            />
          </div>
        )}

        {view === 'login' && (
          <div className="text-right">
            <button type="button" onClick={() => switchView('reset')} className="text-xs font-bold text-slate-500 hover:text-black">
              Zapomniałeś hasła?
            </button>
          </div>
        )}

        <button 
          type="submit" 
          disabled={isSubmitting || ((view === 'register' || view === 'update_password') && !isPasswordStrong) || (!captchaToken && view !== 'update_password')} 
          className="mt-2 bg-black text-white font-bold py-4 rounded-xl hover:bg-slate-800 transition-colors disabled:bg-slate-300"
        >
          {isSubmitting ? 'Przetwarzanie...' : view === 'login' ? 'Zaloguj się' : view === 'register' ? 'Załóż konto' : view === 'reset' ? 'Wyślij link resetujący' : 'Zapisz nowe hasło'}
        </button>
      </form>

      <div className="mt-8 text-center">
        {view === 'login' ? (
          <p className="text-slate-500 text-sm">
            Nie masz jeszcze konta? <button type="button" onClick={() => switchView('register')} className="font-bold text-black hover:underline">Zarejestruj się</button>
          </p>
        ) : (
          <p className="text-slate-500 text-sm">
            Wróć do <button type="button" onClick={() => switchView('login')} className="font-bold text-black hover:underline">logowania</button>
          </p>
        )}
      </div>
    </div>
  );
};

export default Auth;