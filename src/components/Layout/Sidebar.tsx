import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  History, 
  Settings,
  BarChart3,
  Users,
  Receipt,
  TrendingUp,
  LogOut
} from 'lucide-react';

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'sales', label: 'Ventas', icon: ShoppingCart },
  { id: 'inventory', label: 'Inventario', icon: Package },
  { id: 'history', label: 'Historial', icon: History },
  { id: 'analytics', label: 'Analíticas', icon: BarChart3 },
  { id: 'profits', label: 'Ganancias', icon: TrendingUp, adminOnly: true },
  { id: 'users', label: 'Usuarios', icon: Users, adminOnly: true },
  { id: 'expenses', label: 'Gastos', icon: Receipt, adminOnly: true },
  { id: 'settings', label: 'Configuración', icon: Settings },
];

export function Sidebar({ activeSection, onSectionChange }: SidebarProps) {
  const { currentUser, logout, canAccess, isAdmin } = useAuth();

  const handleLogout = () => {
    if (confirm('¿Estás seguro de cerrar sesión?')) {
      logout();
    }
  };

  const filteredMenuItems = menuItems.filter(item => {
    if (item.adminOnly && !isAdmin()) return false;
    return canAccess(item.id);
  });

  return (
    <div className="w-64 bg-gray-900 text-white h-screen flex flex-col">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-blue-400">
          Mason Beauty
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          {currentUser?.fullName} ({currentUser?.role === 'admin' ? 'Admin' : 'Vendedor'})
        </p>
      </div>
      
      <nav className="flex-1 px-4 pb-4">
        <ul className="space-y-2">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            
            return (
              <li key={item.id}>
                <button
                  onClick={() => onSectionChange(item.id)}
                  className={`w-full flex items-center px-4 py-3 rounded-lg text-left transition-all duration-200 group ${
                    isActive 
                      ? 'bg-blue-600 text-white shadow-lg' 
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <Icon className={`w-5 h-5 mr-3 transition-transform group-hover:scale-110 ${
                    isActive ? 'text-white' : 'text-gray-400'
                  }`} />
                  <span className="font-medium">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
        
        <div className="mt-4 pt-4 border-t border-gray-700">
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-3 rounded-lg text-left transition-all duration-200 group text-gray-300 hover:bg-red-600 hover:text-white"
          >
            <LogOut className="w-5 h-5 mr-3 transition-transform group-hover:scale-110 text-gray-400 group-hover:text-white" />
            <span className="font-medium">Cerrar Sesión</span>
          </button>
        </div>
      </nav>
      
      <div className="p-4 border-t border-gray-700">
        <div className="text-xs text-gray-400">
          v1.0.0 • © 2025 StoreManager Pro
        </div>
      </div>
    </div>
  );
}