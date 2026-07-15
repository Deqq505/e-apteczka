import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

const AddMedication = ({ cabinetId, onSuccess, onCancel, showToast }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  const [ean, setEan] = useState('');
  const [oficjalnaNazwa, setOficjalnaNazwa] = useState('');
  const [dawka, setDawka] = useState('');

  const [nazwaWlasna, setNazwaWlasna] = useState('');
  const [dataWaznosci, setDataWaznosci] = useState('');
  const [ilosc, setIlosc] = useState('');
  const [jednostka, setJednostka] = useState('sztuki');
  const [status, setStatus] = useState('w szafce');

  // Wyszukiwarka po ean lub nazwie leku
  const handleSearchChange = async (e) => {
    setSearchQuery(e.target.value);

    if (!e.target.value) {
      setSuggestions([]);
      return;
    }

    const isEan = /^\d+$/.test(e.target.value);
    
    let dbQuery = supabase.from('baza_lekow').select('ean, nazwa_leku, dawka').limit(8);
      
    if (isEan) {
      dbQuery = dbQuery.ilike('ean', `${e.target.value}%`);
    } else {
      dbQuery = dbQuery.ilike('nazwa_leku', `%${e.target.value}%`);
    }

    const { data } = await dbQuery;
    
    if (data) {
      setSuggestions(data);
    }
  };

  // uzupelnianie pól formularza po wybraniu leku z podpowiedzi
  const handleSelectSuggestion = (lek) => {
    setEan(lek.ean);
    setOficjalnaNazwa(lek.nazwa_leku);
    setDawka(lek.dawka || 'Brak danych');
    setSearchQuery(lek.nazwa_leku); 
    setSuggestions([]); 
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const { data: { user } } = await supabase.auth.getUser();
    
    const zapisywanaNazwa = nazwaWlasna ? nazwaWlasna : oficjalnaNazwa;

    // Zapis leku do szafki do bazy danych
    await supabase.from('zasoby').insert([{
      id_szafki: cabinetId,
      id_uzytkownika_dodal: user.id,
      ean_leku: ean,
      nazwa_reczna: zapisywanaNazwa,
      data_waznosci: dataWaznosci,
      ilosc: ilosc,
      jednostka: jednostka,
      status: status
    }]);

    // Zapis logow aktywności do bazy danych
    await supabase.from('logi_aktywnosci').insert([{
      id_uzytkownika: user.id,
      id_szafki: cabinetId,
      operacja: 'dodanie',
      szczegoly: 'Dodano nowy lek: ' + zapisywanaNazwa
    }]);

    showToast?.('Lek został dodany do szafki!', 'success');
    onSuccess();
  };

  // Widok główny dodawania leku
  return (
    <div className="max-w-3xl mx-auto mt-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
      
      <div className="p-6 sm:p-8 border-b border-slate-100">
        <h2 className="text-xl font-bold text-slate-800 mb-6">Dodaj lek do szafki</h2>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input 
              type="text" 
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-slate-900"
              placeholder="Zeskanuj, wpisz EAN lub nazwę leku..."
            />
            
            {/* Wyskakująca lista podpowiedzi leków */}
            {suggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                {suggestions.map((s) => (
                  <div 
                    key={s.ean} 
                    onClick={() => handleSelectSuggestion(s)}
                    className="p-4 border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <div className="font-semibold text-sm text-slate-800">{s.nazwa_leku}</div>
                    <div className="text-xs text-slate-500 mt-1">EAN: {s.ean} {s.dawka ? `• Dawka: ${s.dawka}` : ''}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button 
            type="button" 
            className="px-5 py-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2"
            title="Skanuj kod aparatem"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
          </button>
        </div>
      </div>

      <div className="p-6 sm:p-8">
        <form id="addMedicationForm" onSubmit={handleSubmit} className="space-y-8">

          {/* Zablokowane dane z bazy */}
          <div>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              Dane z rejestru (zablokowane)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 bg-slate-50/50 p-5 rounded-xl border border-slate-100">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">KOD EAN</label>
                <input 
                  type="text" 
                  value={ean}
                  readOnly
                  className="w-full px-4 py-2.5 bg-slate-100/50 border border-slate-200 text-slate-500 rounded-lg outline-none cursor-not-allowed"
                  placeholder="Uzupełni się automatycznie..."
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">OFICJALNA NAZWA LEKU</label>
                <input 
                  type="text" 
                  value={oficjalnaNazwa}
                  readOnly
                  className="w-full px-4 py-2.5 bg-slate-100/50 border border-slate-200 text-slate-500 rounded-lg outline-none cursor-not-allowed"
                  placeholder="Uzupełni się automatycznie..."
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-500 mb-1">DAWKA / MOC</label>
                <input 
                  type="text" 
                  value={dawka}
                  readOnly
                  className="w-full px-4 py-2.5 bg-slate-100/50 border border-slate-200 text-slate-500 rounded-lg outline-none cursor-not-allowed"
                  placeholder="Uzupełni się automatycznie..."
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">
              Szczegóły w szafce
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Nazwa własna / Notatka (opcjonalnie)</label>
                <input 
                  type="text" 
                  value={nazwaWlasna}
                  onChange={(e) => setNazwaWlasna(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-slate-900 shadow-sm"
                  placeholder="np. Moje tabletki na ból głowy"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Data ważności *</label>
                <input 
                  type="date" 
                  value={dataWaznosci}
                  onChange={(e) => setDataWaznosci(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-slate-900 shadow-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status *</label>
                <select 
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-slate-900 shadow-sm"
                >
                  <option value="w szafce">w szafce</option>
                  <option value="zuzyty">zużyty</option>
                  <option value="przeterminowany">przeterminowany</option>
                  <option value="wyrzucony">wyrzucony</option>
                </select>
              </div>

              <div className="md:col-span-2 flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Ilość *</label>
                  <input 
                    type="number" 
                    value={ilosc}
                    onChange={(e) => setIlosc(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-slate-900 shadow-sm"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Jednostka *</label>
                  <select 
                    value={jednostka}
                    onChange={(e) => setJednostka(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-slate-900 shadow-sm"
                  >
                    <option value="sztuki">sztuki</option>
                    <option value="listek">listek</option>
                    <option value="opakowanie">opakowanie</option>
                    <option value="ml">ml</option>
                    <option value="g">g</option>
                  </select>
                </div>
              </div>

              <div className="md:col-span-2 mt-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">Zdjęcie opakowania</label>
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer px-4 py-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl font-medium transition-colors shadow-sm flex items-center gap-2">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                    <span>Zrób lub wgraj zdjęcie</span>
                    <input type="file" className="hidden" accept="image/*" capture="environment" />
                  </label>
                  <span className="text-sm text-slate-500">Nie wybrano pliku</span>
                </div>
              </div>

            </div>
          </div>

        </form>
      </div>

      <div className="px-6 py-5 bg-slate-50 border-t border-slate-100 rounded-b-2xl flex justify-end gap-3">
        <button 
          type="button" 
          onClick={onCancel}
          className="px-6 py-3 border border-slate-300 text-slate-700 bg-white rounded-xl hover:bg-slate-50 font-medium transition-colors shadow-sm"
        >
          Anuluj
        </button>
        <button 
          type="submit" 
          form="addMedicationForm"
          className="px-8 py-3 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors shadow-sm"
        >
          Zapisz lek
        </button>
      </div>
    </div>
  );
};

export default AddMedication;