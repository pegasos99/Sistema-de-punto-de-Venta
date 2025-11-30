// Contenido para src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';

const API_URL = 'http://localhost:8080';

interface AuthContextType {
  currentUser: User | null;
  users: User[];
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAdmin: () => boolean;
  canAccess: (section: string) => boolean;
  addUser: (user: Omit<User, 'id' | 'createdAt'>) => Promise<void>;
  updateUser: (id: string, updates: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>([]);
  // CÓDIGO CORREGIDO
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/users`)
      .then(res => res.json())
      .then(data => setUsers(data))
      .catch(err => console.error("Error fetching users:", err));
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    const user = users.find(u => u.username === username && u.password === password && u.isActive);
    if (user) {
      setCurrentUser(user);
      localStorage.setItem('pos-current-user', JSON.stringify(user));
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('pos-current-user');
  };

  const isAdmin = () => currentUser?.role === 'admin';

  // --- ¡LÓGICA DE PERMISOS CORREGIDA! ---
  const canAccess = (section: string) => {
    if (!currentUser) return false;
    if (isAdmin()) return true; // El admin puede ver todo

    // El vendedor SÓLO puede ver 'sales'
    const vendorAllowed = ['sales'];
    return vendorAllowed.includes(section);
  };
  // --- FIN DE LA CORRECCIÓN ---

  const addUser = async (userData: Omit<User, 'id' | 'createdAt'>) => {
    const newUser: User = {
      ...userData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    
    const response = await fetch(`${API_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newUser),
    });
    const addedUser = await response.json();
    setUsers(prev => [...prev, addedUser]);
  };

  const updateUser = async (id: string, updates: Partial<User>) => {
    const user = users.find(u => u.id === id);
    if (!user) return;

    const updatedUser = { ...user, ...updates };

    const response = await fetch(`${API_URL}/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedUser),
    });
    const returnedUser = await response.json();
    setUsers(prev => prev.map(u => (u.id === id ? returnedUser : u)));
  };

  const deleteUser = async (id: string) => {
    await fetch(`${API_URL}/users/${id}`, {
      method: 'DELETE',
    });
    setUsers(prev => prev.filter(u => u.id !== id));
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      users,
      login,
      logout,
      isAdmin,
      canAccess,
      addUser,
      updateUser,
      deleteUser
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};