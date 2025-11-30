// Contenido para: src/components/Settings/Settings.tsx (Corregido)

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CategoryManager } from './CategoryManager';
import { Download, Upload, Trash2, AlertTriangle, Settings as SettingsIcon } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Product } from '../../types'; // Importamos Product

// --- Definimos la base de datos "por defecto" ---
// (Esto es una copia de tu db.json inicial)
const defaultCategories = [
  { "id": "bebidas", "name": "Bebidas" },
  { "id": "snacks", "name": "Snacks" },
  { "id": "lácteos", "name": "Lácteos" },
  { "id": "panadería", "name": "Panadería" },
  { "id": "limpieza", "name": "Limpieza" },
  { "id": "anillo", "name": "Anillo" },
  { "id": "pulsera", "name": "Pulsera" },
  { "id": "otros", "name": "Otros" }
];

const defaultAdminUser = {
  "id": "1",
  "username": "admin",
  "password": "admin123",
  "role": "admin",
  "fullName": "Administrador",
  "createdAt": new Date().toISOString(),
  "isActive": true
};

const defaultDatabase = {
  products: [],
  sales: [],
  expenses: [],
  recurringExpenses: [],
  categories: defaultCategories,
  users: [defaultAdminUser]
};
// --- Fin de la base de datos por defecto ---


// (El helper getProductTotalStock no cambia)
const getProductTotalStock = (product: Product) => {
  if (product.hasVariants) {
    return product.variants.reduce((sum, v) => sum + v.stockStore + v.stockWarehouse, 0);
  }
  return product.stockStore + product.stockWarehouse;
};

// (El helper getProductStoreStock no cambia)
const getProductStoreStock = (product: Product) => {
  if (product.hasVariants) {
    return product.variants.reduce((sum, v) => sum + v.stockStore, 0);
  }
  return product.stockStore;
};

export function Settings() {
  const { products, sales } = useApp();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // (exportData y exportToExcel no cambian)
  const exportData = () => {
    // ... (Tu lógica de exportar JSON)
    const data = {
      products,
      sales,
      exportDate: new Date().toISOString(),
      version: '1.0.0'
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `storemanager-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    alert('Datos exportados exitosamente');
  };

  const exportToExcel = () => {
    // ... (Tu lógica de exportar Excel)
    const workbook = XLSX.utils.book_new();
    
    const productsData = products.map(product => ({
      'Nombre': product.name,
      'Códigos de Barras': product.barcodes.join(', '),
      'Precio (CLP)': product.price,
      'Costo (CLP)': product.costPrice,
      'Stock Tienda': getProductStoreStock(product),
      'Stock Total': getProductTotalStock(product),
      'Stock Mínimo': product.minStock,
      'Categoría': product.category,
      'Descripción': product.description || '',
      'Maneja Variantes': product.hasVariants ? 'Sí' : 'No',
      'Variantes (Color/Tienda/Bodega)': product.hasVariants 
        ? product.variants.map(v => `${v.color} (T:${v.stockStore} / B:${v.stockWarehouse})`).join('; ')
        : 'N/A',
      'Fecha Creación': new Date(product.createdAt).toLocaleDateString('es-ES'),
      'Última Actualización': new Date(product.updatedAt).toLocaleDateString('es-ES')
    }));
    
    const productsSheet = XLSX.utils.json_to_sheet(productsData);
    XLSX.utils.book_append_sheet(workbook, productsSheet, 'Productos');
    
    const salesData = sales.map(sale => ({
      'Fecha': new Date(sale.timestamp).toLocaleDateString('es-ES'),
      'Hora': new Date(sale.timestamp).toLocaleTimeString('es-ES'),
      'Producto': sale.productName,
      'Variante (Color)': sale.variantColor || 'N/A',
      'Código de Barras': sale.barcode,
      'Cantidad': sale.quantity,
      'Precio Unitario (CLP)': sale.unitPrice,
      'Total (CLP)': sale.totalPrice,
      'Vendedor': sale.userName,
      'Método Pago': sale.paymentMethod
    }));
    
    const salesSheet = XLSX.utils.json_to_sheet(salesData);
    XLSX.utils.book_append_sheet(workbook, salesSheet, 'Ventas');
    
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalPrice, 0);
    const totalSales = sales.length;
    const lowStockProducts = products.filter(p => getProductTotalStock(p) <= p.minStock).length;
    
    const summaryData = [
      { 'Métrica': 'Total de Productos', 'Valor': products.length },
      { 'Métrica': 'Total de Ventas', 'Valor': totalSales },
      { 'Métrica': 'Ingresos Totales (CLP)', 'Valor': totalRevenue },
      { 'Métrica': 'Productos con Stock Bajo', 'Valor': lowStockProducts },
      { 'Métrica': 'Fecha de Exportación', 'Valor': new Date().toLocaleDateString('es-ES') }
    ];
    
    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumen');
    
    const fileName = `storemanager-datos-${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    
    alert('Datos exportados a Excel exitosamente');
  };

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    alert('La importación de JSON está deshabilitada en esta versión.');
    // La lógica antigua de localStorage no funciona con json-server
  };
  
  // --- ¡FUNCIÓN CORREGIDA! ---
  // Esta función ahora "resetea" el db.json usando la API de json-server
  const clearAllData = async () => {
    if (!confirm('¿Estás seguro de ELIMINAR TODOS LOS DATOS? Esta acción es irreversible y restaurará la aplicación a su estado de fábrica.')) {
      setShowDeleteConfirm(false);
      return;
    }
    
    try {
      // json-server permite sobrescribir toda la base de datos con PUT a /db
      await fetch('http://localhost:8080/db', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(defaultDatabase)
      });
      
      // Limpiamos el localStorage que sí usamos
      localStorage.removeItem('pos-current-user');
      localStorage.removeItem('pos-last-expense-check');
      
      alert('Todos los datos han sido eliminados. La aplicación se recargará.');
      window.location.reload();
      
    } catch (err) {
      console.error("Error clearing data:", err);
      alert("Hubo un error al eliminar los datos. Asegúrate de que el servidor (iniciar-storemanager.bat) esté corriendo.");
    }
    setShowDeleteConfirm(false);
  };

  const resetToSampleData = () => {
    // Esta función ahora hace lo mismo que clearAllData
    clearAllData();
  };


  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center space-x-2">
        <SettingsIcon className="w-8 h-8 text-gray-700" />
        <h1 className="text-3xl font-bold text-gray-900">Configuración</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="lg:col-span-2">
          <CategoryManager />
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
            <Download className="w-5 h-5 text-blue-600" />
            <span>Gestión de Datos</span>
          </h3>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Exportar Datos</h4>
              <p className="text-sm text-gray-600 mb-3">
                Descarga una copia de seguridad en formato JSON o Excel
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={exportData}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Exportar JSON</span>
                </button>
                <button
                  onClick={exportToExcel}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Exportar Excel</span>
                </button>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Importar Datos</h4>
              <p className="text-sm text-gray-600 mb-3">
                Restaura datos desde un archivo de respaldo
              </p>
              <label className="bg-gray-400 text-white px-4 py-2 rounded-lg cursor-not-allowed flex items-center space-x-2 inline-flex">
                <Upload className="w-4 h-4" />
                <span>Importar (Deshabilitado)</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={importData}
                  className="hidden"
                  disabled
                />
              </label>
            </div>

            <div>
              <h4 className="font-medium mb-2">Restaurar Datos de Muestra</h4>
              <p className="text-sm text-gray-600 mb-3">
                Restaura la base de datos a los valores de fábrica
              </p>
              <button
                onClick={resetToSampleData}
                className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors"
              >
                Restaurar Fábrica
              </button>
            </div>
          </div>
        </div>

        {/* Estadísticas del sistema */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Estadísticas del Sistema</h3>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
              <span className="text-sm font-medium">Total de Productos</span>
              <span className="text-lg font-bold text-blue-600">{products.length}</span>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <span className="text-sm font-medium">Total de Ventas</span>
              <span className="text-lg font-bold text-green-600">{sales.length}</span>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
              <span className="text-sm font-medium">Ingresos Totales</span>
              <span className="text-lg font-bold text-purple-600">
                ${sales.reduce((sum, sale) => sum + sale.totalPrice, 0).toLocaleString('es-CL')}
              </span>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
              <span className="text-sm font-medium">Productos con Stock Bajo</span>
              <span className="text-lg font-bold text-yellow-600">
                {products.filter(p => getProductTotalStock(p) <= p.minStock).length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Información del sistema */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Información del Sistema</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Versión:</span>
            <span className="ml-2 text-gray-600">1.0.0</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Última actualización:</span>
            <span className="ml-2 text-gray-600">{new Date().toLocaleDateString('es-ES')}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Almacenamiento:</span>
            <span className="ml-2 text-gray-600">Local (db.json)</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Plataforma:</span>
            <span className="ml-2 text-gray-600">Web Application</span>
          </div>
        </div>
      </div>

      {/* Zona de peligro */}
      <div className="bg-red-50 border border-red-200 p-6 rounded-xl">
        <div className="flex items-center space-x-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <h3 className="text-lg font-semibold text-red-800">Zona de Peligro</h3>
        </div>
        
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-red-800 mb-2">Eliminar Todos los Datos</h4>
            <p className="text-sm text-red-600 mb-3">
              Esta acción eliminará permanentemente todos los productos, ventas e historial. No se puede deshacer.
            </p>
            
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Eliminar Todos los Datos</span>
              </button>
            ) : (
              <div className="space-y-2">
                <p className="text-sm font-medium text-red-800">¿Estás absolutamente seguro?</p>
                <div className="space-x-2">
                  <button
                    onClick={clearAllData}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
                  >
                    Sí, eliminar todo
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors text-sm"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}