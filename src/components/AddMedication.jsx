import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Camera, Database, CameraIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';

const AddMedication = ({ cabinetId, onSuccess, onCancel, showToast }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isScanning, setIsScanning] = useState(false);

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      ean: '',
      oficjalnaNazwa: '',
      dawka: '',
      ilosc_tabletek: '',
      nazwaWlasna: '',
      dataWaznosci: '',
      ilosc: '',
      jednostka: 'sztuki',
      status: 'w szafce'
    }
  });

  // Aparat do skanowania kodów
  useEffect(() => {
    let scanner = null;
    
    if (isScanning) {
      setTimeout(() => {
        scanner = new Html5Qrcode("reader");

        scanner.start(
          { facingMode: "environment" }, 
          { 
            fps: 15, 
            qrbox: { width: 320, height: 120 }, 
            formatsToSupport: [
              Html5QrcodeSupportedFormats.EAN_13,
              Html5QrcodeSupportedFormats.EAN_8,
              Html5QrcodeSupportedFormats.CODE_128
            ]
          },
          (decodedText) => {
            scanner.stop().then(() => {
              scanner.clear();
              setIsScanning(false);
              showToast?.('Zeskanowano kod!', 'success');
              
              handleSearchChange({ target: { value: decodedText } });
              setValue('ean', decodedText, { shouldValidate: true });
              
            }).catch(err => console.log("Błąd zamykania kamery", err));
          },
          (errorMessage) => {
          }
        ).catch((err) => {
          console.log("Brak uprawnień lub problem z aparatem:", err);
          showToast?.('Nie udało się uruchomić aparatu', 'error');
          setIsScanning(false);
        });
      }, 100);
    }

    return () => {
      if (scanner) {
        try {
          scanner.stop().then(() => scanner.clear()).catch(() => {});
        } catch (e) {}
      }
    };
  }, [isScanning]);

  // Wyszukiwarka po ean lub nazwie leku
  const handleSearchChange = async (e) => {
    setSearchQuery(e.target.value);

    if (!e.target.value) {
      setSuggestions([]);
      return;
    }

    const isEan = /^\d+$/.test(e.target.value);
    
    let dbQuery = supabase.from('baza_lekow').select('ean, nazwa_leku, dawka, ilosc_tabletek').limit(8);
      
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
    setValue('ean', lek.ean);
    setValue('oficjalnaNazwa', lek.nazwa_leku);
    setValue('dawka', lek.dawka || 'Brak danych');
    setValue('ilosc_tabletek', lek.ilosc_tabletek || 'Brak danych');
    setSearchQuery(lek.nazwa_leku); 
    setSuggestions([]); 
  };

  const onSubmit = async (data) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    const zapisywanaNazwa = data.nazwaWlasna ? data.nazwaWlasna : data.oficjalnaNazwa;

    // Zapis leku do szafki do bazy danych
    await supabase.from('zasoby').insert([{
      id_szafki: cabinetId,
      id_uzytkownika_dodal: user.id,
      ean_leku: data.ean,
      nazwa_reczna: zapisywanaNazwa,
      data_waznosci: data.dataWaznosci,
      ilosc: data.ilosc,
      jednostka: data.jednostka,
      status: data.status
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
    <div className="max-w-3xl mx-auto mt-6 bg-white rounded-2xl border border-slate-200 shadow-sm custom-fade">
      
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
                    <div className="text-xs text-slate-500 mt-1">
                      EAN: {s.ean}
                      {s.dawka && ` • Dawka: ${s.dawka}`}
                      {s.ilosc_tabletek && ` • Ilość tabletek: ${s.ilosc_tabletek}`}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button 
            type="button" 
            onClick={() => setIsScanning(true)}
            className="px-5 py-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2"
            title="Skanuj kod aparatem"
          >
            <Camera className="w-5 h-5" />
          </button>
        </div>
        
        {/* Widok kamery */}
        {isScanning && (
          <div className="mt-4 p-4 border border-slate-200 rounded-xl bg-slate-50/50">
            <div className="text-sm font-medium text-slate-700 mb-2">Nakieruj prostokąt na kod kreskowy</div>
            <div id="reader" className="w-full rounded-lg overflow-hidden border border-slate-300 bg-black"></div>
            <button 
              type="button" 
              onClick={() => setIsScanning(false)}
              className="mt-3 w-full py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Anuluj i zamknij aparat
            </button>
          </div>
        )}
      </div>

      <div className="p-6 sm:p-8">
        <form id="addMedicationForm" onSubmit={handleSubmit(onSubmit)} className="space-y-8" noValidate>

          {/* Zablokowane dane z bazy */}
          <div>
            <div className="mb-4">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Database className="w-4 h-4 text-slate-400" />
                Dane z rejestru (zablokowane)
              </h3>
              <p className="text-xs text-slate-500">
                Wypełniane automatycznie po wybraniu leku. Brak możliwości edycji.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 bg-slate-50/50 p-5 rounded-xl border border-slate-100">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">KOD EAN</label>
                <input 
                  type="text" 
                  readOnly
                  {...register("ean")}
                  className="w-full px-4 py-2.5 bg-slate-100/50 border border-slate-200 text-slate-500 rounded-lg outline-none cursor-not-allowed"
                  placeholder="Uzupełni się automatycznie..."
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">OFICJALNA NAZWA LEKU</label>
                <input 
                  type="text" 
                  readOnly
                  {...register("oficjalnaNazwa")}
                  className="w-full px-4 py-2.5 bg-slate-100/50 border border-slate-200 text-slate-500 rounded-lg outline-none cursor-not-allowed"
                  placeholder="Uzupełni się automatycznie..."
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">DAWKA / MOC</label>
                <input 
                  type="text" 
                  readOnly
                  {...register("dawka")}
                  className="w-full px-4 py-2.5 bg-slate-100/50 border border-slate-200 text-slate-500 rounded-lg outline-none cursor-not-allowed"
                  placeholder="Uzupełni się automatycznie..."
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">WIELKOŚĆ OPAKOWANIA</label>
                <input 
                  type="text" 
                  readOnly
                  {...register("ilosc_tabletek")}
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
                  {...register("nazwaWlasna")}
                  className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-slate-900 shadow-sm"
                  placeholder="np. Moje tabletki na ból głowy"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Data ważności *</label>
                <input 
                  type="date" 
                  {...register("dataWaznosci", { required: "Wybierz datę ważności" })}
                  className={`w-full px-4 py-3 bg-white border ${errors.dataWaznosci ? 'border-red-500' : 'border-slate-300'} rounded-xl outline-none focus:ring-2 ${errors.dataWaznosci ? 'focus:ring-red-500' : 'focus:ring-slate-900'} shadow-sm`}
                />
                {errors.dataWaznosci && <p className="text-red-500 text-xs font-medium mt-1 pl-1">{errors.dataWaznosci.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status *</label>
                <select 
                  {...register("status")}
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
                    {...register("ilosc", { required: "Wpisz ilość" })}
                    className={`w-full px-4 py-3 bg-white border ${errors.ilosc ? 'border-red-500' : 'border-slate-300'} rounded-xl outline-none focus:ring-2 ${errors.ilosc ? 'focus:ring-red-500' : 'focus:ring-slate-900'} shadow-sm`}
                  />
                  {errors.ilosc && <p className="text-red-500 text-xs font-medium mt-1 pl-1">{errors.ilosc.message}</p>}
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Jednostka *</label>
                  <select 
                    {...register("jednostka")}
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
                    <CameraIcon className="w-4 h-4" />
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
          disabled={isSubmitting}
          className="px-8 py-3 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors disabled:opacity-50 shadow-sm"
        >
          {isSubmitting ? 'Zapisywanie...' : 'Zapisz lek'}
        </button>
      </div>
    </div>
  );
};

export default AddMedication;