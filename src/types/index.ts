// Contenido para src/types/index.ts

export interface ProductVariant {
  id: string;
  color: string;
  stockStore: number;
  stockWarehouse: number;
}

export interface Product {
  id: string;
  name: string;
  barcodes: string[];
  price: number;
  costPrice: number;
  stockStore: number;
  stockWarehouse: number;
  category: string;
  description?: string;
  minStock: number;
  hasVariants: boolean;
  variants: ProductVariant[];
  hasVariablePrice: boolean; // <--- AÑADIDO
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface Sale {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  variantId?: string;
  variantColor?: string;
  unitPrice: number;
  costPrice: number; 
  totalPrice: number;
  paymentMethod: 'efectivo' | 'tarjeta';
  timestamp: string | Date;
  userId: string;
  userName: string;
  barcode: string;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: 'personal' | 'local' | 'otros';
  date: string | Date;
  userId: string;
  userName: string;
  recurringRuleId?: string;
}

export interface RecurringExpense {
  id: string;
  description: string;
  amount: number;
  category: 'personal' | 'local' | 'otros';
  frequency: 'daily' | 'weekly' | 'monthly';
  startDate: string;
  nextDueDate: string;
  dayOfWeek?: number;
  dayOfMonth?: number;
  userName: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
}

export interface User {
  id: string;
  username: string;
  password?: string;
  role: 'admin' | 'vendedor';
  fullName: string;
  createdAt: string | Date;
  isActive: boolean;
}