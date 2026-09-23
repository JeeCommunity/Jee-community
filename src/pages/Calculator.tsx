import { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, Copy, ArrowDownUp, RefreshCw, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { evaluateDecimal, evaluateExact } from '../lib/exactMath';
import MathsTab from '../components/MathsTab';
import PhysicsTab from '../components/PhysicsTab';
import ChemistryTab from '../components/ChemistryTab';
import ConstantsTab from '../components/ConstantsTab';

export default function Calculator() {
  const navigate = useNavigate();
  const [expression, setExpression] = useState('');
  const [decimalResult, setDecimalResult] = useState('');
  const [exactResult, setExactResult] = useState('');
  const [primaryView, setPrimaryView] = useState<'exact' | 'decimal'>('exact');
  const [isDeg, setIsDeg] = useState(true);
  const [activeTab, setActiveTab] = useState('Basic');
  const [showConverterMode, setShowConverterMode] = useState(false);
  
  // Angle Converter State
  const [convDeg, setConvDeg] = useState('');
  const [convRad, setConvRad] = useState('');

  const handleConvChange = (type: 'deg' | 'rad', val: string) => {
    if (type === 'deg') {
      setConvDeg(val);
      if (!val) { setConvRad(''); return; }
      const parsed = val.replace(/π/g, 'pi');
      const dec = evaluateDecimal(`(${parsed}) * pi / 180`, false);
      const ex = evaluateExact(`(${parsed}) * pi / 180`, false, dec);
      setConvRad(ex || dec || '');
    } else {
      setConvRad(val);
      if (!val) { setConvDeg(''); return; }
      const parsed = val.replace(/π/g, 'pi');
      const dec = evaluateDecimal(`(${parsed}) * 180 / pi`, false);
      const ex = evaluateExact(`(${parsed}) * 180 / pi`, false, dec);
      setConvDeg(ex || dec || '');
    }
  };

  // Live evaluation
  useEffect(() => {
    if (expression.trim() !== '') {
        const decRes = evaluateDecimal(expression, isDeg);
        if (decRes !== undefined && decRes !== '') {
            setDecimalResult(decRes);
            const isError = ['Undefined', 'Invalid input', 'No real result', 'Matrix is not invertible'].includes(decRes);
            if (isError) {
                setExactResult('');
            } else {
                const exRes = evaluateExact(expression, isDeg, decRes);
                setExactResult(exRes);
            }
        } else {
            setDecimalResult('');
            setExactResult('');
        }
    } else {
        setDecimalResult('');
        setExactResult('');
    }
  }, [expression, isDeg]);

  const handleInput = (val: string) => {
    setExpression((prev) => prev + val);
  };

  const handleClear = () => {
    setExpression('');
    setDecimalResult('');
    setExactResult('');
  };

  const handleDelete = () => {
    setExpression((prev) => prev.slice(0, -1));
  };

  const handleEqual = () => {
    if (decimalResult !== '') {
      // Upon equal, if they have an exact result, maybe put the exact result back to expression?
      // Or just put decimal back. We'll use whatever is primary.
      const valToSet = (primaryView === 'exact' && exactResult) ? exactResult : decimalResult;
      setExpression(valToSet);
      setDecimalResult('');
      setExactResult('');
    }
  };

  const handleCopy = (text: string) => {
    if (text) navigator.clipboard.writeText(text);
  };

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key;
      if (/[0-9]/.test(key)) handleInput(key);
      else if (key === '+' || key === '-' || key === '*' || key === '/' || key === '%' || key === '.' || key === '(' || key === ')') {
        let op = key;
        if (key === '*') op = '×';
        if (key === '-') op = '−';
        if (key === '/') op = '÷';
        handleInput(op);
      }
      else if (key === 'Enter' || key === '=') {
        e.preventDefault();
        handleEqual();
      }
      else if (key === 'Backspace') handleDelete();
      else if (key === 'Escape') handleClear();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [decimalResult, exactResult, primaryView]); 

  const tabs = ['Basic', 'Maths', 'Physics', 'Chemistry', 'Constants'];

  return (
    <div className="flex flex-col mx-auto w-full max-w-2xl bg-white dark:bg-slate-950 md:rounded-xl overflow-hidden md:shadow-xl md:border border-slate-200 dark:border-slate-800 h-full max-h-[100dvh] md:max-h-[85vh]">
      
      {/* Header */}
      <div className="bg-white dark:bg-slate-950 p-2 sm:p-4 border-b border-slate-200 dark:border-slate-800 flex items-center space-x-3 shrink-0">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">JEE Calculator</h1>
          <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 hidden sm:block">Fast calculations for JEE Physics, Chemistry & Maths</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto hide-scrollbar bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 shrink-0">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab 
                ? 'border-blue-600 text-blue-600 dark:text-blue-400' 
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-0 bg-slate-50 dark:bg-slate-900 overflow-y-auto">
        
        {activeTab === 'Basic' && (
          <div className="flex flex-col">
            
            {/* Display Screen (Natural height, no flex-1 push) */}
            <div className="flex flex-col justify-end p-4 sm:p-6 min-h-[140px] bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <div className="text-right text-slate-500 dark:text-slate-400 text-lg sm:text-xl min-h-[28px] break-all mb-1 font-mono">
                {expression}
              </div>

              {/* Result Area showing Exact and Decimal */}
              <div className="flex flex-col items-end gap-1 mt-2">
                 {/* Decimal Result */}
                 <div className={`flex items-center gap-2 group cursor-pointer ${primaryView === 'decimal' || !exactResult ? 'order-2' : 'order-1 opacity-70'}`} onClick={() => setPrimaryView('decimal')}>
                     <button onClick={(e) => { e.stopPropagation(); handleCopy(decimalResult); }} className="p-1 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-blue-500" title="Copy Decimal">
                         <Copy className="w-4 h-4" />
                     </button>
                     <div className={`text-right font-bold tracking-tight truncate ${primaryView === 'decimal' || !exactResult ? 'text-4xl sm:text-5xl text-slate-900 dark:text-white' : 'text-xl sm:text-2xl text-slate-600 dark:text-slate-400'}`}>
                         {decimalResult || (expression ? '...' : '0')}
                     </div>
                 </div>

                 {/* Exact Result */}
                 {exactResult && (
                 <div className={`flex items-center gap-2 group cursor-pointer ${primaryView === 'exact' ? 'order-2' : 'order-1 opacity-70'}`} onClick={() => setPrimaryView('exact')}>
                     <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">Exact</span>
                     <button onClick={(e) => { e.stopPropagation(); handleCopy(exactResult); }} className="p-1 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-blue-500" title="Copy Exact">
                         <Copy className="w-4 h-4" />
                     </button>
                     <div className={`text-right font-bold tracking-tight truncate ${primaryView === 'exact' ? 'text-4xl sm:text-5xl text-blue-600 dark:text-blue-400' : 'text-xl sm:text-2xl text-slate-600 dark:text-slate-400'}`}>
                         {exactResult}
                     </div>
                 </div>
                 )}
              </div>
            </div>

            {/* Keypad */}
            <div className="bg-slate-50 dark:bg-slate-900 p-2 sm:p-4 flex flex-col justify-end">
              
              {/* DEG / RAD Toggle & Advanced functions row */}
              <div className="flex justify-between items-center px-1 mb-2 sm:mb-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div 
                    className="flex bg-slate-200 dark:bg-slate-800 rounded-full p-1 cursor-pointer select-none"
                    onClick={() => setIsDeg(!isDeg)}
                  >
                    <div className={`px-3 py-1 sm:px-4 rounded-full text-xs font-bold transition-colors ${isDeg ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}>
                      DEG
                    </div>
                    <div className={`px-3 py-1 sm:px-4 rounded-full text-xs font-bold transition-colors ${!isDeg ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}>
                      RAD
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowConverterMode(!showConverterMode)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider hover:bg-blue-100 dark:hover:bg-blue-900/50 active:scale-95 transition-all shadow-sm"
                  >
                    {showConverterMode ? (
                      <>
                        <X className="w-3.5 h-3.5" /> Close
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-3.5 h-3.5" /> Convert
                      </>
                    )}
                  </button>
                </div>
                <div className="text-[10px] sm:text-xs text-slate-400 font-medium px-1 sm:px-2 text-right leading-tight">Tap result<br className="sm:hidden"/>to switch</div>
              </div>

              {showConverterMode ? (
                <div className="flex-1 mt-2 mb-4 bg-white dark:bg-slate-900/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-6">
                     <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
                        <RefreshCw className="w-5 h-5" />
                     </div>
                     <h2 className="text-xl font-bold text-slate-900 dark:text-white">Angle Converter</h2>
                  </div>
                  
                  <div className="space-y-4">
                     <div>
                        <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2">Degrees (°)</label>
                        <input 
                           type="text" 
                           value={convDeg} 
                           onChange={(e) => handleConvChange('deg', e.target.value)} 
                           placeholder="e.g. 180, 45, 60"
                           className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3.5 text-slate-900 dark:text-white font-mono text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                     </div>
                     <div className="flex justify-center -my-2 relative z-10">
                        <div className="bg-white dark:bg-slate-900 p-2 rounded-full border border-slate-200 dark:border-slate-700 text-slate-400">
                           <ArrowDownUp className="w-4 h-4" />
                        </div>
                     </div>
                     <div>
                        <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2">Radians (rad)</label>
                        <div className="relative">
                          <input 
                             type="text" 
                             value={convRad} 
                             onChange={(e) => handleConvChange('rad', e.target.value)} 
                             placeholder="e.g. pi, pi/2, 3.14"
                             className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3.5 text-slate-900 dark:text-white font-mono text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <button 
                             onClick={() => handleConvChange('rad', convRad + 'π')}
                             className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-bold transition-colors"
                          >
                            π
                          </button>
                        </div>
                     </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Constants Quick Insert Row */}
                  <div className="flex items-center gap-1.5 sm:gap-2 mb-3 bg-white dark:bg-slate-950 p-2 sm:p-2.5 rounded-xl overflow-x-auto hide-scrollbar border border-slate-200 dark:border-slate-800 shadow-sm">
                    <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider pl-1 shrink-0 mr-1">Constants</span>
                    <ConstantButton symbol="π" value="3.14159265" onClick={() => handleInput('3.14159265')} />
                    <ConstantButton symbol="e" value="2.71828182" onClick={() => handleInput('2.71828182')} />
                    <ConstantButton symbol="c" value="299792458" onClick={() => handleInput('299792458')} />
                    <ConstantButton symbol="h" value="6.626e-34" onClick={() => handleInput('6.626e-34')} />
                    <ConstantButton symbol="g" value="9.80665" onClick={() => handleInput('9.80665')} />
                    <ConstantButton symbol="Nₐ" value="6.022e23" onClick={() => handleInput('6.022e23')} />
                    <ConstantButton symbol="R" value="8.314" onClick={() => handleInput('8.314')} />
                    <ConstantButton symbol="ε₀" value="8.854e-12" onClick={() => handleInput('8.854e-12')} />
                    <ConstantButton symbol="μ₀" value="1.256e-6" onClick={() => handleInput('1.256e-6')} />
                    <ConstantButton symbol="e⁻" value="1.602e-19" onClick={() => handleInput('1.602e-19')} />
                    <ConstantButton symbol="mₑ" value="9.109e-31" onClick={() => handleInput('9.109e-31')} />
                  </div>

                  {/* Grid */}
                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5 sm:gap-3">
                      
                    {/* Advanced Scientific Desktop Block (3x5) */}
                    <div className="hidden sm:grid col-span-3 grid-cols-3 gap-1.5 sm:gap-3">
                        <ScientificButton onClick={() => handleInput('sin(')}>sin</ScientificButton>
                        <ScientificButton onClick={() => handleInput('cos(')}>cos</ScientificButton>
                        <ScientificButton onClick={() => handleInput('tan(')}>tan</ScientificButton>
                        
                        <ScientificButton onClick={() => handleInput('sin⁻¹(')}>sin⁻¹</ScientificButton>
                        <ScientificButton onClick={() => handleInput('cos⁻¹(')}>cos⁻¹</ScientificButton>
                        <ScientificButton onClick={() => handleInput('tan⁻¹(')}>tan⁻¹</ScientificButton>
                        
                        <ScientificButton onClick={() => handleInput('log(')}>log</ScientificButton>
                        <ScientificButton onClick={() => handleInput('ln(')}>ln</ScientificButton>
                        <ScientificButton onClick={() => handleInput('2.71828182')}>e</ScientificButton>
                        
                        <ScientificButton onClick={() => handleInput('3.14159265')}>π</ScientificButton>
                        <ScientificButton onClick={() => handleInput('√(')}>√</ScientificButton>
                        <ScientificButton onClick={() => handleInput('²')}>x²</ScientificButton>
                        
                        <ScientificButton onClick={() => handleInput('^')}>xʸ</ScientificButton>
                        <ScientificButton onClick={() => handleInput('!')}>n!</ScientificButton>
                        <ScientificButton onClick={() => handleInput('%')}>%</ScientificButton>
                    </div>
                      
                    {/* Main 4x5 Grid */}
                    <div className="col-span-4 grid grid-cols-4 gap-1.5 sm:gap-3">
                        {/* Row 1 */}
                        <OperatorButton onClick={handleClear} variant="danger">AC</OperatorButton>
                        <OperatorButton onClick={() => handleInput('(')}>(</OperatorButton>
                        <OperatorButton onClick={() => handleInput(')')}>)</OperatorButton>
                        <OperatorButton onClick={() => handleInput('÷')}>÷</OperatorButton>

                        {/* Row 2 */}
                        <NumberButton onClick={() => handleInput('7')}>7</NumberButton>
                        <NumberButton onClick={() => handleInput('8')}>8</NumberButton>
                        <NumberButton onClick={() => handleInput('9')}>9</NumberButton>
                        <OperatorButton onClick={() => handleInput('×')}>×</OperatorButton>

                        {/* Row 3 */}
                        <NumberButton onClick={() => handleInput('4')}>4</NumberButton>
                        <NumberButton onClick={() => handleInput('5')}>5</NumberButton>
                        <NumberButton onClick={() => handleInput('6')}>6</NumberButton>
                        <OperatorButton onClick={() => handleInput('−')}>−</OperatorButton>

                        {/* Row 4 */}
                        <NumberButton onClick={() => handleInput('1')}>1</NumberButton>
                        <NumberButton onClick={() => handleInput('2')}>2</NumberButton>
                        <NumberButton onClick={() => handleInput('3')}>3</NumberButton>
                        <OperatorButton onClick={() => handleInput('+')}>+</OperatorButton>

                        {/* Row 5 */}
                        <NumberButton onClick={() => handleInput('.')}>.</NumberButton>
                        <NumberButton onClick={() => handleInput('0')}>0</NumberButton>
                        <OperatorButton onClick={handleDelete} variant="warning">DEL</OperatorButton>
                        <OperatorButton onClick={handleEqual} variant="primary">=</OperatorButton>
                    </div>
                  </div>
                  
                  {/* Scientific Mobile Row (Scrollable horizontally) */}
                  <div className="mt-3 sm:hidden flex overflow-x-auto gap-1.5 pb-1 hide-scrollbar">
                        <ScientificButton onClick={() => handleInput('3.14159265')}>π</ScientificButton>
                        <ScientificButton onClick={() => handleInput('sin(')}>sin</ScientificButton>
                        <ScientificButton onClick={() => handleInput('cos(')}>cos</ScientificButton>
                        <ScientificButton onClick={() => handleInput('tan(')}>tan</ScientificButton>
                        <ScientificButton onClick={() => handleInput('sin⁻¹(')}>sin⁻¹</ScientificButton>
                        <ScientificButton onClick={() => handleInput('cos⁻¹(')}>cos⁻¹</ScientificButton>
                        <ScientificButton onClick={() => handleInput('tan⁻¹(')}>tan⁻¹</ScientificButton>
                        <ScientificButton onClick={() => handleInput('log(')}>log</ScientificButton>
                        <ScientificButton onClick={() => handleInput('ln(')}>ln</ScientificButton>
                        <ScientificButton onClick={() => handleInput('√(')}>√</ScientificButton>
                        <ScientificButton onClick={() => handleInput('²')}>x²</ScientificButton>
                        <ScientificButton onClick={() => handleInput('^')}>xʸ</ScientificButton>
                        <ScientificButton onClick={() => handleInput('10^')}>10ˣ</ScientificButton>
                        <ScientificButton onClick={() => handleInput('e^')}>eˣ</ScientificButton>
                        <ScientificButton onClick={() => handleInput('2.71828182')}>e</ScientificButton>
                        <ScientificButton onClick={() => handleInput('!')}>n!</ScientificButton>
                        <ScientificButton onClick={() => handleInput('%')}>%</ScientificButton>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
        
        {/* Placeholder for other tabs */}
        {activeTab === 'Maths' && <MathsTab />}
        {activeTab === 'Physics' && <PhysicsTab onInsert={(val) => { setExpression(prev => prev + val); setActiveTab('Basic'); }} />}
        {activeTab === 'Chemistry' && <ChemistryTab />}
        {activeTab === 'Constants' && <ConstantsTab onInsert={(val) => { setExpression(prev => prev + val); setActiveTab('Basic'); }} />}
        {activeTab !== 'Basic' && activeTab !== 'Maths' && activeTab !== 'Physics' && activeTab !== 'Chemistry' && activeTab !== 'Constants' && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500 dark:text-slate-400">
             <div className="w-16 h-16 bg-blue-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
               <svg className="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
               </svg>
             </div>
             <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{activeTab} Tools</h2>
             <p className="max-w-md text-sm">The {activeTab} section will be added in Phase 2. It will contain specific solvers, constants, and tools.</p>
          </div>
        )}
      </div>

      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}

// UI Components for Buttons

const NumberButton = ({ children, onClick }: { children: React.ReactNode, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className="h-12 sm:h-16 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xl sm:text-2xl font-semibold rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-95 transition-all"
  >
    {children}
  </button>
);

const OperatorButton = ({ children, onClick, variant = 'default' }: { children: React.ReactNode, onClick: () => void, variant?: 'default' | 'primary' | 'danger' | 'warning' }) => {
  let baseClass = "h-12 sm:h-16 text-xl sm:text-2xl font-semibold rounded-xl shadow-sm border active:scale-95 transition-all flex items-center justify-center ";
  
  if (variant === 'primary') {
    baseClass += "bg-blue-600 border-blue-700 text-white hover:bg-blue-700";
  } else if (variant === 'danger') {
    baseClass += "bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50";
  } else if (variant === 'warning') {
    baseClass += "bg-orange-100 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-400 hover:bg-orange-200 dark:hover:bg-orange-900/50 text-lg";
  } else {
    baseClass += "bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600";
  }

  return (
    <button onClick={onClick} className={baseClass}>
      {children}
    </button>
  );
};

const ScientificButton = ({ children, onClick }: { children: React.ReactNode, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className="flex-shrink-0 h-10 min-w-[3.2rem] sm:min-w-[3.5rem] sm:h-12 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[13px] sm:text-sm font-medium rounded-lg hover:bg-slate-300 dark:hover:bg-slate-700 active:scale-95 transition-all flex items-center justify-center"
  >
    {children}
  </button>
);

const ConstantButton = ({ symbol, value, onClick }: { symbol: string, value: string, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className="flex-shrink-0 flex items-center justify-center px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm font-semibold rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 transition-all shadow-sm border border-slate-200 dark:border-slate-700"
    title={value}
  >
    <span>{symbol}</span>
  </button>
);
