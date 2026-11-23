import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { X } from 'lucide-react';

const ActivityLog = ({ cabinetId, onClose }) => {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const fetchLogs = async () => {
      const { data } = await supabase
        .from('logi_aktywnosci')
        .select('id_logu, operacja, szczegoly, data_operacji, uzytkownicy(imie, nazwisko)')
        .eq('id_szafki', cabinetId)
        .order('data_operacji', { ascending: false })
        .limit(30);
        
      if (data) setLogs(data);
    };
    if (cabinetId) fetchLogs();
  }, [cabinetId]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 custom-fade" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200" onClick={(e) => e.stopPropagation()}>
        
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
          <h2 className="text-xl font-bold text-slate-800">Historia aktywności</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-3">
          {logs.length === 0 && <p className="text-center text-slate-500 py-4">Brak wpisów.</p>}
          
          {logs.map(log => (
            <div key={log.id_logu} className="p-4 border border-slate-200 rounded-xl bg-white flex flex-col sm:flex-row gap-2 sm:gap-4 sm:items-center hover:bg-slate-50 transition-colors">
              <div className="flex-1">
                <p className="text-sm text-slate-800 font-medium">{log.szczegoly}</p>
              </div>
              <div className="text-xs text-slate-500 shrink-0 sm:text-right">
                <p className="font-semibold text-slate-700">{log.uzytkownicy?.imie} {log.uzytkownicy?.nazwisko}</p>
                <p>{new Date(log.data_operacji).toLocaleString('pl-PL')}</p>
              </div>
            </div>
          ))}
        </div>
        
      </div>
    </div>
  );
};

export default ActivityLog;