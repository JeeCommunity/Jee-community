import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';


// Patch console methods to prevent AI Studio interceptor from crashing on circular objects
const sanitizeArgs = (args) => {
  return args.map(arg => {
    if (arg instanceof Error) {
      return { name: arg.name, message: arg.message, stack: arg.stack };
    }
    if (typeof arg === 'object' && arg !== null) {
      try {
        const cache = new Set();
        return JSON.parse(JSON.stringify(arg, (key, value) => {
          if (typeof value === 'object' && value !== null) {
            if (cache.has(value)) return '[Circular]';
            cache.add(value);
          }
          return value;
        }));
      } catch (e) {
        return String(arg);
      }
    }
    return arg;
  });
};

const originalError = console.error;
console.error = (...args) => originalError.apply(console, sanitizeArgs(args));
const originalWarn = console.warn;
console.warn = (...args) => originalWarn.apply(console, sanitizeArgs(args));
const originalLog = console.log;
console.log = (...args) => originalLog.apply(console, sanitizeArgs(args));
const originalInfo = console.info;
console.info = (...args) => originalInfo.apply(console, sanitizeArgs(args));

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);




// Unregister any existing service workers to prevent MIME type errors in AI Studio iframe
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    for(let registration of registrations) {
      registration.unregister();
    }
  }).catch(err => console.error("SW Unregistration error", err));
}
