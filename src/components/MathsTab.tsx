import React, { useState } from 'react';
import { evaluateDecimal, evaluateExact } from '../lib/exactMath';
import * as math from 'mathjs';

export default function MathsTab() {
  const [activeTool, setActiveTool] = useState('Quadratic');
  const tools = ['Quadratic', 'Simultaneous', 'Complex', 'Fractions', 'Matrix', 'Vector', 'P & C'];

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
        {activeTool === 'Quadratic' && <QuadraticSolver />}
        {activeTool === 'Simultaneous' && <SimultaneousSolver />}
        {activeTool === 'Complex' && <ComplexCalculator />}
        {activeTool === 'Fractions' && <FractionCalculator />}
        {activeTool === 'Matrix' && <MatrixCalculator />}
        {activeTool === 'Vector' && <VectorCalculator />}
        {activeTool === 'P & C' && <PnCCalculator />}
      </div>
    </div>
  );
}

function Input({ label, value, onChange, placeholder }: any) {
    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</label>
            <input 
                type="number" 
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
        </div>
    );
}

function TextInput({ label, value, onChange, placeholder }: any) {
    return (
        <div className="flex flex-col gap-1.5 w-full">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</label>
            <input 
                type="text" value={value ?? ""}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono text-base focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
            />
        </div>
    );
}

function ResultRow({ label, exact, decimal, type = 'default' }: any) {
    const isError = type === 'error';
    return (
        <div className="flex flex-col py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">{label}</span>
            <div className={`font-mono text-lg ${isError ? 'text-red-500' : 'text-slate-900 dark:text-white'}`}>
                {exact || (decimal !== undefined ? decimal : '-')}
            </div>
            {decimal !== undefined && exact && exact !== decimal && (
                <div className="text-sm font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                    ≈ {decimal}
                </div>
            )}
        </div>
    );
}

// --------------------------------------------------------------------------
// 1. Quadratic Solver
// --------------------------------------------------------------------------
function QuadraticSolver() {
    const [a, setA] = useState('');
    const [b, setB] = useState('');
    const [c, setC] = useState('');

    const solve = () => {
        const A = parseFloat(a);
        const B = parseFloat(b);
        const C = parseFloat(c);

        if (isNaN(A) || isNaN(B) || isNaN(C)) return null;
        if (A === 0) return { error: "Not a quadratic equation (a = 0)" };

        const D = B * B - 4 * A * C;
        let nature = "";
        if (D > 0) nature = "Real and distinct roots";
        else if (D === 0) nature = "Real and equal roots";
        else nature = "Complex conjugate roots";

        let exact1 = "", exact2 = "";
        let dec1 = "", dec2 = "";

        if (D >= 0) {
            const sqrtD = Math.sqrt(D);
            dec1 = ((-B + sqrtD) / (2 * A)).toString();
            dec2 = ((-B - sqrtD) / (2 * A)).toString();
            
            // Try formatting exact
            exact1 = evaluateExact(`(-${B} + sqrt(${D})) / (2 * ${A})`, false, dec1);
            exact2 = evaluateExact(`(-${B} - sqrt(${D})) / (2 * ${A})`, false, dec2);
        } else {
            const sqrtD = Math.sqrt(-D);
            const real = -B / (2 * A);
            const imag = sqrtD / (2 * A);
            const realStr = math.format(real, { precision: 5 });
            const imagStr = math.format(imag, { precision: 5 });
            dec1 = `${realStr} + ${imagStr}i`;
            dec2 = `${realStr} - ${imagStr}i`;
            
            // exact for complex is harder to stringify via exactMath natively right now, just show decimal format or basic fraction format
            exact1 = dec1;
            exact2 = dec2;
        }

        return { D, nature, x1: { exact: exact1, dec: dec1 }, x2: { exact: exact2, dec: dec2 } };
    };

    const res = solve();

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Quadratic Solver</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Solve ax² + bx + c = 0</p>
            </div>

            <div className="grid grid-cols-3 gap-3">
                <Input label="a" value={a} onChange={setA} placeholder="1" />
                <Input label="b" value={b} onChange={setB} placeholder="-5" />
                <Input label="c" value={c} onChange={setC} placeholder="6" />
            </div>

            <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
                {!res ? (
                    <div className="text-slate-500 dark:text-slate-400 text-sm text-center py-4">Enter a, b, and c to see results.</div>
                ) : res.error ? (
                    <ResultRow label="Error" exact={res.error} type="error" />
                ) : (
                    <>
                        <ResultRow label="Discriminant (Δ = b² - 4ac)" exact={res.D} />
                        <ResultRow label="Nature of Roots" exact={res.nature} />
                        <ResultRow label="Root 1 (x₁)" exact={res.x1.exact} decimal={res.x1.dec} />
                        <ResultRow label="Root 2 (x₂)" exact={res.x2.exact} decimal={res.x2.dec} />
                    </>
                )}
            </div>
        </div>
    );
}

// --------------------------------------------------------------------------
// 2. Simultaneous Equations
// --------------------------------------------------------------------------
function SimultaneousSolver() {
    const [a1, setA1] = useState('');
    const [b1, setB1] = useState('');
    const [c1, setC1] = useState('');
    const [a2, setA2] = useState('');
    const [b2, setB2] = useState('');
    const [c2, setC2] = useState('');

    const solve = () => {
        const A1 = parseFloat(a1), B1 = parseFloat(b1), C1 = parseFloat(c1);
        const A2 = parseFloat(a2), B2 = parseFloat(b2), C2 = parseFloat(c2);

        if (isNaN(A1) || isNaN(B1) || isNaN(C1) || isNaN(A2) || isNaN(B2) || isNaN(C2)) return null;

        const D = A1 * B2 - A2 * B1;
        const Dx = C1 * B2 - C2 * B1;
        const Dy = A1 * C2 - A2 * C1;

        if (D === 0) {
            if (Dx === 0 && Dy === 0) return { nature: 'Infinitely many solutions' };
            return { nature: 'No solution' };
        }

        const xDec = Dx / D;
        const yDec = Dy / D;
        
        const xExact = evaluateExact(`${Dx}/${D}`, false, xDec.toString());
        const yExact = evaluateExact(`${Dy}/${D}`, false, yDec.toString());

        return { 
            nature: 'Unique solution',
            x: { exact: xExact, dec: xDec.toString() },
            y: { exact: yExact, dec: yDec.toString() }
        };
    };

    const res = solve();

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Simultaneous Equations</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">a₁x + b₁y = c₁ <br/> a₂x + b₂y = c₂</p>
            </div>

            <div className="flex flex-col gap-4">
                <div className="grid grid-cols-3 gap-3">
                    <Input label="a₁" value={a1} onChange={setA1} placeholder="2" />
                    <Input label="b₁" value={b1} onChange={setB1} placeholder="3" />
                    <Input label="c₁" value={c1} onChange={setC1} placeholder="5" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                    <Input label="a₂" value={a2} onChange={setA2} placeholder="4" />
                    <Input label="b₂" value={b2} onChange={setB2} placeholder="-1" />
                    <Input label="c₂" value={c2} onChange={setC2} placeholder="3" />
                </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
                {!res ? (
                    <div className="text-slate-500 dark:text-slate-400 text-sm text-center py-4">Enter coefficients to solve.</div>
                ) : res.nature !== 'Unique solution' ? (
                    <ResultRow label="Solution Type" exact={res.nature} />
                ) : (
                    <>
                        <ResultRow label="Solution Type" exact={res.nature} />
                        <ResultRow label="x" exact={res.x?.exact} decimal={res.x?.dec} />
                        <ResultRow label="y" exact={res.y?.exact} decimal={res.y?.dec} />
                    </>
                )}
            </div>
        </div>
    );
}

// --------------------------------------------------------------------------
// 3. Complex Numbers
// --------------------------------------------------------------------------
function ComplexCalculator() {
    const [z1, setZ1] = useState('');
    const [z2, setZ2] = useState('');
    const [op, setOp] = useState('add');

    const solve = () => {
        if (!z1 && !z2) return null;
        try {
            let resC: math.Complex | null = null;
            const c1 = z1 ? math.complex(z1) : null;
            const c2 = z2 ? math.complex(z2) : null;

            if (op === 'modarg') {
                if (!c1) return null;
                const polar = c1.toPolar();
                return {
                    isSingle: true,
                    mod: math.format(polar.r, { precision: 6 }),
                    argRad: math.format(polar.phi, { precision: 6 }),
                    argDeg: math.format(polar.phi * 180 / Math.PI, { precision: 6 }),
                    conj: math.conj(c1).toString()
                };
            }

            if (!c1 || !c2) return null;

            switch(op) {
                case 'add': resC = math.add(c1, c2) as math.Complex; break;
                case 'sub': resC = math.subtract(c1, c2) as math.Complex; break;
                case 'mul': resC = math.multiply(c1, c2) as math.Complex; break;
                case 'div': resC = math.divide(c1, c2) as math.Complex; break;
            }

            if (resC) {
                const polar = resC.toPolar();
                return {
                    isSingle: false,
                    result: resC.toString(),
                    mod: math.format(polar.r, { precision: 6 }),
                    argDeg: math.format(polar.phi * 180 / Math.PI, { precision: 6 }),
                };
            }
        } catch (e) {
            return { error: 'Invalid complex number format (use e.g. 2 + 3i)' };
        }
        return null;
    };

    const res = solve();

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Complex Numbers</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Operations and Properties</p>
            </div>

            <div className="flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row gap-3">
                    <TextInput label="z₁" value={z1} onChange={setZ1} placeholder="2 + 3i" />
                    {op !== 'modarg' && (
                        <TextInput label="z₂" value={z2} onChange={setZ2} placeholder="4 - 5i" />
                    )}
                </div>
                
                <div className="flex gap-2 mt-1 flex-wrap">
                    {[
                        { id: 'add', label: 'Add (z₁+z₂)' },
                        { id: 'sub', label: 'Subtract (z₁-z₂)' },
                        { id: 'mul', label: 'Multiply (z₁·z₂)' },
                        { id: 'div', label: 'Divide (z₁/z₂)' },
                        { id: 'modarg', label: 'Properties of z₁' }
                    ].map(btn => (
                        <button
                            key={btn.id}
                            onClick={() => setOp(btn.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                                op === btn.id 
                                ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                        >
                            {btn.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 min-h-[120px]">
                {!res ? (
                    <div className="text-slate-500 dark:text-slate-400 text-sm text-center py-4">Enter complex numbers to calculate.</div>
                ) : res.error ? (
                    <ResultRow label="Error" exact={res.error} type="error" />
                ) : res.isSingle ? (
                    <>
                        <ResultRow label="Modulus |z₁|" exact={res.mod} />
                        <ResultRow label="Argument arg(z₁)" exact={`${res.argDeg}°`} decimal={`${res.argRad} rad`} />
                        <ResultRow label="Conjugate z₁*" exact={res.conj} />
                    </>
                ) : (
                    <>
                        <ResultRow label="Result" exact={res.result} />
                        <ResultRow label="Result Modulus" exact={res.mod} />
                        <ResultRow label="Result Argument" exact={`${res.argDeg}°`} />
                    </>
                )}
            </div>
        </div>
    );
}

// --------------------------------------------------------------------------
// 4. Fractions
// --------------------------------------------------------------------------
function FractionCalculator() {
    const [expr, setExpr] = useState('');

    const solve = () => {
        if (!expr.trim()) return null;
        try {
            const decRes = evaluateDecimal(expr, false);
            if (!decRes || decRes === 'Undefined' || decRes === 'Invalid input') return { error: decRes || 'Invalid' };
            const exRes = evaluateExact(expr, false, decRes);
            return { dec: decRes, exact: exRes || decRes };
        } catch (e) {
            return { error: 'Invalid expression' };
        }
    };

    const res = solve();

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Fraction Calculator</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Evaluate and simplify fractions</p>
            </div>

            <div>
                <TextInput label="Expression" value={expr} onChange={setExpr} placeholder="2/3 + 5/6" />
                <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex gap-2">
                    Examples: 
                    <button onClick={() => setExpr('2/3 + 5/6')} className="text-blue-500 hover:underline">2/3 + 5/6</button>
                    <button onClick={() => setExpr('(1/2) * (4/5)')} className="text-blue-500 hover:underline">(1/2) * (4/5)</button>
                    <button onClick={() => setExpr('15/25')} className="text-blue-500 hover:underline">15/25</button>
                </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
                {!res ? (
                    <div className="text-slate-500 dark:text-slate-400 text-sm text-center py-4">Enter a fraction expression.</div>
                ) : res.error ? (
                    <ResultRow label="Error" exact={res.error} type="error" />
                ) : (
                    <>
                        <ResultRow label="Exact (Simplified)" exact={res.exact} />
                        {res.exact !== res.dec && <ResultRow label="Decimal" exact={res.dec} />}
                    </>
                )}
            </div>
        </div>
    );
}

// --------------------------------------------------------------------------
// 5. Matrix Calculator
// --------------------------------------------------------------------------
function MatrixCalculator() {
    const [size, setSize] = useState<2 | 3>(2);
    const [op, setOp] = useState('add');
    
    // Flattened arrays for state (length 4 or 9)
    const [m1, setM1] = useState<string[]>(Array(9).fill(''));
    const [m2, setM2] = useState<string[]>(Array(9).fill(''));

    const updateM = (setM: any, idx: number, val: string) => {
        setM((prev: string[]) => {
            const next = [...prev];
            next[idx] = val;
            return next;
        });
    };

    const getMatrix = (arr: string[], s: number) => {
        const m = [];
        for (let i = 0; i < s; i++) {
            const row = [];
            for (let j = 0; j < s; j++) {
                const val = parseFloat(arr[i * s + j]);
                if (isNaN(val)) return null;
                row.push(val);
            }
            m.push(row);
        }
        return m;
    };

    const solve = () => {
        const mat1 = getMatrix(m1, size);
        const mat2 = getMatrix(m2, size);
        
        try {
            if (op === 'det') {
                if (!mat1) return null;
                return { single: true, val: math.format(math.det(mat1), { precision: 6 }) };
            }
            if (op === 'inv') {
                if (!mat1) return null;
                const inv = math.inv(mat1);
                return { single: false, mat: inv as number[][] };
            }
            if (op === 'trans') {
                if (!mat1) return null;
                const trans = math.transpose(mat1);
                return { single: false, mat: trans as number[][] };
            }
            if (!mat1 || !mat2) return null;
            if (op === 'add') return { single: false, mat: math.add(mat1, mat2) as number[][] };
            if (op === 'sub') return { single: false, mat: math.subtract(mat1, mat2) as number[][] };
            if (op === 'mul') return { single: false, mat: math.multiply(mat1, mat2) as number[][] };
        } catch (e: any) {
            return { error: e.message || 'Invalid matrix operation' };
        }
        return null;
    };

    const res = solve();

    const renderMatrixInput = (title: string, data: string[], setData: any) => (
        <div className="flex flex-col gap-2 items-center">
            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{title}</span>
            <div className={`grid gap-2 ${size === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                {Array(size * size).fill(0).map((_, i) => (
                    <input 
                        key={i}
                        type="number"
                        value={data[i] ?? ""}
                        onChange={(e) => updateM(setData, i, e.target.value)}
                        className="w-12 h-12 text-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                ))}
            </div>
        </div>
    );

    const renderMatrixResult = (mat: number[][]) => (
        <div className="flex flex-col gap-2 items-center my-2">
            <div className={`grid gap-2 ${mat.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                {mat.map((row, i) => row.map((val, j) => (
                    <div key={`${i}-${j}`} className="w-16 h-12 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-xl font-mono text-sm text-slate-900 dark:text-white">
                        {math.format(val, { precision: 5 })}
                    </div>
                )))}
            </div>
        </div>
    );

    const isSingleOp = op === 'det' || op === 'inv' || op === 'trans';

    return (
        <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Matrix Calculator</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Operations on {size}×{size} matrices</p>
                </div>
                <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                    <button onClick={() => setSize(2)} className={`px-3 py-1 rounded-lg text-sm font-bold ${size === 2 ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`}>2×2</button>
                    <button onClick={() => setSize(3)} className={`px-3 py-1 rounded-lg text-sm font-bold ${size === 3 ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`}>3×3</button>
                </div>
            </div>

            <div className="flex flex-wrap gap-2">
                {[
                    { id: 'add', label: 'A + B' },
                    { id: 'sub', label: 'A - B' },
                    { id: 'mul', label: 'A × B' },
                    { id: 'det', label: 'det(A)' },
                    { id: 'inv', label: 'A⁻¹' },
                    { id: 'trans', label: 'Aᵀ' }
                ].map(btn => (
                    <button
                        key={btn.id}
                        onClick={() => setOp(btn.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                            op === btn.id 
                            ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                    >
                        {btn.label}
                    </button>
                ))}
            </div>

            <div className="flex gap-6 justify-center">
                {renderMatrixInput('Matrix A', m1, setM1)}
                {!isSingleOp && renderMatrixInput('Matrix B', m2, setM2)}
            </div>

            <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
                {!res ? (
                    <div className="text-slate-500 dark:text-slate-400 text-sm text-center py-4">Enter matrix values.</div>
                ) : res.error ? (
                    <ResultRow label="Error" exact={res.error} type="error" />
                ) : res.single ? (
                    <ResultRow label="Result" exact={res.val} />
                ) : (
                    <>
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Result Matrix</span>
                        {renderMatrixResult(res.mat!)}
                    </>
                )}
            </div>
        </div>
    );
}

// --------------------------------------------------------------------------
// 6. Vector Calculator
// --------------------------------------------------------------------------
export function VectorCalculator() {
    const [op, setOp] = useState('add');
    
    const [v1, setV1] = useState<string[]>(['', '', '']);
    const [v2, setV2] = useState<string[]>(['', '', '']);

    const updateV = (setV: any, idx: number, val: string) => {
        setV((prev: string[]) => {
            const next = [...prev];
            next[idx] = val;
            return next;
        });
    };

    const getVector = (arr: string[]) => {
        const v = arr.map(v => parseFloat(v));
        if (v.some(isNaN)) return null;
        return v;
    };

    const solve = () => {
        const vec1 = getVector(v1);
        const vec2 = getVector(v2);
        
        try {
            if (op === 'mag') {
                if (!vec1) return null;
                const mag = math.norm(vec1) as number;
                const magSq = vec1.reduce((acc, val) => acc + val * val, 0);
                return { single: true, exact: `√${magSq}`, dec: math.format(mag, { precision: 6 }) };
            }
            
            if (!vec1 || !vec2) return null;
            if (op === 'add') return { single: false, vec: math.add(vec1, vec2) as number[] };
            if (op === 'sub') return { single: false, vec: math.subtract(vec1, vec2) as number[] };
            if (op === 'dot') return { single: true, dec: math.dot(vec1, vec2).toString() };
            if (op === 'cross') return { single: false, vec: math.cross(vec1, vec2) as number[] };
        } catch (e: any) {
            return { error: 'Invalid operation' };
        }
        return null;
    };

    const res = solve();

    const renderVectorInput = (title: string, data: string[], setData: any) => (
        <div className="flex flex-col gap-2 flex-1">
            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{title}</span>
            <div className="flex flex-col gap-2">
                {['x (i)', 'y (j)', 'z (k)'].map((label, i) => (
                    <div key={i} className="flex items-center gap-2">
                        <span className="w-8 text-xs text-slate-500 font-mono">{label}</span>
                        <input 
                            type="number"
                            value={data[i] ?? ""}
                            onChange={(e) => updateV(setData, i, e.target.value)}
                            className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                ))}
            </div>
        </div>
    );

    const formatVector = (vec: number[]) => {
        return `[ ${vec.map(v => math.format(v, { precision: 5 })).join(', ')} ]`;
    };

    const isSingleOp = op === 'mag';

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Vector Calculator</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Operations on 3D vectors</p>
            </div>

            <div className="flex flex-wrap gap-2">
                {[
                    { id: 'add', label: 'u + v' },
                    { id: 'sub', label: 'u - v' },
                    { id: 'dot', label: 'u · v' },
                    { id: 'cross', label: 'u × v' },
                    { id: 'mag', label: '|u| (Magnitude)' }
                ].map(btn => (
                    <button
                        key={btn.id}
                        onClick={() => setOp(btn.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                            op === btn.id 
                            ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                    >
                        {btn.label}
                    </button>
                ))}
            </div>

            <div className="flex gap-4">
                {renderVectorInput('Vector u', v1, setV1)}
                {!isSingleOp && renderVectorInput('Vector v', v2, setV2)}
            </div>

            <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
                {!res ? (
                    <div className="text-slate-500 dark:text-slate-400 text-sm text-center py-4">Enter vector values.</div>
                ) : res.error ? (
                    <ResultRow label="Error" exact={res.error} type="error" />
                ) : res.single ? (
                    <ResultRow label="Result" exact={res.exact} decimal={res.dec} />
                ) : (
                    <ResultRow label="Result Vector" exact={formatVector(res.vec!)} />
                )}
            </div>
        </div>
    );
}

// --------------------------------------------------------------------------
// 7. Permutation & Combination
// --------------------------------------------------------------------------
function PnCCalculator() {
    const [n, setN] = useState('');
    const [r, setR] = useState('');
    const [op, setOp] = useState('nCr');

    const solve = () => {
        const N = parseInt(n);
        const R = parseInt(r);
        
        try {
            if (op === 'fact') {
                if (isNaN(N)) return null;
                if (N < 0 || N > 170) return { error: 'Invalid input (0 ≤ n ≤ 170)' };
                return { exact: math.format(math.factorial(N), { notation: 'auto', precision: 12 }) };
            }

            if (isNaN(N) || isNaN(R)) return null;
            if (N < 0 || R < 0 || R > N) return { error: 'Invalid input (0 ≤ r ≤ n)' };
            
            if (op === 'nCr') return { exact: math.format(math.combinations(N, R), { notation: 'auto', precision: 12 }) };
            if (op === 'nPr') return { exact: math.format(math.permutations(N, R), { notation: 'auto', precision: 12 }) };
            
        } catch (e: any) {
            return { error: 'Calculation error' };
        }
        return null;
    };

    const res = solve();

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Permutations & Combinations</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">nPr, nCr, n!</p>
            </div>

            <div className="flex gap-2">
                {[
                    { id: 'nCr', label: 'Combination (nCr)' },
                    { id: 'nPr', label: 'Permutation (nPr)' },
                    { id: 'fact', label: 'Factorial (n!)' }
                ].map(btn => (
                    <button
                        key={btn.id}
                        onClick={() => setOp(btn.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                            op === btn.id 
                            ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                    >
                        {btn.label}
                    </button>
                ))}
            </div>

            <div className="flex gap-4">
                <div className="flex-1"><Input label="n" value={n} onChange={setN} placeholder="5" /></div>
                {op !== 'fact' && (
                    <div className="flex-1"><Input label="r" value={r} onChange={setR} placeholder="3" /></div>
                )}
            </div>

            <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
                {!res ? (
                    <div className="text-slate-500 dark:text-slate-400 text-sm text-center py-4">Enter values to calculate.</div>
                ) : res.error ? (
                    <ResultRow label="Error" exact={res.error} type="error" />
                ) : (
                    <ResultRow label="Result" exact={res.exact} />
                )}
            </div>
        </div>
    );
}

