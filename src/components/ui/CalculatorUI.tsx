import React from 'react';

export function Input({ label, value, onChange, placeholder, unit }: any) {
    return (
        <div className="flex flex-col gap-1.5 flex-1 w-full">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</label>
            <div className="relative">
                <input 
                    type="number" 
                    value={value ?? ""} 
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-3 pr-10 py-2 text-slate-900 dark:text-white font-mono text-base focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
                {unit && <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold pointer-events-none">{unit}</span>}
            </div>
        </div>
    );
}

export function TextInput({ label, value, onChange, placeholder, unit }: any) {
    return (
        <div className="flex flex-col gap-1.5 flex-1 w-full">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</label>
            <div className="relative">
                <input 
                    type="text" 
                    value={value ?? ""} 
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-3 pr-10 py-2 text-slate-900 dark:text-white font-mono text-base focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
                {unit && <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold pointer-events-none">{unit}</span>}
            </div>
        </div>
    );
}

export function ResultRow({ label, exact, decimal, type = 'default' }: any) {
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
