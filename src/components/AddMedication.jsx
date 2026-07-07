import React, { useState } from 'react';

const AddMedication = ({ cabinetId, onSuccess, onCancel }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const [ean, setEan] = useState('');
  const [oficjalnaNazwa, setOficjalnaNazwa] = useState('');
  const [dawka, setDawka] = useState('');


  const [nazwaWlasna, setNazwaWlasna] = useState('');
  const [dataWaznosci, setDataWaznosci] = useState('');
  const [ilosc, setIlosc] = useState('');
  const [jednostka, setJednostka] = useState('sztuki');
  const [status, setStatus] = useState('w szafce');

  const handleSearch = () => {
    // Miejsce na dodawanie do bazy danych i wyszukiwarkę
  };

  const handleCameraScan = () => {
    // Miejsce na skaner ean
  };

  return (
    <div className="max-w-3xl mx-auto mt-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
      
      {/* Wyszukiwarka */}
      <div className="p-6 sm:p-8 border-b border-slate-100">
        <h2 className="text-xl font-bold text-slate-800 mb-6">Dodaj lek do szafki</h2>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-slate-900"
            placeholder="Zeskanuj, wpisz EAN lub nazwę leku..."
          />
          <button 
            type="button" 
            onClick={handleCameraScan}
            className="px-5 py-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2"
            title="Skanuj kod aparatem"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
          </button>
          <button 
            type="button" 
            onClick={handleSearch}
            className="px-6 py-3 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors shadow-sm whitespace-nowrap"
          >
            Szukaj w bazie
          </button>
        </div>
      </div>

      <div className="p-6 sm:p-8">
        <form className="space-y-8">
          
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

          {/* Dane wpisywane przez użytkownika */}
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
          type="button" 
          className="px-8 py-3 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors shadow-sm"
        >
          Zapisz lek
        </button>
      </div>
    </div>
  );
};

export default AddMedication;