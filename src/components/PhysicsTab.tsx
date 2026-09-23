import React, { useState, useMemo } from 'react';
import * as math from 'mathjs';
import { VectorCalculator } from './MathsTab';
import { Search } from 'lucide-react';

export default function PhysicsTab({ onInsert }: { onInsert?: (val: string) => void }) {
  const [activeTool, setActiveTool] = useState('Unit Converter');
  const tools = ['Unit Converter', 'Scientific Notation', 'Vector'];

  return (
    <div className="flex-1 flex flex-col w-full h-full p-3 sm:p-4 gap-4">
      {/* Tool Selector */}
      <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1 shrink-0">
        {tools.map(tool => (
          <button
            key={tool}
            onClick={() => setActiveTool(tool)}
            className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-colors ${
              activeTool === tool 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            {tool}
          </button>
        ))}
      </div>

      {/* Tool Content */}
      <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-sm overflow-y-auto">
        {activeTool === 'Unit Converter' && <UnitConverter />}
        
        {activeTool === 'Scientific Notation' && <ScientificCalculator onInsert={onInsert} />}
        {activeTool === 'Vector' && <VectorCalculator />}
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// Unit Converter
// --------------------------------------------------------------------------
const CONVERSIONS = {
  Length: { base: 'm', units: { m: 1, cm: 0.01, mm: 0.001, km: 1000 } },
  Mass: { base: 'kg', units: { kg: 1, g: 0.001, mg: 0.000001 } },
  Time: { base: 's', units: { s: 1, ms: 0.001, 'μs': 0.000001 } },
  Energy: { base: 'J', units: { J: 1, eV: 1.602176634e-19, keV: 1.602176634e-16, MeV: 1.602176634e-13 } },
  Power: { base: 'W', units: { W: 1, kW: 1000 } },
  Pressure: { base: 'Pa', units: { Pa: 1, atm: 101325, bar: 100000 } },
  Charge: { base: 'C', units: { C: 1, 'μC': 1e-6, nC: 1e-9 } },
  Voltage: { base: 'V', units: { V: 1, mV: 0.001 } },
  Resistance: { base: 'Ω', units: { 'Ω': 1, 'kΩ': 1000, 'MΩ': 1000000 } },
  Frequency: { base: 'Hz', units: { Hz: 1, kHz: 1000, MHz: 1000000 } },
};

function UnitConverter() {
  const categories = Object.keys(CONVERSIONS) as (keyof typeof CONVERSIONS)[];
  const [category, setCategory] = useState<keyof typeof CONVERSIONS>(categories[0]);
  
  const availableUnits = Object.keys(CONVERSIONS[category].units);
  const [fromUnit, setFromUnit] = useState(availableUnits[0]);
  const [toUnit, setToUnit] = useState(availableUnits[1] || availableUnits[0]);
  const [amount, setAmount] = useState('1');

  // Reset units when category changes
  React.useEffect(() => {
    const units = Object.keys(CONVERSIONS[category].units);
    setFromUnit(units[0]);
    setToUnit(units[1] || units[0]);
  }, [category]);

  const convert = () => {
    const val = parseFloat(amount);
    if (isNaN(val)) return '';
    const inBase = val * (CONVERSIONS[category].units as any)[fromUnit];
    const out = inBase / (CONVERSIONS[category].units as any)[toUnit];
    // Formatting nicely
    if (out === 0) return '0';
    if (Math.abs(out) < 0.0001 || Math.abs(out) > 10000) {
      return out.toExponential(4);
    }
    return math.format(out, { precision: 6 });
  };

  const swap = () => {
    setFromUnit(toUnit);
    setToUnit(fromUnit);
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Unit Converter</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Live conversion for Physics units</p>
      </div>

      <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
              category === cat 
              ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400'
              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <div className="flex-1 flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-500">Amount</label>
            <input 
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex-1 flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-500">From</label>
            <select
              value={fromUnit}
              onChange={(e) => setFromUnit(e.target.value)}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {availableUnits.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
        </div>

        <div className="flex justify-center -my-2 z-10 relative">
          <button onClick={swap} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2 rounded-full text-blue-500 shadow-sm hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors">
             <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
             </svg>
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex-1 flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-500">Result</label>
            <div className="bg-slate-100 dark:bg-slate-800 border border-transparent rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono flex items-center h-[42px] overflow-hidden whitespace-nowrap">
              {convert()}
            </div>
          </div>
          <div className="flex-1 flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-500">To</label>
            <select
              value={toUnit}
              onChange={(e) => setToUnit(e.target.value)}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {availableUnits.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// Physics Constants
// --------------------------------------------------------------------------
const CONSTANTS = [
  { name: 'Speed of light', symbol: 'c', val: '299792458', unit: 'm/s' },
  { name: 'Planck constant', symbol: 'h', val: '6.62607015e-34', unit: 'J·s' },
  { name: 'Elementary charge', symbol: 'e', val: '1.602176634e-19', unit: 'C' },
  { name: 'Electron mass', symbol: 'm_e', val: '9.1093837e-31', unit: 'kg' },
  { name: 'Proton mass', symbol: 'm_p', val: '1.67262192e-27', unit: 'kg' },
  { name: 'Neutron mass', symbol: 'm_n', val: '1.6749275e-27', unit: 'kg' },
  { name: 'Avogadro constant', symbol: 'N_A', val: '6.02214076e23', unit: 'mol⁻¹' },
  { name: 'Boltzmann constant', symbol: 'k', val: '1.380649e-23', unit: 'J/K' },
  { name: 'Gas constant', symbol: 'R', val: '8.314462618', unit: 'J/(mol·K)' },
  { name: 'Gravitational constant', symbol: 'G', val: '6.67430e-11', unit: 'm³/(kg·s²)' },
  { name: 'Permittivity of free space', symbol: 'ε_0', val: '8.8541878128e-12', unit: 'F/m' },
  { name: 'Permeability of free space', symbol: 'μ_0', val: '1.25663706212e-6', unit: 'N/A²' },
  { name: 'Standard gravity', symbol: 'g', val: '9.80665', unit: 'm/s²' },
];


// --------------------------------------------------------------------------
// Scientific Notation Calculator
// --------------------------------------------------------------------------
function ScientificCalculator({ onInsert }: { onInsert?: (val: string) => void }) {
  const [expr, setExpr] = useState('');
  
  // Custom evaluator allowing convenient x10^ syntax for Physics
  // Maps standard entry to mathjs parseable format
  const parseSciNotation = (text: string) => {
    let parsed = text;
    // Handle specific string patterns like "3 x 10^8" or "3 * 10^8"
    parsed = parsed.replace(/x/g, '*');
    parsed = parsed.replace(/×/g, '*');
    parsed = parsed.replace(/(\d+)\s*\*\s*10\^([-\d]+)/g, '($1 * 10^$2)');
    return parsed;
  };

  const solve = () => {
    if (!expr.trim()) return null;
    try {
      const parsed = parseSciNotation(expr);
      const dec = math.evaluate(parsed);
      
      // Formatting in standard scientific notation A × 10^B
      const formatted = Number(dec).toExponential(6);
      const [mantissa, exponent] = formatted.split('e');
      const cleanMantissa = parseFloat(mantissa).toString(); // remove trailing zeros
      const expSign = exponent.startsWith('+') ? '' : '-';
      const cleanExp = exponent.replace(/^[+-]/, '');
      const finalExp = expSign === '-' ? `-${cleanExp}` : cleanExp;
      
      return { 
        val: dec, 
        sci: `${cleanMantissa} × 10^${finalExp}`
      };
    } catch(e) {
      return { error: 'Invalid expression' };
    }
  };

  const res = solve();

  return (
    <div className="flex flex-col gap-4 h-full">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Scientific Notation</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Calculate large/small numbers easily (e.g. 3*10^8)</p>
      </div>

      <div className="flex flex-col gap-2">
         <textarea
           value={expr}
           onChange={(e) => setExpr(e.target.value)}
           placeholder="3 * 10^8 * 2 * 10^-6"
           className="w-full h-24 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-lg text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
         />
         <div className="flex gap-2">
            <button onClick={() => setExpr(prev => prev + ' * 10^')} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700">
               × 10ⁿ
            </button>
            <button onClick={() => setExpr('')} className="px-3 py-1.5 bg-red-50 dark:bg-red-900/20 rounded-lg text-sm font-bold text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 ml-auto">
               Clear
            </button>
         </div>
      </div>

      <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 mt-2">
        {!res ? (
            <div className="text-slate-500 dark:text-slate-400 text-sm text-center py-4">Enter an expression to calculate.</div>
        ) : res.error ? (
            <div className="text-red-500 font-mono text-sm break-all">{res.error}</div>
        ) : (
            <div className="flex flex-col gap-2">
               <div className="text-xs font-bold text-slate-500">Result (Scientific Notation)</div>
               <div className="text-xl font-bold font-mono text-slate-900 dark:text-white break-all flex justify-between items-center">
                  <span>{res.sci}</span>
                  {onInsert && (
                     <button onClick={() => onInsert(res.val.toString())} className="text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 px-2 py-1 rounded font-bold hover:bg-blue-200 dark:hover:bg-blue-900/60 transition-colors">
                        Insert
                     </button>
                  )}
               </div>
               <div className="text-xs font-bold text-slate-500 mt-2">Result (Decimal)</div>
               <div className="text-lg font-mono text-slate-600 dark:text-slate-400 break-all">{res.val.toString()}</div>
            </div>
        )}
      </div>
    </div>
  );
}

