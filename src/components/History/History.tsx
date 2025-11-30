import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Calendar, Search, TrendingUp, Clock } from 'lucide-react';

export function History() {
  // Obtener 'products' además de 'sales'
  const { sales, products } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const filteredSales = sales.filter(sale => {
    // Lógica de búsqueda actualizada y más robusta
    const product = products.find(p => p.id === sale.productId);
    
    const matchesProductName = sale.productName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesScannedBarcode = sale.barcode.includes(searchTerm);
    const matchesProductBarcodes = product && product.barcodes && product.barcodes.some(b => b.includes(searchTerm));
    
    const matchesSearch = matchesProductName || matchesScannedBarcode || matchesProductBarcodes;
    
    const matchesDate = !dateFilter || 
                       new Date(sale.timestamp).toDateString() === new Date(dateFilter).toDateString();
    
    return matchesSearch && matchesDate;
  }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.totalPrice, 0);
  const totalItems = filteredSales.reduce((sum, sale) => sum + sale.quantity, 0);

  // ... (El resto del componente de historial no necesita cambios) ...
  const salesByDay = sales.reduce((acc, sale) => {
    const date = new Date(sale.timestamp).toDateString();
    acc[date] = (acc[date] || 0) + sale.totalPrice;
    return acc;
  }, {} as Record<string, number>);

  const recentDays = Object.entries(salesByDay)
    .slice(-7)
    .map(([date, revenue]) => ({
      date: new Date(date).toLocaleDateString('es-ES', { weekday: 'short', month: 'short', day: 'numeric' }),
      revenue
    }));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Historial de Ventas</h1>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Clock className="w-4 h-4" />
          <span>Última actualización: {new Date().toLocaleTimeString('es-ES')}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total de Ventas</p>
              <p className="text-2xl font-bold text-blue-600">{filteredSales.length}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Productos Vendidos</p>
              <p className="text-2xl font-bold text-green-600">{totalItems}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Ingresos Totales</p>
              <p className="text-2xl font-bold text-purple-600">${totalRevenue.toLocaleString('es-CL')}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Ventas por Día (Últimos 7 días)</h3>
        <div className="grid grid-cols-7 gap-2">
          {recentDays.map((day, index) => (
            <div key={index} className="text-center">
              <div className="text-xs text-gray-600 mb-1">{day.date}</div>
              <div 
                className="bg-blue-100 rounded-lg p-2 relative"
                style={{ height: `${Math.max(40, (day.revenue / Math.max(...recentDays.map(d => d.revenue))) * 100)}px` }}
              >
                <div className="absolute inset-0 bg-blue-500 rounded-lg opacity-75" 
                     style={{ height: `${(day.revenue / Math.max(...recentDays.map(d => d.revenue))) * 100}%` }}
                ></div>
                <div className="relative z-10 text-xs font-semibold text-white mt-1">
                  ${day.revenue.toLocaleString('es-CL')}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por producto o código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha y Hora
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Producto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vendedor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cantidad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Precio Unitario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSales.map(sale => (
                <tr key={sale.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>
                      <div>{new Date(sale.timestamp).toLocaleDateString('es-ES')}</div>
                      <div className="text-gray-500">
                        {new Date(sale.timestamp).toLocaleTimeString('es-ES')}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{sale.productName}</div>
                      <div className="text-sm text-gray-500">
                        {/* Muestra el código que se usó en la venta */}
                        {sale.barcode ? `Código: ${sale.barcode}` : 'Sin código de barras'}
                      </div>
                      {sale.weight && (
                        <div className="text-xs text-blue-600">Peso: {sale.weight}g</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {sale.userName || 'Usuario desconocido'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {sale.quantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${sale.unitPrice.toLocaleString('es-CL')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                    ${sale.totalPrice.toLocaleString('es-CL')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredSales.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No se encontraron ventas</p>
          </div>
        )}
      </div>
    </div>
  );
}