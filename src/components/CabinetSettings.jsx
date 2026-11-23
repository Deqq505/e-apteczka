import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useForm } from 'react-hook-form';

const CabinetSettings = ({ cabinetId, allCabinets, onBack, onUpdate, onDelete, showToast }) => {
  const [cabinet, setCabinet] = useState(null);
  const [ownerName, setOwnerName] = useState('');
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [sharedUsers, setSharedUsers] = useState([]);
  const [inviteEmail, setInviteEmail] = useState('');

  const { register, handleSubmit, setError, reset, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { newName: '' }
  });

  const fetchSharedUsers = async () => {
    const { data } = await supabase
      .from('uprawnienia')
      .select('id_uzytkownika, uzytkownicy(id_uzytkownika, imie, nazwisko, email)')
      .eq('id_szafki', cabinetId);

    if (data) {
      setSharedUsers(data.map(item => item.uzytkownicy).filter(Boolean));
    }
  };

  useEffect(() => {
    const fetchCabinetData = async () => {
      setLoading(true);
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      const { data: cabinetData, error: cabError } = await supabase
        .from('szafki')
        .select('*')
        .eq('id_szafki', cabinetId)
        .single();

      if (cabinetData && !cabError) {
        setCabinet(cabinetData);
        reset({ newName: cabinetData.nazwa_szafki });
        
        const isCurrentUserOwner = currentUser?.id === cabinetData.id_wlasciciela;
        setIsOwner(isCurrentUserOwner);
        
        const { data: user } = await supabase
          .from('uzytkownicy')
          .select('imie, nazwisko')
          .eq('id_uzytkownika', cabinetData.id_wlasciciela)
          .single();
          
        setOwnerName(user ? `${user.imie} ${user.nazwisko}` : 'Brak danych');

        if (isCurrentUserOwner) {
          await fetchSharedUsers();
        }
      }
      setLoading(false);
    };

    if (cabinetId) fetchCabinetData();
  }, [cabinetId, reset]);

  const onSubmit = async (data) => {
    const { newName } = data;

    if (!newName.trim()) {
      setError('newName', { type: 'manual', message: 'Nazwa szafki nie może być pusta!' });
      return;
    }
    
    if (newName === cabinet.nazwa_szafki) {
      setError('newName', { type: 'manual', message: 'Szafka ma już taką nazwę!' });
      return;
    }

    const nameExists = allCabinets.find(
      c => c.nazwa_szafki.toLowerCase() === newName.toLowerCase() && c.id_szafki !== cabinetId
    );

    if (nameExists) {
      setError('newName', { type: 'manual', message: 'Szafka o tej nazwie już istnieje!' });
      return;
    }
    
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase
      .from('szafki')
      .update({ nazwa_szafki: newName })
      .eq('id_szafki', cabinetId);
      
    if (!error) {
      if (user) {
        await supabase.from('logi_aktywnosci').insert([{
          id_uzytkownika: user.id,
          id_szafki: cabinetId,
          operacja: 'edycja',
          szczegoly: `Zmieniono nazwę szafki z "${cabinet.nazwa_szafki}" na "${newName}"`
        }]);
      }

      if(showToast) showToast('Zmieniono nazwę szafki', 'success');
      onUpdate();
    } else {
      if(showToast) showToast('Wystąpił błąd przy zapisie', 'error');
    }
  };

  const handleInviteUser = async (e) => {
    e.preventDefault();
    const email = inviteEmail.trim().toLowerCase();
    if (!email) return;

    const { data: foundUser } = await supabase
      .from('uzytkownicy')
      .select('id_uzytkownika, email')
      .ilike('email', email)
      .single();

    if (!foundUser) {
      if (showToast) showToast('Nie znaleziono użytkownika z takim adresem e-mail', 'error');
      return;
    }

    if (foundUser.id_uzytkownika === cabinet.id_wlasciciela || sharedUsers.some(u => u.id_uzytkownika === foundUser.id_uzytkownika)) {
      if (showToast) showToast('Ten użytkownik ma już dostęp do szafki', 'error');
      return;
    }

    const { error } = await supabase
      .from('uprawnienia')
      .insert([{ id_szafki: cabinetId, id_uzytkownika: foundUser.id_uzytkownika, rola: 'czlonek' }]);

    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('logi_aktywnosci').insert([{
        id_uzytkownika: user.id,
        id_szafki: cabinetId,
        operacja: 'dodanie',
        szczegoly: `Udostępniono szafkę użytkownikowi: ${foundUser.email}`
      }]);
      
      setInviteEmail('');
      if (showToast) showToast('Udostępniono szafkę!', 'success');
      fetchSharedUsers();
    } else {
      if (showToast) showToast('Błąd podczas udostępniania', 'error');
    }
  };

  const handleRemoveAccess = async (userId, userEmail) => {
    const { error } = await supabase
      .from('uprawnienia')
      .delete()
      .eq('id_szafki', cabinetId)
      .eq('id_uzytkownika', userId);

    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('logi_aktywnosci').insert([{
        id_uzytkownika: user.id,
        id_szafki: cabinetId,
        operacja: 'usuniecie',
        szczegoly: `Odebrano dostęp użytkownikowi: ${userEmail}`
      }]);
      if (showToast) showToast('Odebrano dostęp do szafki', 'success');
      fetchSharedUsers();
    }
  };

  const handleLeaveCabinet = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('logi_aktywnosci').insert([{
      id_uzytkownika: user.id,
      id_szafki: cabinetId,
      operacja: 'usuniecie',
      szczegoly: `Użytkownik ${user.email} opuścił szafkę`
    }]);

    const { error } = await supabase
      .from('uprawnienia')
      .delete()
      .eq('id_szafki', cabinetId)
      .eq('id_uzytkownika', user.id);

    if (!error) {
      if (showToast) showToast('Opuściłeś szafkę', 'success');
      onDelete();
    } else {
      if (showToast) showToast('Błąd podczas opuszczania szafki', 'error');
    }
  };

  const confirmDeleteCabinet = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('logi_aktywnosci').insert([{
        id_uzytkownika: user.id,
        id_szafki: cabinetId,
        operacja: 'usuniecie',
        szczegoly: `Usunięto szafkę: "${cabinet.nazwa_szafki}"`
      }]);
    }

    const { error } = await supabase
      .from('szafki')
      .delete()
      .eq('id_szafki', cabinetId);
      
    if (!error) {
      if(showToast) showToast('Szafka usunięta', 'success');
      onDelete(); 
    } else {
      if(showToast) showToast('Błąd usuwania szafki', 'error');
      setShowDeleteConfirm(false);
    }
  };

  if (loading) {
    return <div className="text-center py-10 text-slate-500 custom-fade">Ładowanie ustawień...</div>;
  }

  if (!cabinet) {
    return <div className="text-center py-10 text-slate-500 custom-fade">Nie udało się załadować danych.</div>;
  }

  return (
    <>
      <div className="max-w-2xl mx-auto mt-6 bg-white p-8 rounded-2xl shadow-sm border border-slate-100 custom-fade">
        
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Ustawienia szafki</h2>
          <button 
            onClick={onBack} 
            className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
          >
            Wróć do listy
          </button>
        </div>

        <div className="space-y-4">
          
          <form onSubmit={handleSubmit(onSubmit)} className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col sm:flex-row gap-3 items-start" noValidate>
            <div className="flex-1 w-full">
              <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Nazwa szafki</span>
              <input 
                type="text" 
                disabled={!isOwner}
                {...register("newName", { required: "Nazwa szafki nie może być pusta!" })}
                className={`w-full px-4 py-2.5 bg-white border ${errors.newName ? 'border-red-500' : 'border-slate-200'} rounded-lg outline-none focus:ring-2 ${errors.newName ? 'focus:ring-red-500' : 'focus:ring-slate-900'} disabled:bg-slate-100 disabled:text-slate-500`}
              />
              {errors.newName && <p className="text-red-500 text-xs font-medium mt-1 pl-1">{errors.newName.message}</p>}
            </div>
            {isOwner && (
              <button 
                type="submit"
                disabled={isSubmitting}
                className="mt-6 sm:mt-6 self-start px-5 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? 'Zapisywanie...' : 'Zapisz'}
              </button>
            )}
          </form>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Utworzona przez</span>
              <span className="text-slate-900 font-medium">{ownerName}</span>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Data utworzenia</span>
              <span className="text-slate-900 font-medium">
                {cabinet.data_utworzenia ? new Date(cabinet.data_utworzenia).toLocaleDateString('pl-PL') : '-'}
              </span>
            </div>
          </div>

          {isOwner && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-4">
              <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Udostępnianie szafki</span>
              
              <form onSubmit={handleInviteUser} className="flex flex-col sm:flex-row gap-3">
                <input 
                  type="email" 
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="Adres e-mail użytkownika..."
                  className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-slate-900"
                />
                <button 
                  type="submit"
                  className="px-5 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors"
                >
                  Udostępnij
                </button>
              </form>

              {sharedUsers.length > 0 && (
                <div className="space-y-2 pt-2">
                  {sharedUsers.map(u => (
                    <div key={u.id_uzytkownika} className="flex justify-between items-center bg-white p-3 rounded-lg border border-slate-200">
                      <div>
                        <p className="text-sm font-medium text-slate-800">{u.imie} {u.nazwisko}</p>
                        <p className="text-xs text-slate-500">{u.email}</p>
                      </div>
                      <button 
                        type="button"
                        onClick={() => handleRemoveAccess(u.id_uzytkownika, u.email)}
                        className="text-xs font-semibold text-red-600 hover:text-red-800 px-2 py-1"
                      >
                        Usuń
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-slate-100">
            {isOwner ? (
              <button 
                onClick={() => setShowDeleteConfirm(true)} 
                className="w-full px-4 py-3 bg-red-50 text-red-600 text-sm font-bold rounded-xl hover:bg-red-100 transition-colors"
              >
                Usuń szafkę
              </button>
            ) : (
              <button 
                onClick={handleLeaveCabinet} 
                className="w-full px-4 py-3 bg-red-50 text-red-600 text-sm font-bold rounded-xl hover:bg-red-100 transition-colors"
              >
                Opuść szafkę
              </button>
            )}
          </div>

        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 custom-fade" onClick={() => setShowDeleteConfirm(false)}>
          <div className="bg-white p-6 rounded-2xl shadow-xl max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Usunąć szafkę?</h3>
            <p className="text-slate-500 text-sm mb-6">
              Czy na pewno chcesz usunąć tę szafkę?
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowDeleteConfirm(false)} 
                className="flex-1 px-4 py-3 border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors"
              >
                Anuluj
              </button>
              <button 
                onClick={confirmDeleteCabinet} 
                className="flex-1 px-4 py-3 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-colors"
              >
                Tak, usuń
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CabinetSettings;