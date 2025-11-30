import React, { useState } from 'react';
// Importamos los tipos
import { Product } from '../../types'; // <--- Ya no se necesita ProductVariant aquí
import { useApp } from '../../context/AppContext';
import { X, Plus, Trash2 } from 'lucide-react'; 

interface ProductFormProps {
  product?: Product;
  onSave: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'> | Product) => void;
  onClose: () => void;
}

export function ProductForm({ product, onSave, onClose }: ProductFormProps) {
  const { categories, addCategory } = useApp();
  
  const [formData, setFormData] = useState({
    name: product?.name || '',
    barcodes: product?.barcodes || [], 
    price: product?.price || 0,
    costPrice: product?.costPrice || 0,
    
    // Stock para productos simples (ahora siempre visible)
    stockStore: product?.stockStore || 0,
    stockWarehouse: product?.stockWarehouse || 0,
    
    category: product?.category || '',
    description: product?.description || '',
    minStock: product?.minStock || 5,
    
    // Propiedad de precio variable (la que añadimos antes)
    hasVariablePrice: product?.hasVariablePrice || false,
    
    // --- ELIMINADO ---
    // hasVariants: product?.hasVariants || false,
    // variants: product?.variants || [],
  });

  // Estados para manejo de UI de Códigos de Barras
  const [newBarcode, setNewBarcode] = useState('');
  
  // Estados para manejo de UI de Categorías
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);

  // --- ELIMINADO ---
  // Estados para UI de Variantes
  // const [newVariantColor, setNewVariantColor] = useState('');
  // ... (etc)


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || formData.price <= 0 || formData.costPrice < 0) { // Permitimos costo 0
      alert('Por favor completa Nombre, Precio y Costo');
      return;
    }
    
    // --- ELIMINADO ---
    // Chequeo de variantes
    // if (formData.hasVariants && formData.variants.length === 0) { ... }

    if (product) {
      // Al editar, se preservan las propiedades del producto original
      // y se sobrescriben con las del formulario
      onSave({ ...product, ...formData });
    } else {
      // Al crear, añadimos hasVariants y variants hardcodeados
      onSave({ 
        ...formData, 
        hasVariants: false, // <--- CAMBIO
        variants: []        // <--- CAMBIO
      });
    }
    
    onClose();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
      
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: name === 'price' || name === 'costPrice' || name === 'stockStore' || name === 'stockWarehouse' || name === 'minStock'
          ? parseFloat(value) || 0 
          : value
      }));
    }
  };
  
  // (Funciones de Barcode sin cambios)
  const handleAddBarcode = () => {
    if (newBarcode.trim() && !formData.barcodes.includes(newBarcode.trim())) {
      setFormData(prev => ({
        ...prev,
        barcodes: [...prev.barcodes, newBarcode.trim()]
      }));
      setNewBarcode('');
    } else if (formData.barcodes.includes(newBarcode.trim())) {
      alert('Este código de barras ya ha sido agregado.');
    }
  };

  const handleRemoveBarcode = (barcodeToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      barcodes: prev.barcodes.filter(b => b !== barcodeToRemove)
    }));
  };

  // (Función de Categoría sin cambios)
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === '__new__') {
      setShowNewCategoryInput(true);
    } else {
      setFormData(prev => ({ ...prev, category: value }));
    }
  };

  // (Función de Categoría sin cambios)
  const handleAddNewCategory = () => {
    if (newCategoryName.trim() && !categories.includes(newCategoryName.trim())) {
      addCategory(newCategoryName.trim());
      setFormData(prev => ({ ...prev, category: newCategoryName.trim() }));
      setNewCategoryName('');
      setShowNewCategoryInput(false);
    } else if (categories.includes(newCategoryName.trim())) {
      alert('Esta categoría ya existe');
    }
  };

  // --- ELIMINADO ---
  // handleAddVariant
  // handleRemoveVariant

// --- JSX ---
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">
            {product ? 'Editar Producto' : 'Nuevo Producto'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del Producto *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Bloque de Múltiples Códigos de Barras (Sin cambios) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Códigos de Barras (Opcional)
            </label>
            {/* <p className="text-xs text-gray-500 mb-2"> ... </p> */}
            <div className="flex space-x-2">
              <input
                type="text"
                value={newBarcode}
                onChange={(e) => setNewBarcode(e.target.value)}
                className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ingresa un código y presiona 'Agregar'"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddBarcode();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAddBarcode}
                className="bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Agregar</span>
              </button>
            </div>
            
            {formData.barcodes.length > 0 && (
              <div className="mt-3 space-y-2 max-h-32 overflow-y-auto p-3 bg-gray-50 rounded-lg border">
                {formData.barcodes.map((barcode, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-white rounded border">
                    <span className="font-mono text-sm">{barcode}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveBarcode(barcode)}
                      className="p-1 text-red-500 hover:bg-red-100 rounded-full"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Bloque de Categoría (sin cambios en JSX) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Categoría
            </label>
            {!showNewCategoryInput ? (
              <select
                name="category"
                value={formData.category}
                onChange={handleCategoryChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Seleccionar categoría</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
                <option value="__new__">+ Crear nueva categoría</option>
              </select>
            ) : (
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Nombre de la nueva categoría"
                  className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                  onKeyPress={(e) => e.key === 'Enter' && handleAddNewCategory()}
                />
                <button
                  type="button"
                  onClick={handleAddNewCategory}
                  className="bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Agregar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowNewCategoryInput(false);
                    setNewCategoryName('');
                  }}
                  className="bg-gray-500 text-white px-4 py-3 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>

          
          {/* --- ELIMINADO --- */}
          {/* Checkbox de Variantes */}
          
          {/* Checkbox de Precio Variable (Sin cambios) */}
          <div className="flex items-center space-x-2 p-3 bg-yellow-50 rounded-lg">
            <input
              type="checkbox"
              id="hasVariablePrice"
              name="hasVariablePrice"
              checked={formData.hasVariablePrice}
              onChange={handleChange}
              className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
            />
            <label htmlFor="hasVariablePrice" className="text-sm font-medium text-gray-700">
              Precio Variable (Vendedor decide precio en caja)
            </label>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Precio de Venta (CLP) *
              </label>
              <input
                type="number"
                step="1"
                name="price"
                value={formData.price}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                min="0"
                placeholder="Ej: 1500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Costo Total de Compra (CLP) *
              </label>
              <input
                type="number"
                step="1"
                name="costPrice"
                value={formData.costPrice}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                min="0"
                placeholder="Ej: 10000"
              />
              <p className="text-xs text-gray-500 mt-1">
                Costo total de todas las unidades compradas
              </p>
            </div>
          </div>
          
          {/* --- CAMBIO --- */}
          {/* Stock simple ahora está siempre visible */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stock en Tienda
              </label>
              <input
                type="number"
                name="stockStore"
                value={formData.stockStore}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stock en Bodega
              </label>
              <input
                type="number"
                name="stockWarehouse"
                value={formData.stockWarehouse}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="0"
              />
            </div>
          </div>

          {/* --- ELIMINADO --- */}
          {/* Sección de Variantes */}

          {/* Stock Mínimo (sin cambios) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stock Mínimo (Total)
            </label>
            <input
              type="number"
              name="minStock"
              value={formData.minStock}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="0"
            />
            <p className="text-xs text-gray-500 mt-1">
              Alerta cuando el stock total (tienda + bodega) sea menor a este número.
            </p>
          </div>

          {/* Descripción (sin cambios) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Botones (sin cambios) */}
          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              {product ? 'Actualizar' : 'Crear'} Producto
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-500 text-white py-3 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}