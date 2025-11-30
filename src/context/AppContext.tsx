// Contenido para src/context/AppContext.tsx
import React, { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { Product, Sale, Expense, RecurringExpense, ProductVariant, Category } from '../types';
import { useAuth } from './AuthContext';

const API_URL = 'http://localhost:8080';

const calculateNextDueDate = (rule: RecurringExpense): string => {
  const currentDate = new Date(rule.nextDueDate);
  currentDate.setHours(12, 0, 0, 0);

  switch (rule.frequency) {
    case 'daily':
      currentDate.setDate(currentDate.getDate() + 1);
      break;
    case 'weekly':
      currentDate.setDate(currentDate.getDate() + 7);
      break;
    case 'monthly':
      const currentDay = currentDate.getDate();
      currentDate.setMonth(currentDate.getMonth() + 1);
      if (currentDate.getDate() !== currentDay) {
        currentDate.setDate(0);
      }
      break;
  }
  return currentDate.toISOString();
};

interface AppContextType {
  products: Product[];
  sales: Sale[];
  expenses: Expense[];
  categories: string[]; 
  recurringExpenses: RecurringExpense[];
  
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  addSale: (sale: Omit<Sale, 'id' | 'timestamp' | 'userId' | 'userName'>) => Promise<void>;
  updateStockStore: (productId: string, quantity: number, variantId?: string) => Promise<void>;
  transferStock: (productId: string, quantity: number, variantId?: string) => Promise<void>;
  addStockToProduct: (
    productId: string,
    variantId: string | undefined,
    quantity: number,
    cost: number,
    destination: 'store' | 'warehouse'
  ) => Promise<void>;
  addExpense: (
    expense: Omit<Expense, 'id' | 'userId' | 'userName'>,
    ruleIdToUpdate?: string
  ) => Promise<void>;
  updateExpense: (id: string, updates: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  addCategory: (category: string) => Promise<void>;
  updateCategory: (oldCategory: string, newCategory: string) => Promise<void>;
  deleteCategory: (category: string) => Promise<void>;
  addRecurringExpense: (ruleData: Omit<RecurringExpense, 'id' | 'userName' | 'createdAt' | 'nextDueDate'>) => Promise<void>;
  deleteRecurringExpense: (id: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const defaultCategories = ['Bebidas', 'Snacks', 'Lácteos', 'Panadería', 'Limpieza', 'Anillo', 'Pulsera', 'Otros'];

export function AppProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([]);
  
  const [fullCategories, setFullCategories] = useState<Category[]>([]); 
  
  const { currentUser } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, salesRes, expRes, catRes, recurRes] = await Promise.all([
          fetch(`${API_URL}/products`),
          fetch(`${API_URL}/sales`),
          fetch(`${API_URL}/expenses`),
          fetch(`${API_URL}/categories`), 
          fetch(`${API_URL}/recurringExpenses`)
        ]);
        
        const catData: Category[] = await catRes.json();
        
        setProducts(await prodRes.json());
        setSales(await salesRes.json());
        setExpenses(await expRes.json());
        setFullCategories(catData); 
        setCategories(catData.map(c => c.name)); 
        setRecurringExpenses(await recurRes.json());

      } catch (err) {
        console.error("Error fetching initial data:", err);
        if(categories.length === 0) setCategories(defaultCategories);
      }
    };
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const dv = categories.length > 0 ? categories : defaultCategories;

  const addProduct = async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newProduct: Product = {
      ...productData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const response = await fetch(`${API_URL}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newProduct),
    });
    const addedProduct = await response.json();
    setProducts(prev => [...prev, addedProduct]);
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    const product = products.find(p => p.id === id);
    if (!product) return;
    
    const updatedProduct = { ...product, ...updates, updatedAt: new Date().toISOString() };

    const response = await fetch(`${API_URL}/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedProduct),
    });
    const returnedProduct = await response.json();
    setProducts(prev => prev.map(p => (p.id === id ? returnedProduct : p)));
  };

  const deleteProduct = async (id: string) => {
    await fetch(`${API_URL}/products/${id}`, {
      method: 'DELETE',
    });
    setProducts(prev => prev.filter(product => product.id !== id));
  };

  const addSale = async (saleData: Omit<Sale, 'id' | 'timestamp' | 'userId' | 'userName'>) => {
    const product = products.find(p => p.id === saleData.productId);
    
    const totalStock = product
      ? (product.hasVariants
          ? product.variants.reduce((sum, v) => sum + v.stockStore + v.stockWarehouse, 0)
          : product.stockStore + product.stockWarehouse)
      : 1;
      
    const unitCost = product && totalStock > 0 ? (product.costPrice / totalStock) : 0;
    
    const newSale: Sale = {
      ...saleData,
      costPrice: unitCost,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      userId: currentUser?.id || '',
      userName: currentUser?.fullName || 'Usuario desconocido',
    };
    
    const response = await fetch(`${API_URL}/sales`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSale),
    });
    const addedSale = await response.json();
    setSales(prev => [...prev, addedSale]);
  };

  const updateStockStore = async (productId: string, quantity: number, variantId?: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const totalStock = product.hasVariants
      ? product.variants.reduce((sum, v) => sum + v.stockStore + v.stockWarehouse, 0)
      : product.stockStore + product.stockWarehouse;

    const unitCost = totalStock > 0 ? (product.costPrice / totalStock) : 0;
    const costToReduce = unitCost * quantity;

    let updatedProduct = { 
      ...product, 
      costPrice: Math.max(0, product.costPrice - costToReduce), 
      updatedAt: new Date().toISOString() 
    };

    if (product.hasVariants && variantId) {
      updatedProduct.variants = product.variants.map(v =>
        v.id === variantId
          ? { ...v, stockStore: Math.max(0, v.stockStore - quantity) }
          : v
      );
    } else if (!product.hasVariants) {
      updatedProduct.stockStore = Math.max(0, product.stockStore - quantity);
    }

    const response = await fetch(`${API_URL}/products/${productId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedProduct),
    });
    const returnedProduct = await response.json();
    setProducts(prev => prev.map(p => (p.id === productId ? returnedProduct : p)));
  };

  const transferStock = async (productId: string, quantity: number, variantId?: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    let updatedProduct = { ...product, updatedAt: new Date().toISOString() };

    if (product.hasVariants && variantId) {
      updatedProduct.variants = product.variants.map(v =>
        v.id === variantId
          ? {
              ...v,
              stockStore: v.stockStore + quantity,
              stockWarehouse: Math.max(0, v.stockWarehouse - quantity)
            }
          : v
      );
    } else if (!product.hasVariants) {
      updatedProduct = {
        ...updatedProduct,
        stockStore: product.stockStore + quantity,
        stockWarehouse: Math.max(0, product.stockWarehouse - quantity),
      };
    }
    
    const response = await fetch(`${API_URL}/products/${productId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedProduct),
    });
    const returnedProduct = await response.json();
    setProducts(prev => prev.map(p => (p.id === productId ? returnedProduct : p)));
  };

  const addStockToProduct = async (
    productId: string,
    variantId: string | undefined,
    quantity: number,
    cost: number,
    destination: 'store' | 'warehouse'
  ) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const updatedProduct = { 
      ...product,
      costPrice: product.costPrice + cost,
      updatedAt: new Date().toISOString()
    };

    if (product.hasVariants && variantId) {
      updatedProduct.variants = product.variants.map(v => {
        if (v.id !== variantId) return v;
        return destination === 'store'
          ? { ...v, stockStore: v.stockStore + quantity }
          : { ...v, stockWarehouse: v.stockWarehouse + quantity };
      });
    } else if (!product.hasVariants) {
      if (destination === 'store') {
        updatedProduct.stockStore = product.stockStore + quantity;
      } else {
        updatedProduct.stockWarehouse = product.stockWarehouse + quantity;
      }
    }
    
    const response = await fetch(`${API_URL}/products/${productId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedProduct),
    });
    const returnedProduct = await response.json();
    setProducts(prev => prev.map(p => (p.id === productId ? returnedProduct : p)));
  };

  const addExpense = async (
    expenseData: Omit<Expense, 'id' | 'userId' | 'userName'>,
    ruleIdToUpdate?: string
  ) => {
    const newExpense: Expense = {
      ...expenseData,
      id: crypto.randomUUID(),
      userId: currentUser?.id || '',
      userName: currentUser?.fullName || 'Usuario desconocido',
      date: expenseData.date ? new Date(expenseData.date).toISOString() : new Date().toISOString(),
    };

    const response = await fetch(`${API_URL}/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newExpense),
    });
    const addedExpense = await response.json();
    setExpenses(prev => [...prev, addedExpense]);

    if (ruleIdToUpdate) {
      const rule = recurringExpenses.find(r => r.id === ruleIdToUpdate);
      if (rule) {
        const nextNextDate = calculateNextDueDate(rule);
        const updatedRule = { ...rule, nextDueDate: nextNextDate };
        
        await fetch(`${API_URL}/recurringExpenses/${ruleIdToUpdate}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedRule),
        });
        setRecurringExpenses(prev => prev.map(r => r.id === ruleIdToUpdate ? updatedRule : r));
      }
    }
  };

  const updateExpense = async (id: string, updates: Partial<Expense>) => {
    const expense = expenses.find(e => e.id === id);
    if (!expense) return;
    
    const updatedExpense = { ...expense, ...updates };
    
    const response = await fetch(`${API_URL}/expenses/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedExpense),
    });
    const returnedExpense = await response.json();
    setExpenses(prev => prev.map(e => (e.id === id ? returnedExpense : e)));
  };

  const deleteExpense = async (id: string) => {
    await fetch(`${API_URL}/expenses/${id}`, {
      method: 'DELETE',
    });
    setExpenses(prev => prev.filter(expense => expense.id !== id));
  };
  
  const addRecurringExpense = async (ruleData: Omit<RecurringExpense, 'id' | 'userName' | 'createdAt' | 'nextDueDate'>) => {
    const newRule: RecurringExpense = {
      ...ruleData,
      id: crypto.randomUUID(),
      userName: currentUser?.fullName || 'Sistema',
      createdAt: new Date().toISOString(),
      nextDueDate: ruleData.startDate,
    };
    
    const response = await fetch(`${API_URL}/recurringExpenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newRule),
    });
    const addedRule = await response.json();
    setRecurringExpenses(prev => [...prev, addedRule]);
  };

  const deleteRecurringExpense = async (id: string) => {
    await fetch(`${API_URL}/recurringExpenses/${id}`, {
      method: 'DELETE',
    });
    setRecurringExpenses(prev => prev.filter(rule => rule.id !== id));
  };

  const addCategory = async (category: string) => {
    const name = category.trim();
    if (categories.includes(name)) return;

    const newCategory: Category = { id: name.toLowerCase(), name: name };
    
    const response = await fetch(`${API_URL}/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newCategory),
    });
    const addedCategory = await response.json();
    
    setFullCategories(prev => [...prev, addedCategory]);
    setCategories(prev => [...prev, addedCategory.name]);
  };

  const updateCategory = async (oldCategory: string, newCategory: string) => {
    const oldName = oldCategory.trim();
    const newName = newCategory.trim();
    
    const categoryObject = fullCategories.find(c => c.name === oldName);
    const oldId = categoryObject ? categoryObject.id : oldName.toLowerCase();
    
    const newCategoryData: Category = { id: newName.toLowerCase(), name: newName };

    if(categoryObject) {
      await fetch(`${API_URL}/categories/${oldId}`, { method: 'DELETE' });
    }
    const response = await fetch(`${API_URL}/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newCategoryData),
    });
    const addedCategory = await response.json();

    setFullCategories(prev => [...prev.filter(c => c.name !== oldName), addedCategory]);
    setCategories(prev => prev.map(cat => (cat === oldName ? newName : cat)));
    
    const productsToUpdate = products.filter(p => p.category === oldName);
    await Promise.all(productsToUpdate.map(p => {
      return updateProduct(p.id, { category: newName });
    }));
  };

  const deleteCategory = async (category: string) => {
    const name = category.trim();
    const categoryObject = fullCategories.find(c => c.name === name);
    const id = categoryObject ? categoryObject.id : name.toLowerCase();

    await fetch(`${API_URL}/categories/${id}`, { method: 'DELETE' });

    setFullCategories(prev => prev.filter(c => c.name !== name));
    setCategories(prev => prev.filter(cat => cat !== name));
    
    const productsToUpdate = products.filter(p => p.category === name);
    await Promise.all(productsToUpdate.map(p => {
      return updateProduct(p.id, { category: '' });
    }));
  };

  useEffect(() => {
    const processRecurringExpenses = async () => {
      // Evita que se ejecute si recurringExpenses está vacío o si expenses aún no se carga
      if (recurringExpenses.length === 0 || expenses.length === 0) return;

      const now = new Date();
      now.setHours(23, 59, 59, 999);
      
      const newExpensesToAdd: Omit<Expense, 'id' | 'userId' | 'userName'>[] = [];
      let rulesHaveChanged = false;
      const rulesToUpdate: RecurringExpense[] = [];

      const updatedRules = recurringExpenses.map(rule => {
        let nextDueDate = new Date(rule.nextDueDate);
        nextDueDate.setHours(12, 0, 0, 0);

        const newRule = { ...rule };

        while (nextDueDate <= now) {
          const alreadyExists = expenses.some(ex =>
            ex.recurringRuleId === rule.id &&
            new Date(ex.date).toDateString() === nextDueDate.toDateString()
          );

          if (!alreadyExists) {
            newExpensesToAdd.push({
              date: new Date(nextDueDate),
              description: rule.description,
              amount: rule.amount,
              category: rule.category,
              recurringRuleId: rule.id,
            });
          }
          
          const nextDateString = calculateNextDueDate({ ...rule, nextDueDate: nextDueDate.toISOString() });
          newRule.nextDueDate = nextDateString;
          nextDueDate = new Date(nextDateString);
          rulesHaveChanged = true;
        }
        
        if (newRule.nextDueDate !== rule.nextDueDate) {
          rulesToUpdate.push(newRule);
        }
        return newRule;
      });

      if (newExpensesToAdd.length > 0) {
        console.log(`Agregando ${newExpensesToAdd.length} gastos recurrentes.`);
        await Promise.all(newExpensesToAdd.map(exp => addExpense(exp)));
      }
      
      if (rulesHaveChanged) {
        await Promise.all(rulesToUpdate.map(rule => {
          return fetch(`${API_URL}/recurringExpenses/${rule.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(rule),
          });
        }));
        setRecurringExpenses(updatedRules);
      }
    };
    
    const lastCheckString = localStorage.getItem('pos-last-expense-check');
    const now = new Date();
    
    if (lastCheckString) {
      const lastCheckDate = new Date(lastCheckString);
      const hoursDiff = (now.getTime() - lastCheckDate.getTime()) / (1000 * 60 * 60);

      if (hoursDiff > 1) {
        processRecurringExpenses();
        localStorage.setItem('pos-last-expense-check', now.toISOString());
      }
    } else {
      processRecurringExpenses();
      localStorage.setItem('pos-last-expense-check', now.toISOString());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, expenses, recurringExpenses]);


  return (
    <AppContext.Provider value={{
      products,
      sales,
      expenses,
      categories: dv,
      recurringExpenses,
      addProduct,
      updateProduct,
      deleteProduct,
      addSale,
      updateStockStore,
      transferStock,
      addStockToProduct,
      addExpense,
      updateExpense,
      deleteExpense,
      addCategory,
      updateCategory,
      deleteCategory,
      addRecurringExpense,
      deleteRecurringExpense,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};