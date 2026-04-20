import React from 'react';
import Header from './components/Header';

function App() {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      <Header />
      
      <main className="max-w-5xl mx-auto px-6 py-24">
        <h1 className="text-4xl font-bold mb-4">Witaj w e-Apteczce</h1>
        <p className="text-slate-500">Brak leków w bazie.</p>
      </main>
    </div>
  );
}

export default App;