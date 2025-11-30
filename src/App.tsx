// Contenido para src/App.tsx (CORREGIDO)
import React, { useState, useEffect } from 'react'; // <-- Asegúrate de importar useEffect
import { Sidebar } from './components/Layout/Sidebar';
import { Dashboard } from './components/Dashboard/Dashboard';
import { Sales } from './components/Sales/Sales';
import { Inventory } from './components/Inventory/Inventory';
import { History } from './components/History/History';
import { Analytics } from './components/Analytics/Analytics';
import { Settings } from './components/Settings/Settings';
import { UserManagement } from './components/Users/UserManagement';
import { ExpenseManager } from './components/Expenses/ExpenseManager';
import { ProfitAnalysis } from './components/Profits/ProfitAnalysis';
import { LoginForm } from './components/Auth/LoginForm';
import { useAuth } from './context/AuthContext';

export function App() {
  const { currentUser, canAccess, isAdmin } = useAuth();

  // El estado inicial ahora depende del rol (si está logueado)
  const [activeSection, setActiveSection] = useState(() => {
    if (currentUser) {
      return isAdmin() ? 'dashboard' : 'sales';
    }
    return 'dashboard'; // Default si no hay nadie (se mostrará el login)
  });

  // --- ¡CORRECCIÓN DEL BUCLE INFINITO! ---
  // Este useEffect se ejecuta cada vez que el usuario (currentUser)
  // o la sección (activeSection) cambian.
  useEffect(() => {
    if (currentUser) {
      // 1. Verifica si el usuario acaba de iniciar sesión y está en la sección incorrecta
      const defaultSection = isAdmin() ? 'dashboard' : 'sales';
      if (activeSection !== defaultSection && !canAccess(activeSection)) {
         setActiveSection(defaultSection);
      }
      
      // 2. Verifica si el usuario tiene permiso para la sección actual
      else if (!canAccess(activeSection)) {
        // Si no tiene acceso (p.ej. un vendedor cambia a 'dashboard' escribiendo la URL),
        // lo redirige a su sección por defecto.
        setActiveSection(defaultSection);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSection, currentUser, isAdmin, canAccess]); // Dependencias
  // --- FIN DE LA CORRECCIÓN ---


  if (!currentUser) {
    return <LoginForm />;
  }

  // Esta función ahora es segura, la lógica de permisos está en el Sidebar
  // y en el useEffect de arriba.
  const handleSectionChange = (section: string) => {
    setActiveSection(section);
  };

  const renderSection = () => {
    // El useEffect de arriba ya se aseguró de que activeSection sea válida.
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard />;
      case 'sales':
        return <Sales />;
      case 'inventory':
        return <Inventory />;
      case 'history':
        return <History />;
      case 'analytics':
        return <Analytics />;
      case 'users':
        return <UserManagement />;
      case 'expenses':
        return <ExpenseManager />;
      case 'profits':
        return <ProfitAnalysis />;
      case 'settings':
        return <Settings />;
      default:
        // Fallback por si acaso
        return isAdmin() ? <Dashboard /> : <Sales />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar activeSection={activeSection} onSectionChange={handleSectionChange} />
      <main className="flex-1 overflow-auto">
        {renderSection()}
      </main>
    </div>
  );
}