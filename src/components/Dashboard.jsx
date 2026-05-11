import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

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
  const [cabinets, setCabinets] = useState([]);
  const [medications, setMedications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedCabinet, setSelectedCabinet] = useState('');
  const [isListActive, setIsListActive] = useState(true);
  const [showArchive, setShowArchive] = useState(false);

  //Wypisanie szafek
  useEffect(() => {
    const fetchCabinets = async () => {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const { data, error } = await supabase
        .from('szafki')
        .select('*')
        .eq('id_wlasciciela', user.id);

      //Ustawienie pierwszej szafki jako domyślnej, jeśli istnieje
      if (!error && data) {
        setCabinets(data);
        if (data.length > 0) {
          setSelectedCabinet(data[0].id_szafki);
        }
      }
      setIsLoading(false);
    };

    fetchCabinets();
  }, []);
  
//Wypisanie leków z szafki
  useEffect(() => {
    const fetchMedications = async () => {
      if (!selectedCabinet) return;

      const { data, error } = await supabase
        .from('zasoby')
        .select('*')
        .eq('id_szafki', selectedCabinet);

      if (!error) {
        setMedications(data || []);
      }
    };

    fetchMedications();
  }, [selectedCabinet]);

  
  // Leki aktywne = 'w szafce'
  const activeMedications = medications.filter(medication => medication.status === 'w szafce');
  // Archiwum to wszystkie pozostałe statusy
  const archivedMedications = medications.filter(medication => medication.status !== 'w szafce');

  const MedicationCard = ({ medication, isArchived }) => {
    const colors = isArchived 
      ? 'bg-slate-50 border-slate-200 text-slate-500 opacity-70' 
      : checkExpiration(medication.data_waznosci);
    
    return (
      <div className={`p-4 border rounded-xl shadow-sm mb-3 flex flex-row justify-between items-center transition-colors ${colors}`}>
        <div>
          <h3 className={`text-lg font-semibold ${isArchived ? 'line-through' : ''}`}>
            {medication.nazwa_reczna}
          </h3>
          {/* Status leku */}
          {isArchived && <p className="text-[10px] uppercase font-bold opacity-50 tracking-tight">{medication.status}</p>}
          <p className="text-sm mt-0.5 opacity-80">
            Zostało: <span className="font-medium">{medication.ilosc} {medication.jednostka}</span>
          </p>
        </div>
        <div className="text-right">
          <span className="block text-xs uppercase tracking-wider opacity-60 mb-0.5">Ważność</span>
          <span className="font-bold">{medication.data_waznosci}</span>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto mt-20 text-center text-slate-400 font-medium">
        Ładowanie danych z bazy...
      </div>
    );
  }

  if (cabinets.length === 0) {
    return (
      <div className="max-w-3xl mx-auto mt-6 p-8 bg-white border border-slate-200 rounded-xl shadow-sm text-center">
        <h2 className="text-xl font-bold text-slate-800 mb-2">Brak szafek</h2>
        <p className="text-slate-500 mb-6 text-sm">Nie masz jeszcze przypisanej żadnej szafki.</p>
        <button className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-medium transition-colors shadow-sm">
          + Utwórz pierwszą szafkę
        </button>
      </div>
    );
  }
  {/*Główna zawartość dashboardu*/}
  return (
    <div className="max-w-3xl mx-auto mt-6 p-4">
      
      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 mb-8 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="w-full sm:w-auto">
          <label className="text-sm font-medium text-slate-500 mb-1.5 block">Wybierz szafkę:</label>
          <select 
            value={selectedCabinet}
            onChange={(e) => setSelectedCabinet(e.target.value)}
            className="w-full sm:w-72 bg-slate-50 border border-slate-300 text-slate-800 text-lg rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
          >
            {cabinets.map(cabinet => (
              <option key={cabinet.id_szafki} value={cabinet.id_szafki}>
                {cabinet.nazwa_szafki}
              </option>
            ))}
          </select>
        </div>
        
        <button className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-medium transition-colors shadow-sm flex items-center justify-center gap-2">
          <span className="text-xl leading-none">+</span> Dodaj lek
        </button>
      </div>
      
      {/*Sekcja leków aktywnych*/}
      <div className="mb-8">
        <button 
          onClick={() => setIsListActive(!isListActive)}
          className="w-full flex items-center justify-between mb-4 p-2 -ml-2 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-slate-800">Leki w szafce</h2>
            <span className="bg-slate-200 text-slate-700 py-0.5 px-2.5 rounded-full text-sm font-semibold">
              {activeMedications.length}
            </span>
          </div>
          <svg className={`w-5 h-5 text-slate-500 transform transition-transform ${isListActive ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
        </button>
        
        {isListActive && (
          <div>
            {activeMedications.length > 0 ? (
              activeMedications.map(medication => <MedicationCard key={medication.id_zasobu} medication={medication} isArchived={false} />)
            ) : (
              <div className="bg-white p-8 rounded-xl border border-dashed border-slate-300 text-center text-slate-500">
                Brak leków w tej szafce.
              </div>
            )}
          </div>
        )}
      </div>


      {/*Sekcja archiwum leków*/}
      <div>
        <button 
          onClick={() => setShowArchive(!showArchive)}
          className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 p-4 rounded-xl border border-slate-200 flex justify-between items-center transition-colors font-medium"
        >
          <div className="flex items-center gap-2">
            <span>Archiwum</span>
            <span className="bg-white text-slate-500 py-0.5 px-2 rounded-full text-xs font-bold border border-slate-200">
              {archivedMedications.length}
            </span>
          </div>
          <svg className={`w-5 h-5 transform transition-transform ${showArchive ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
        </button>

        {showArchive && (
          <div className="mt-3">
            {archivedMedications.length > 0 ? (
              archivedMedications.map(medication => <MedicationCard key={medication.id_zasobu} medication={medication} isArchived={true} />)
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