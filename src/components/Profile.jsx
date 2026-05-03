import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const Profile = ({ session }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('uzytkownicy')
          .select('imie, nazwisko, email, data_zalozenia')
          .eq('id_uzytkownika', session.user.id)
          .single();

        if (error) throw error;
        if (data) setProfile(data);
      } catch (error) {
        console.error('Błąd pobierania profilu:', error.message);
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.id) getProfile();
  }, [session]);

  if (loading) {
    return <div className="text-center py-10 text-slate-500">Ładowanie profilu...</div>;
  }

  if (!profile) {
    return <div className="text-center py-10 text-slate-500">Nie udało się załadować danych.</div>;
  }

  return (
    <div className="max-w-2xl mx-auto mt-8 bg-white p-8 rounded-2xl shadow-sm border border-slate-100 animate-in fade-in duration-300">
      <h2 className="text-2xl font-bold text-slate-900 mb-6">Twój profil</h2>
      
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Imię</span>
            <span className="text-slate-900 font-medium">{profile.imie || 'Brak danych'}</span>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Nazwisko</span>
            <span className="text-slate-900 font-medium">{profile.nazwisko || 'Brak danych'}</span>
          </div>
        </div>
        
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
          <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Adres e-mail</span>
          <span className="text-slate-900 font-medium">{profile.email}</span>
        </div>
        
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
          <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Konto założone dnia</span>
          <span className="text-slate-900 font-medium">
            {profile.data_zalozenia ? new Date(profile.data_zalozenia).toLocaleDateString('pl-PL') : 'Brak danych'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Profile;