export function safeStringify(obj: any) {
  const cache = new Set();
  try {
    return JSON.stringify(obj, (key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (cache.has(value)) {
          return '[Circular]';
        }
        cache.add(value);
      }
      return value;
    });
  } catch (error: any) {
    console.error('safeStringify error:', error?.message || 'Error');
    // Fallback: strip all complex objects and only keep primitives
    try {
      return JSON.stringify(obj, (key, value) => {
        if (typeof value === 'object' && value !== null) {
          return '[Object]';
        }
        return value;
      });
    } catch (e) {
      return '{"error": "circular"}';
    }
  }
}

