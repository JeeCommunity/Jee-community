import React, { useState, useMemo } from 'react';
import { Search } from 'lucide-react';

export const CONSTANTS = [
  { name: 'Speed of light in vacuum', symbol: 'c', val: '299792458', unit: 'm/s' },
  { name: 'Planck constant', symbol: 'h', val: '6.62607015e-34', unit: 'J·s' },
  { name: 'Elementary charge', symbol: 'e', val: '1.602176634e-19', unit: 'C' },
  { name: 'Electron mass', symbol: 'm_e', val: '9.1093837015e-31', unit: 'kg' },
  { name: 'Proton mass', symbol: 'm_p', val: '1.67262192369e-27', unit: 'kg' },
  { name: 'Neutron mass', symbol: 'm_n', val: '1.6749275e-27', unit: 'kg' },
  { name: 'Avogadro constant', symbol: 'N_A', val: '6.02214076e23', unit: 'mol⁻¹' },
  { name: 'Boltzmann constant', symbol: 'k', val: '1.380649e-23', unit: 'J/K' },
  { name: 'Gas constant', symbol: 'R', val: '8.314462618', unit: 'J/(mol·K)' },
  { name: 'Gravitational constant', symbol: 'G', val: '6.67430e-11', unit: 'm³/(kg·s²)' },
  { name: 'Permittivity of free space', symbol: 'ε_0', val: '8.8541878128e-12', unit: 'F/m' },
  { name: 'Permeability of free space', symbol: 'μ_0', val: '1.25663706212e-6', unit: 'N/A²' },
  { name: 'Standard gravity', symbol: 'g', val: '9.80665', unit: 'm/s²' },
  { name: 'Pi', symbol: 'π', val: '3.141592653589793', unit: '' },
  { name: 'Euler number', symbol: 'e', val: '2.718281828459045', unit: '' },
];

export default function ConstantsTab({ onInsert }: { onInsert?: (val: string) => void }) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const s = search.toLowerCase();
    return CONSTANTS.filter(c => c.name.toLowerCase().includes(s) || c.symbol.toLowerCase().includes(s));
  }, [search]);

  const handleInsert = (val: string) => {
    if (onInsert) onInsert(val);
  };

  return (
    <div className="flex-1 flex flex-col w-full h-full p-3 sm:p-4 gap-4">
      <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-sm overflow-hidden flex flex-col h-full max-w-2xl mx-auto w-full">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">JEE Constants</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Search and insert standard constants into your calculation</p>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search constant (e.g. Planck)..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-col gap-2 overflow-y-auto pr-1 hide-scrollbar">
          {filtered.map(c => (
            <div key={c.symbol} className="flex flex-col p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white mr-2">{c.name}</span>
                  <span className="px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-xs font-mono rounded">{c.symbol}</span>
                </div>
                <button 
                  onClick={() => handleInsert(c.val)}
                  className="text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 px-2 py-1 rounded font-bold hover:bg-blue-200 dark:hover:bg-blue-900/60 transition-colors shrink-0"
                >
                  Insert
                </button>
              </div>
              <div className="font-mono text-sm text-slate-600 dark:text-slate-400">
                {c.val} <span className="text-xs text-slate-400 dark:text-slate-500">{c.unit}</span>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-6 text-slate-500 text-sm">No constants found</div>
          )}
        </div>
      </div>
    </div>
  );
}
