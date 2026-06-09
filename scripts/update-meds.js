import { createClient } from '@supabase/supabase-js';
import Papa from 'papaparse';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY; 

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const CSV_URL = 'https://rejestry.ezdrowie.gov.pl/api/rpl/medicinal-products/public-pl-report/get-csv'; 

async function runUpdate() {
  try {
    const response = await fetch(CSV_URL);
    if (!response.ok) throw new Error(`Błąd pobierania: ${response.statusText}`);
    const csvText = await response.text();

    const parsed = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      delimiter: ';' 
    });

    const mappedData = [];

    parsed.data.forEach(row => {
      const rawPackages = row['Opakowanie'] || '';
      const packageLines = rawPackages.split('\n').map(s => s.trim()).filter(s => s !== '');
      
      let currentEan = null;

      packageLines.forEach(line => {
        const eanMatch = line.match(/^(\d{13,14})/);
        
        // usunięcie zer z przodu kodu ean
        if (eanMatch) {
          currentEan = eanMatch[1].replace(/^0+/, ''); 
        } 
        else if (currentEan && line) {
          mappedData.push({
            ean: currentEan, 
            nazwa_leku: row['Nazwa Produktu Leczniczego'],
            rodzaj_podania: row['Droga podania - Gatunek - Tkanka - Okres karencji'], 
            dawka: row['Moc'],
            ilosc_tabletek: line, 
            postac_farmaceutyczna: row['Postać farmaceutyczna'],
            substancja_czynna: row['Substancja czynna'],
            ulotka_url: row['Ulotka'] || null
          });
          currentEan = null; 
        }
      });
    });

    // Zapis do bazy w paczkach po 1000 rekordów
    const chunkSize = 1000;
    let successCount = 0;

    for (let i = 0; i < mappedData.length; i += chunkSize) {
      const chunk = mappedData.slice(i, i + chunkSize);
      
      const { error } = await supabase
        .from('baza_lekow')
        .upsert(chunk, { onConflict: 'ean' });
      
      if (!error) {
        successCount += chunk.length;
      } else {
        console.error('Błąd przy zapisie paczki:', error);
      }
    }

    await supabase.from('logi_aktywnosci').insert([{
      operacja: 'aktualizacja_bazy',
      szczegoly: `Pomyślnie zaktualizowano/dodano ${successCount} rekordów.`
    }]);
    
    console.log(`Zakończono. Wgrano ${successCount} rekordów.`);
    process.exit(0);

  } catch (error) {
    await supabase.from('logi_aktywnosci').insert([{
      operacja: 'aktualizacja_bazy',
      szczegoly: `BŁĄD KRYTYCZNY - ${error.message}`
    }]);
    
    console.error(error);
    process.exit(1);
  }
}

runUpdate();