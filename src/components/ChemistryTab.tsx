import React, { useState } from 'react';
import * as math from 'mathjs';

export default function ChemistryTab() {
  const [activeTool, setActiveTool] = useState('Moles & Solutions');
  const tools = ['Moles & Solutions', 'Dilution', 'pH / pOH', 'Gas Law', 'Electrochemistry'];

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
        {activeTool === 'Moles & Solutions' && <MolesAndSolutions />}
        {activeTool === 'Dilution' && <DilutionCalculator />}
        {activeTool === 'pH / pOH' && <PhCalculator />}
        {activeTool === 'Gas Law' && <GasLawCalculator />}
        {activeTool === 'Electrochemistry' && <Electrochemistry />}
      </div>
    </div>
  );
}

function Input({ label, value, onChange, placeholder, unit }: any) {
    return (
        <div className="flex flex-col gap-1.5 flex-1">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</label>
            <div className="relative">
                <input 
                    type="number" 
                    value={value ?? ""} 
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-3 pr-10 py-2 text-slate-900 dark:text-white font-mono text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {unit && <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold">{unit}</span>}
            </div>
        </div>
    );
}

function ResultRow({ label, exact, decimal, type = 'default' }: any) {
    const isError = type === 'error';
    return (
        <div className="flex flex-col py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">{label}</span>
            <div className={`font-mono text-lg break-all ${isError ? 'text-red-500' : 'text-slate-900 dark:text-white'}`}>
                {exact || (decimal !== undefined ? decimal : '-')}
            </div>
            {decimal !== undefined && exact && exact !== decimal && (
                <div className="text-sm font-mono text-slate-500 dark:text-slate-400 mt-0.5 break-all">
                    ≈ {decimal}
                </div>
            )}
        </div>
    );
}

// --------------------------------------------------------------------------
// 1. Moles & Solutions
// --------------------------------------------------------------------------
function MolesAndSolutions() {
    const [mode, setMode] = useState('moles');
    
    // Moles
    const [mass, setMass] = useState('');
    const [molarMass, setMolarMass] = useState('');
    // Molarity
    const [moles, setMoles] = useState('');
    const [volL, setVolL] = useState('');
    // Molality
    const [solventKg, setSolventKg] = useState('');
    // Normality
    const [nFactor, setNFactor] = useState('');

    const solveMoles = () => {
        const m = parseFloat(mass), mm = parseFloat(molarMass);
        if (isNaN(m) || isNaN(mm) || mm === 0) return null;
        const mol = m / mm;
        const particles = mol * 6.02214076e23;
        return { 
            moles: math.format(mol, { precision: 5 }), 
            particles: Number(particles).toExponential(4) 
        };
    };

    const solveMolarity = () => {
        const mol = parseFloat(moles), v = parseFloat(volL);
        if (isNaN(mol) || isNaN(v) || v === 0) return null;
        return { m: math.format(mol / v, { precision: 5 }) };
    };

    const solveMolality = () => {
        const mol = parseFloat(moles), kg = parseFloat(solventKg);
        if (isNaN(mol) || isNaN(kg) || kg === 0) return null;
        return { m: math.format(mol / kg, { precision: 5 }) };
    };

    const solveNormality = () => {
        const mm = parseFloat(molarMass), m = parseFloat(mass), v = parseFloat(volL), nf = parseFloat(nFactor);
        if ([mm, m, v, nf].some(isNaN) || mm === 0 || v === 0) return null;
        const eqWt = mm / nf;
        const equivalents = m / eqWt;
        const norm = equivalents / v;
        return { 
            eqWt: math.format(eqWt, { precision: 5 }), 
            norm: math.format(norm, { precision: 5 }) 
        };
    };

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Moles & Solutions</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Calculate moles, molarity, molality, and normality</p>
            </div>

            <div className="flex gap-2 flex-wrap">
                {[{id: 'moles', lbl: 'Moles'}, {id: 'molarity', lbl: 'Molarity (M)'}, {id: 'molality', lbl: 'Molality (m)'}, {id: 'normality', lbl: 'Normality (N)'}].map(b => (
                    <button key={b.id} onClick={() => setMode(b.id)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${mode === b.id ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>{b.lbl}</button>
                ))}
            </div>

            <div className="flex flex-col gap-4">
                {mode === 'moles' && (
                    <>
                        <div className="flex gap-3"><Input label="Mass" value={mass} onChange={setMass} unit="g" /><Input label="Molar Mass" value={molarMass} onChange={setMolarMass} unit="g/mol" /></div>
                        <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
                            {solveMoles() ? (
                                <><ResultRow label="Number of Moles (n)" exact={`${solveMoles()?.moles} mol`} /><ResultRow label="Number of Particles" exact={`${solveMoles()?.particles}`} /></>
                            ) : <div className="text-center text-sm text-slate-500">Enter mass and molar mass.</div>}
                        </div>
                    </>
                )}
                {mode === 'molarity' && (
                    <>
                        <div className="flex gap-3"><Input label="Moles of solute" value={moles} onChange={setMoles} unit="mol" /><Input label="Volume of solution" value={volL} onChange={setVolL} unit="L" /></div>
                        <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
                            {solveMolarity() ? <ResultRow label="Molarity (M)" exact={`${solveMolarity()?.m} M (mol/L)`} /> : <div className="text-center text-sm text-slate-500">Enter moles and volume.</div>}
                        </div>
                    </>
                )}
                {mode === 'molality' && (
                    <>
                        <div className="flex gap-3"><Input label="Moles of solute" value={moles} onChange={setMoles} unit="mol" /><Input label="Mass of solvent" value={solventKg} onChange={setSolventKg} unit="kg" /></div>
                        <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
                            {solveMolality() ? <ResultRow label="Molality (m)" exact={`${solveMolality()?.m} m (mol/kg)`} /> : <div className="text-center text-sm text-slate-500">Enter moles and solvent mass.</div>}
                        </div>
                    </>
                )}
                {mode === 'normality' && (
                    <>
                        <div className="grid grid-cols-2 gap-3">
                            <Input label="Molar Mass" value={molarMass} onChange={setMolarMass} unit="g/mol" />
                            <Input label="n-factor" value={nFactor} onChange={setNFactor} unit="" />
                            <Input label="Mass" value={mass} onChange={setMass} unit="g" />
                            <Input label="Volume" value={volL} onChange={setVolL} unit="L" />
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
                            {solveNormality() ? (
                                <><ResultRow label="Equivalent Weight" exact={`${solveNormality()?.eqWt} g/eq`} /><ResultRow label="Normality (N)" exact={`${solveNormality()?.norm} N (eq/L)`} /></>
                            ) : <div className="text-center text-sm text-slate-500">Enter all values.</div>}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

// --------------------------------------------------------------------------
// 2. Dilution
// --------------------------------------------------------------------------
function DilutionCalculator() {
    const [m1, setM1] = useState('');
    const [v1, setV1] = useState('');
    const [m2, setM2] = useState('');
    const [v2, setV2] = useState('');

    const solve = () => {
        const arr = [m1, v1, m2, v2].map(v => v === '' ? null : parseFloat(v));
        const nullCount = arr.filter(v => v === null).length;
        if (nullCount !== 1) return null;
        if (arr.some(v => v !== null && isNaN(v))) return { error: 'Invalid input' };

        const [M1, V1, M2, V2] = arr;
        try {
            if (M1 === null) return { target: 'M₁ (Initial Conc.)', val: (M2! * V2!) / V1! };
            if (V1 === null) return { target: 'V₁ (Initial Vol.)', val: (M2! * V2!) / M1! };
            if (M2 === null) return { target: 'M₂ (Final Conc.)', val: (M1! * V1!) / V2! };
            if (V2 === null) return { target: 'V₂ (Final Vol.)', val: (M1! * V1!) / M2! };
        } catch(e) {
            return { error: 'Math error' };
        }
        return null;
    };

    const res = solve();

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Dilution Calculator</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">M₁V₁ = M₂V₂. Leave exactly ONE field blank.</p>
            </div>

            <div className="flex flex-col gap-4">
                <div className="flex gap-3">
                    <Input label="M₁" value={m1} onChange={setM1} placeholder="e.g. 5" />
                    <Input label="V₁" value={v1} onChange={setV1} placeholder="e.g. 2" />
                </div>
                <div className="flex justify-center text-slate-400 font-bold">=</div>
                <div className="flex gap-3">
                    <Input label="M₂" value={m2} onChange={setM2} placeholder="e.g. 1" />
                    <Input label="V₂" value={v2} onChange={setV2} placeholder="Blank" />
                </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 min-h-[100px] flex items-center justify-center">
                {!res ? (
                    <div className="text-sm text-slate-500">Leave one field empty to compute.</div>
                ) : res.error ? (
                    <ResultRow label="Error" exact={res.error} type="error" />
                ) : (
                    <div className="w-full"><ResultRow label={`Calculated ${res.target}`} exact={math.format(res.val!, { precision: 6 })} /></div>
                )}
            </div>
        </div>
    );
}

// --------------------------------------------------------------------------
// 3. pH / pOH
// --------------------------------------------------------------------------
function PhCalculator() {
    const [val, setVal] = useState('');
    const [type, setType] = useState('pH');

    const solve = () => {
        const v = parseFloat(val);
        if (isNaN(v)) return null;

        let ph, poh, h, oh;
        try {
            if (type === 'pH') { ph = v; poh = 14 - v; h = Math.pow(10, -ph); oh = Math.pow(10, -poh); }
            if (type === 'pOH') { poh = v; ph = 14 - v; h = Math.pow(10, -ph); oh = Math.pow(10, -poh); }
            if (type === '[H+]') { h = v; ph = -Math.log10(h); poh = 14 - ph; oh = Math.pow(10, -poh); }
            if (type === '[OH-]') { oh = v; poh = -Math.log10(oh); ph = 14 - poh; h = Math.pow(10, -ph); }
        } catch(e) {
            return null;
        }

        return {
            ph: math.format(ph, { precision: 4 }),
            poh: math.format(poh, { precision: 4 }),
            h: Number(h).toExponential(4),
            oh: Number(oh).toExponential(4),
            nature: ph! < 7 ? 'Acidic' : ph! > 7 ? 'Basic' : 'Neutral'
        };
    };

    const res = solve();

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">pH & pOH Calculator</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Assumes 25°C (Kw = 1.0 × 10⁻¹⁴)</p>
            </div>

            <div className="flex flex-col gap-3">
                <div className="flex gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shrink-0">
                    {['pH', 'pOH', '[H+]', '[OH-]'].map(t => (
                        <button key={t} onClick={() => setType(t)} className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-bold ${type === t ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`}>{t}</button>
                    ))}
                </div>
                <Input label={`Enter ${type}`} value={val} onChange={setVal} placeholder={type.includes('[') ? "e.g. 1e-4" : "e.g. 4.5"} />
            </div>

            <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
                {!res ? (
                    <div className="text-center text-sm text-slate-500 py-4">Enter a value to compute properties.</div>
                ) : (
                    <>
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-xs font-bold text-slate-500">Nature</span>
                            <span className={`px-2 py-1 rounded text-xs font-bold ${res.nature === 'Acidic' ? 'bg-red-100 text-red-700 dark:bg-red-900/40' : res.nature === 'Basic' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40' : 'bg-green-100 text-green-700 dark:bg-green-900/40'}`}>{res.nature}</span>
                        </div>
                        <ResultRow label="pH" exact={res.ph} />
                        <ResultRow label="pOH" exact={res.poh} />
                        <ResultRow label="[H⁺] (mol/L)" exact={res.h} />
                        <ResultRow label="[OH⁻] (mol/L)" exact={res.oh} />
                    </>
                )}
            </div>
        </div>
    );
}

// --------------------------------------------------------------------------
// 4. Gas Law
// --------------------------------------------------------------------------
function GasLawCalculator() {
    const [target, setTarget] = useState('P');
    const [p, setP] = useState('');
    const [v, setV] = useState('');
    const [n, setN] = useState('');
    const [t, setT] = useState('');
    const [r, setR] = useState('0.0821'); // L atm / K mol

    const solve = () => {
        const P = parseFloat(p), V = parseFloat(v), N = parseFloat(n), T = parseFloat(t), R = parseFloat(r);
        if (isNaN(R)) return null;

        try {
            if (target === 'P') {
                if (isNaN(V) || isNaN(N) || isNaN(T)) return null;
                return { label: 'Pressure (P)', val: (N * R * T) / V, unit: r === '0.0821' ? 'atm' : 'Pa' };
            }
            if (target === 'V') {
                if (isNaN(P) || isNaN(N) || isNaN(T)) return null;
                return { label: 'Volume (V)', val: (N * R * T) / P, unit: r === '0.0821' ? 'L' : 'm³' };
            }
            if (target === 'n') {
                if (isNaN(P) || isNaN(V) || isNaN(T)) return null;
                return { label: 'Moles (n)', val: (P * V) / (R * T), unit: 'mol' };
            }
            if (target === 'T') {
                if (isNaN(P) || isNaN(V) || isNaN(N)) return null;
                return { label: 'Temperature (T)', val: (P * V) / (N * R), unit: 'K' };
            }
        } catch(e) {}
        return null;
    };

    const res = solve();

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Ideal Gas Law</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">PV = nRT</p>
            </div>

            <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-slate-500">Calculate</label>
                    <select value={target} onChange={e => setTarget(e.target.value)} className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="P">Pressure (P)</option>
                        <option value="V">Volume (V)</option>
                        <option value="n">Moles (n)</option>
                        <option value="T">Temperature (T)</option>
                    </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    {target !== 'P' && <Input label="Pressure (P)" value={p} onChange={setP} />}
                    {target !== 'V' && <Input label="Volume (V)" value={v} onChange={setV} />}
                    {target !== 'n' && <Input label="Moles (n)" value={n} onChange={setN} unit="mol" />}
                    {target !== 'T' && <Input label="Temperature (T)" value={t} onChange={setT} unit="K" />}
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-slate-500">Gas Constant (R)</label>
                    <select value={r} onChange={e => setR(e.target.value)} className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="0.0821">0.0821 L·atm/(mol·K)</option>
                        <option value="8.314">8.314 J/(mol·K)</option>
                    </select>
                </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
                {!res ? (
                    <div className="text-center text-sm text-slate-500 py-4">Enter remaining values.</div>
                ) : (
                    <ResultRow label={res.label} exact={`${math.format(res.val, { precision: 5 })} ${res.unit}`} />
                )}
            </div>
        </div>
    );
}

// --------------------------------------------------------------------------
// 5. Electrochemistry
// --------------------------------------------------------------------------
function Electrochemistry() {
    const [mode, setMode] = useState('faraday');
    
    // Faraday
    const [current, setCurrent] = useState('');
    const [time, setTime] = useState('');
    
    // Nernst
    const [e0, setE0] = useState('');
    const [nEl, setNEl] = useState('');
    const [temp, setTemp] = useState('298');
    const [q, setQ] = useState('');

    const solveFaraday = () => {
        const I = parseFloat(current), t = parseFloat(time);
        if (isNaN(I) || isNaN(t)) return null;
        const Q = I * t;
        const F = 96485;
        const molesE = Q / F;
        return { Q: math.format(Q, { precision: 5 }), moles: math.format(molesE, { precision: 5 }) };
    };

    const solveNernst = () => {
        const E0 = parseFloat(e0), n = parseFloat(nEl), T = parseFloat(temp), Q_val = parseFloat(q);
        if ([E0, n, T, Q_val].some(isNaN) || n === 0 || Q_val <= 0) return null;
        const R = 8.314, F = 96485;
        const E = E0 - ((R * T) / (n * F)) * Math.log(Q_val);
        return { E: math.format(E, { precision: 5 }) };
    };

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Electrochemistry</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Faraday's laws & Nernst Equation</p>
            </div>

            <div className="flex gap-2">
                <button onClick={() => setMode('faraday')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${mode === 'faraday' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>Faraday (Q = It)</button>
                <button onClick={() => setMode('nernst')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${mode === 'nernst' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>Nernst Equation</button>
            </div>

            <div className="flex flex-col gap-4">
                {mode === 'faraday' && (
                    <>
                        <div className="flex gap-3">
                            <Input label="Current (I)" value={current} onChange={setCurrent} unit="A" />
                            <Input label="Time (t)" value={time} onChange={setTime} unit="s" />
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
                            {solveFaraday() ? (
                                <><ResultRow label="Total Charge (Q)" exact={`${solveFaraday()?.Q} C`} /><ResultRow label="Moles of Electrons" exact={`${solveFaraday()?.moles} mol`} /></>
                            ) : <div className="text-center text-sm text-slate-500">Enter current and time.</div>}
                        </div>
                    </>
                )}
                {mode === 'nernst' && (
                    <>
                        <div className="grid grid-cols-2 gap-3">
                            <Input label="Standard E°" value={e0} onChange={setE0} unit="V" />
                            <Input label="Electrons (n)" value={nEl} onChange={setNEl} />
                            <Input label="Temp (T)" value={temp} onChange={setTemp} unit="K" />
                            <Input label="Reaction Q" value={q} onChange={setQ} />
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
                            {solveNernst() ? (
                                <ResultRow label="Cell Potential (E_cell)" exact={`${solveNernst()?.E} V`} />
                            ) : <div className="text-center text-sm text-slate-500">Enter all values (Q &gt; 0).</div>}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

