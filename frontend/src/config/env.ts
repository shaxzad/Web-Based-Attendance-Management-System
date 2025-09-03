// Environment configuration
export const env = {
  VITE_API_URL: (import.meta as any).env?.VITE_API_URL || "http://localhost:8000",
  MODE: (import.meta as any).env?.MODE || "development",
  PROD: (import.meta as any).env?.PROD || false,
  DEV: (import.meta as any).env?.DEV || true,
  SSR: (import.meta as any).env?.SSR || false,
  BASE_URL: (import.meta as any).env?.BASE_URL || "/",
}

// Debug logging
console.log('Environment variables:', (import.meta as any).env)
console.log('VITE_API_URL from env:', (import.meta as any).env?.VITE_API_URL)
console.log('MODE:', (import.meta as any).env?.MODE)
console.log('PROD:', (import.meta as any).env?.PROD)
console.log('Final API URL:', env.VITE_API_URL)
