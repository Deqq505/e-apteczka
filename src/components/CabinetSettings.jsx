import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const CabinetSettings = ({ cabinetId, allCabinets, onBack, onUpdate, onDelete, showToast }) => {
  const [cabinet, setCabinet] = useState(null);
  const [ownerName, setOwnerName] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [newName, setNewName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const pobierzDane = async () => {
      setLoading(true);
      
      const { data: daneSzafki, error: cabError } = await supabase
        .from('szafki')
        .select('*')
        .eq('id_szafki', cabinetId)
        .single();

      if (daneSzafki && !cabError) {
        setCabinet(daneSzafki);
        setNewName(daneSzafki.nazwa_szafki);
        
        const { data: user } = await supabase
          .from('uzytkownicy')
          .select('imie, nazwisko')
          .eq('id_uzytkownika', daneSzafki.id_wlasciciela)
          .single();
          
        if (user) {
          setOwnerName(`${user.imie} ${user.nazwisko}`);
        } else {
          setOwnerName('Brak danych');
        }
      }
      setLoading(false);
    };

    if (cabinetId) pobierzDane();
  }, [cabinetId]);

  const handleZapisz = async () => {
    if (!newName.trim()) {
      if(showToast) showToast('Nazwa szafki nie może być pusta!', 'error');
      return;
    }
    
    if (newName === cabinet.nazwa_szafki) {
      if(showToast) showToast('Szafka ma już taką nazwę!', 'error');
      return;
    }

    const czyIstnieje = allCabinets.find(
      c => c.nazwa_szafki.toLowerCase() === newName.toLowerCase() && c.id_szafki !== cabinetId
    );

    if (czyIstnieje) {
      if(showToast) showToast('Szafka o tej nazwie już istnieje!', 'error');
      return;
    }
    
    setIsSaving(true);
    
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
    
    setIsSaving(false);
  };

  const potwierdzUsuniecie = async () => {
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
          
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Nazwa szafki</span>
              <input 
                type="text" 
                value={newName} 
                onChange={(e) => setNewName(e.target.value)} 
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
            <button 
              onClick={handleZapisz}
              disabled={isSaving}
              className="mt-6 sm:mt-0 self-end px-5 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-colors"
            >
              {isSaving ? 'Zapisywanie...' : 'Zapisz'}
            </button>
          </div>

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

          <div className="mt-8 pt-6 border-t border-slate-100">
            <button 
              onClick={() => setShowDeleteConfirm(true)} 
              className="w-full px-4 py-3 bg-red-50 text-red-600 text-sm font-bold rounded-xl hover:bg-red-100 transition-colors"
            >
              Usuń szafkę
            </button>
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
                onClick={potwierdzUsuniecie} 
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