// Contenido para: src/main.tsx (Corregido)

import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.tsx'; // <--- CORRECCIÓN 1: Importar con llaves {}
import './index.css';

// --- CORRECCIÓN 2: Importar los Proveedores ---
import { AuthProvider } from './context/AuthContext.tsx';
import { AppProvider } from './context/AppContext.tsx';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

const root = createRoot(rootElement);

root.render(
  <React.StrictMode>
    {/* --- CORRECCIÓN 3: Envolver la App con los Proveedores --- */}
    <AuthProvider>
      <AppProvider>
        <App />
      </AppProvider>
    </AuthProvider>
  </React.StrictMode>,
);