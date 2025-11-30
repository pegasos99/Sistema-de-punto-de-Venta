// Contenido para: src/components/Settings/CategoryManager.tsx (Corregido)

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Plus, Edit, Trash2, X, Check } from 'lucide-react';

export function CategoryManager() {
  // --- CORRECCIÓN: Obtenemos todo desde el contexto ---
  const {
    products,
    categories, // <--- Usamos la lista de categorías del contexto
    addCategory: addCategoryContext,     // <--- Usamos la función del contexto (renombrada)
    updateCategory: updateCategoryContext, // <--- Usamos la función del contexto (renombrada)
    deleteCategory: deleteCategoryContext  // <--- Usamos la función del contexto (renombrada)
  } = useApp();
  
  // --- ELIMINADO ---
  // Ya no usamos el useState local ni localStorage para las categorías
  
  const [newCategory, setNewCategory] = useState('');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // --- CORRECCIÓN: Esta función ahora llama al contexto ---
  const addCategory = () => {
    if (!newCategory.trim()) return;
    
    if (categories.includes(newCategory.trim())) {
      alert('Esta categoría ya existe');
      return;
    }

    addCategoryContext(newCategory.trim()); // <--- Llama a la función del AppContext
    setNewCategory('');
    setShowAddForm(false);
  };

  // --- CORRECCIÓN: Esta función ahora llama al contexto ---
  const saveEdit = () => {
    if (!editValue.trim() || !editingCategory || editValue === editingCategory) {
      setEditingCategory(null);
      return;
    }

    if (categories.includes(editValue.trim())) {
      alert('Esta categoría ya existe');
      return;
    }

    // La función del contexto ya se encarga de actualizar los productos
    updateCategoryContext(editingCategory, editValue.trim()); // <--- Llama a la función del AppContext
    setEditingCategory(null);
  };

  const startEdit = (category: string) => {
    setEditingCategory(category);
    setEditValue(category);
  };

  // --- CORRECCIÓN: Esta función ahora llama al contexto ---
  const deleteCategory = (category: string) => {
    const productsWithCategory = products.filter(p => p.category === category);
    
    if (productsWithCategory.length > 0) {
      const confirmDelete = confirm(
        `Esta categoría tiene ${productsWithCategory.length} producto(s) asociado(s). ` +
        `¿Deseas eliminarla? Los productos quedarán sin categoría.`
      );
      
      if (!confirmDelete) return;

      // La función del contexto ya se encarga de actualizar los productos
    }
    
    deleteCategoryContext(category); // <--- Llama a la función del AppContext
  };

  const getCategoryProductCount = (category: string) => {
    return products.filter(p => p.category === category).length;
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Gestión de Categorías</h3>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Categoría</span>
        </button>
      </div>

      {showAddForm && (
        <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Nombre de la nueva categoría"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
              onKeyPress={(e) => e.key === 'Enter' && addCategory()}
            />
            <button
              onClick={addCategory}
              className="bg-green-600 text-white p-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setShowAddForm(false);
                setNewCategory('');
              }}
              className="bg-gray-500 text-white p-2 rounded-lg hover:bg-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Esta lista ahora viene del contexto */}
      <div className="space-y-2">
        {categories.map(category => (
          <div key={category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              {editingCategory === category ? (
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyPress={(e) => e.key === 'Enter' && saveEdit()}
                  autoFocus
                />
              ) : (
                <span className="font-medium">{category}</span>
              )}
              <span className="text-sm text-gray-500">
                ({getCategoryProductCount(category)} productos)
              </span>
            </div>
            
            <div className="flex items-center space-x-1">
              {editingCategory === category ? (
                <>
                  <button
                    onClick={saveEdit}
                    className="p-1 text-green-600 hover:bg-green-100 rounded"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setEditingCategory(null)}
                    className="p-1 text-gray-500 hover:bg-gray-200 rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => startEdit(category)}
                    className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteCategory(category)}
                    className="p-1 text-red-600 hover:bg-red-100 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {categories.length === 0 && (
        <p className="text-center py-8 text-gray-500">
          No hay categorías disponibles. Agrega una nueva categoría.
        </p>
      )}

      <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
        <p className="text-xs text-yellow-700">
          💡 Tip: Al editar una categoría, todos los productos asociados se actualizarán automáticamente.
          Al eliminar una categoría, los productos quedarán sin categoría asignada.
        </p>
      </div>
    </div>
  );
}