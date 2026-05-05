import React, { useState } from 'react';

// dane do testowania
const mockSzafki = [
  { id_szafki: 's1', nazwa: 'Domowa Apteczka' },
  { id_szafki: 's2', nazwa: 'Apteczka Samochodowa' }
];

const mockLeki = [
  { id_zasobu: '1', id_szafki: 's1', nazwa_reczna: 'Apap Noc', data_waznosci: '2028-10-15', ilosc: 12, jednostka: 'tabl.', archiwum: false },
  { id_zasobu: '2', id_szafki: 's1', nazwa_reczna: 'Witamina C', data_waznosci: '2026-05-15', ilosc: 40, jednostka: 'kaps.', archiwum: false }, 
  { id_zasobu: '3', id_szafki: 's1', nazwa_reczna: 'Syrop na kaszel', data_waznosci: '2022-01-10', ilosc: 1, jednostka: 'szt.', archiwum: false },
  { id_zasobu: '4', id_szafki: 's1', nazwa_reczna: 'Stare Plastry', data_waznosci: '2021-12-01', ilosc: 5, jednostka: 'szt.', archiwum: true },
  { id_zasobu: '5', id_szafki: 's2', nazwa_reczna: 'Bandaż', data_waznosci: '2030-12-01', ilosc: 2, jednostka: 'szt.', archiwum: false }
];


const checkExpiration = (dateString) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0); 
  
  const expDate = new Date(dateString);
  expDate.setHours(0, 0, 0, 0);
  
  const diffDays = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return 'bg-red-50 border-red-200 text-red-900';
  }
  if (diffDays <= 14) {
    return 'bg-orange-50 border-orange-200 text-orange-900';
  }
  return 'bg-white border-slate-200 text-slate-800';
};

const Dashboard = () => {
  const [wybranaSzafka, setWybranaSzafka] = useState(mockSzafki[0].id_szafki);
  const [listaAktywna, setListaAktywna] = useState(true);
  const [pokazArchiwum, setPokazArchiwum] = useState(false);


  const lekiWSzafce = mockLeki.filter(lek => lek.id_szafki === wybranaSzafka);
  const lekiAktywne = lekiWSzafce.filter(lek => !lek.archiwum);
  const lekiZarchiwizowane = lekiWSzafce.filter(lek => lek.archiwum);

  
  const KafelLeku = ({ lek, isArchived }) => {
    const kolory = isArchived 
      ? 'bg-slate-50 border-slate-200 text-slate-500 opacity-70' 
      : checkExpiration(lek.data_waznosci);
    
    return (
      <div className={`p-4 border rounded-xl shadow-sm mb-3 flex flex-row justify-between items-center transition-colors ${kolory}`}>
        <div>
          <h3 className={`text-lg font-semibold ${isArchived ? 'line-through' : ''}`}>
            {lek.nazwa_reczna}
          </h3>
          <p className="text-sm mt-0.5 opacity-80">
            Zostało: <span className="font-medium">{lek.ilosc} {lek.jednostka}</span>
          </p>
        </div>
        <div className="text-right">
          <span className="block text-xs uppercase tracking-wider opacity-60 mb-0.5">Ważność</span>
          <span className="font-bold">{lek.data_waznosci}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-3xl mx-auto mt-6 p-4">
      
      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 mb-8 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="w-full sm:w-auto">
          <label className="text-sm font-medium text-slate-500 mb-1.5 block">Wybierz szafkę:</label>
          <select 
            value={wybranaSzafka}
            onChange={(e) => setWybranaSzafka(e.target.value)}
            className="w-full sm:w-72 bg-slate-50 border border-slate-300 text-slate-800 text-lg rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
          >
            {mockSzafki.map(szafka => (
              <option key={szafka.id_szafki} value={szafka.id_szafki}>
                {szafka.nazwa}
              </option>
            ))}
          </select>
        </div>
        
        <button className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-medium transition-colors shadow-sm flex items-center justify-center gap-2">
          <span className="text-xl leading-none">+</span> Dodaj lek
        </button>
      </div>

    {}
      <div className="mb-8">
        <button 
          onClick={() => setListaAktywna(!listaAktywna)}
          className="w-full flex items-center justify-between mb-4 p-2 -ml-2 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-slate-800">Leki w szafce</h2>
            <span className="bg-slate-200 text-slate-700 py-0.5 px-2.5 rounded-full text-sm font-semibold">
              {lekiAktywne.length}
            </span>
          </div>
          <svg className={`w-5 h-5 text-slate-500 transform transition-transform ${listaAktywna ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
        </button>
        
        {listaAktywna && (
          <div>
            {lekiAktywne.length > 0 ? (
              lekiAktywne.map(lek => <KafelLeku key={lek.id_zasobu} lek={lek} isArchived={false} />)
            ) : (
              <div className="bg-white p-8 rounded-xl border border-dashed border-slate-300 text-center text-slate-500">
                Brak leków w tej szafce.
              </div>
            )}
          </div>
        )}
      </div>

   
    {/* Sekcja Archiwum */}
      <div>
        <button 
          onClick={() => setPokazArchiwum(!pokazArchiwum)}
          className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 p-4 rounded-xl border border-slate-200 flex justify-between items-center transition-colors font-medium"
        >
          <div className="flex items-center gap-2">
            <span>Archiwum</span>
            <span className="bg-white text-slate-500 py-0.5 px-2 rounded-full text-xs font-bold border border-slate-200">
              {lekiZarchiwizowane.length}
            </span>
          </div>
          <svg className={`w-5 h-5 transform transition-transform ${pokazArchiwum ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
        </button>

        {pokazArchiwum && (
          <div className="mt-3">
            {lekiZarchiwizowane.length > 0 ? (
              lekiZarchiwizowane.map(lek => <KafelLeku key={lek.id_zasobu} lek={lek} isArchived={true} />)
            ) : (
              <div className="p-6 text-center text-slate-400 border border-transparent">
                Archiwum jest puste.
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
};

export default Dashboard;