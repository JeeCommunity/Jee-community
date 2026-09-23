import * as math from 'mathjs';
// @ts-ignore
import nerdamer from 'nerdamer/all.min.js';

// Setup custom degree trigonometric functions in nerdamer
nerdamer.setFunction('sind', ['x'], 'sin(x*pi/180)');
nerdamer.setFunction('cosd', ['x'], 'cos(x*pi/180)');
nerdamer.setFunction('tand', ['x'], 'tan(x*pi/180)');
nerdamer.setFunction('asind', ['x'], 'asin(x)*180/pi');
nerdamer.setFunction('acosd', ['x'], 'acos(x)*180/pi');
nerdamer.setFunction('atand', ['x'], 'atan(x)*180/pi');

export const evaluateDecimal = (expr: string, isDeg: boolean): string => {
  if (!expr) return '';
  try {
    let mathExpr = expr
      .replace(/×/g, '*')
      .replace(/−/g, '-')
      .replace(/÷/g, '/')
      .replace(/π/g, 'pi')
      .replace(/e/g, 'e')
      .replace(/sin⁻¹\(/g, 'asin(')
      .replace(/cos⁻¹\(/g, 'acos(')
      .replace(/tan⁻¹\(/g, 'atan(')
      .replace(/²/g, '^2')
      .replace(/x²/g, '^2')
      .replace(/xʸ/g, '^')
      .replace(/√\(/g, 'sqrt(')
      .replace(/√([0-9.]+)/g, 'sqrt($1)');

    let scope = {};
    if (isDeg) {
      scope = {
        sin: (x: any) => math.sin(typeof x === 'number' ? math.unit(x, 'deg') : x),
        cos: (x: any) => math.cos(typeof x === 'number' ? math.unit(x, 'deg') : x),
        tan: (x: any) => math.tan(typeof x === 'number' ? math.unit(x, 'deg') : x),
        asin: (x: any) => {
            const r = math.asin(x);
            if (r && (r as any).type === 'Complex') return r;
            return (r as number) * (180 / Math.PI);
        },
        acos: (x: any) => {
            const r = math.acos(x);
            if (r && (r as any).type === 'Complex') return r;
            return (r as number) * (180 / Math.PI);
        },
        atan: (x: any) => {
            const r = math.atan(x);
            if (r && (r as any).type === 'Complex') return r;
            return (r as number) * (180 / Math.PI);
        },
      };
    }
    
    const result = math.evaluate(mathExpr, scope);
    
    if (result === Infinity || result === -Infinity || Number.isNaN(result)) {
        return 'Undefined';
    }

    if (result && result.type === 'Complex') {
        if (mathExpr.includes('sqrt')) return 'No real result';
        return 'Invalid input';
    }

    if (typeof result === 'number') {
        let numResult = result;
        // Fix floating point precision artifacts for trig
        if (/(sin|cos|tan)/.test(expr) && Math.abs(numResult) < 1e-14) {
             numResult = 0;
        }
        
        let formatted = math.format(numResult, { precision: 10, notation: 'auto', lowerExp: -6, upperExp: 9 });
        if (formatted.includes('e')) {
            const parts = formatted.split('e');
            let base = parts[0];
            let exp = parts[1];
            if (exp.startsWith('+')) exp = exp.slice(1);
            
            const chars: Record<string, string> = {
                '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', 
                '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻'
            };
            const superExp = exp.split('').map(c => chars[c] || c).join('');
            formatted = `${base} × 10${superExp}`;
        }
        return formatted;
    }
    if (result && result.toString) {
        return result.toString();
    }
    return '';
  } catch (error: any) {
    const msg = error.message || '';
    if (msg.includes('non-negative') || msg.includes('Factorial of negative')) {
       return 'Invalid input';
    }
    if (msg.includes('Matrix is not invertible')) {
       return 'Matrix is not invertible';
    }
    return ''; 
  }
};

export const formatExactString = (exactStr: string): string => {
    if (!exactStr || exactStr === 'undefined' || exactStr === 'null') return '';
    let formatted = exactStr
       .replace(/\btan\(0\)/g, '0')
       .replace(/\bsin\(0\)/g, '0')
       .replace(/\bcos\(0\)/g, '1')
       .replace(/sqrt\(([0-9]+)\)\^\(-1\)/g, '√$1/$1')
       .replace(/\(-\(1\/([0-9]+)\)\)\*sqrt\(([0-9]+)\)/g, '-√$2/$1')
       .replace(/\(-1\/([0-9]+)\)\*sqrt\(([0-9]+)\)/g, '-√$2/$1') 
       .replace(/\(1\/([0-9]+)\)\*sqrt\(([0-9]+)\)/g, '√$2/$1')
       .replace(/\(-\(1\/([0-9]+)\)\)\*pi/g, '-π/$1')
       .replace(/\(-1\/([0-9]+)\)\*pi/g, '-π/$1')
       .replace(/\(1\/([0-9]+)\)\*pi/g, 'π/$1')
       .replace(/\*sqrt\(([0-9]+)\)/g, '√$1')
       .replace(/sqrt\(([0-9]+)\)/g, '√$1')
       .replace(/\*pi/g, 'π')
       .replace(/pi/g, 'π');
       
    // Remove wrapping parenthesis if any like (1/2) -> 1/2
    if (formatted.startsWith('(') && formatted.endsWith(')') && !formatted.substring(1, formatted.length-1).includes('(')) {
        formatted = formatted.substring(1, formatted.length - 1);
    }
    return formatted;
};

export const evaluateExact = (expr: string, isDeg: boolean, decimalVal: string): string => {
  if (!expr) return '';
  try {
    let nerdExpr = expr
      .replace(/×/g, '*')
      .replace(/−/g, '-')
      .replace(/÷/g, '/')
      .replace(/π/g, 'pi')
      .replace(/e/g, 'e')
      .replace(/sin⁻¹\(/g, 'asin(')
      .replace(/cos⁻¹\(/g, 'acos(')
      .replace(/tan⁻¹\(/g, 'atan(')
      .replace(/²/g, '^2')
      .replace(/x²/g, '^2')
      .replace(/xʸ/g, '^')
      .replace(/√\(/g, 'sqrt(')
      .replace(/√([0-9.]+)/g, 'sqrt($1)');

    if (isDeg) {
        nerdExpr = nerdExpr.replace(/\bsin\(/g, 'sind(');
        nerdExpr = nerdExpr.replace(/\bcos\(/g, 'cosd(');
        nerdExpr = nerdExpr.replace(/\btan\(/g, 'tand(');
        nerdExpr = nerdExpr.replace(/\basin\(/g, 'asind(');
        nerdExpr = nerdExpr.replace(/\bacos\(/g, 'acosd(');
        nerdExpr = nerdExpr.replace(/\batan\(/g, 'atand(');
    }

    const exactResult = nerdamer(nerdExpr).toString();
    
    const formatted = formatExactString(exactResult);

    // If formatted string is same as decimal, no need to show both
    if (formatted === decimalVal) {
        return '';
    }

    // Filter out huge fractions that nerdamer sometimes generates for floats like 0.8660254038
    if (formatted.match(/[0-9]{6,}\/[0-9]{6,}/)) {
        return '';
    }

    if (formatted.includes('factorial(')) {
        return '';
    }

    // Filter out huge exact integers
    if (formatted.match(/^[0-9]{16,}$/)) {
        return '';
    }

    // If the exact result is just the expression itself or contains un-evaluated functions
    const normalize = (s: string) => s.replace(/\s+/g, '').toLowerCase().replace(/π/g, 'pi');
    if (normalize(formatted) === normalize(expr)) {
        return '';
    }
    
    // Hide exact result if it still contains unresolved trigonometric or logarithmic functions
    if (formatted.match(/(sin|cos|tan|asin|acos|atan|log|ln)\(/i)) {
        return '';
    }

    return formatted;
  } catch (error) {
    return ''; 
  }
};
