import React from 'react';
import { useApp } from '../../context/AppContext';
import { BarChart3, TrendingUp, Package, DollarSign, Calendar } from 'lucide-react';

export function Analytics() {
  const { products, sales } = useApp();

  // Análisis de productos más vendidos
  const productSales = sales.reduce((acc, sale) => {
    acc[sale.productId] = (acc[sale.productId] || 0) + sale.quantity;
    return acc;
  }, {} as Record<string, number>);

  const topProducts = Object.entries(productSales)
    .map(([productId, quantity]) => {
      const product = products.find(p => p.id === productId);
      return { product: product?.name || 'Producto eliminado', quantity };
    })
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  // Análisis de categorías
  const categorySales = sales.reduce((acc, sale) => {
    const product = products.find(p => p.id === sale.productId);
    const category = product?.category || 'Sin categoría';
    acc[category] = (acc[category] || 0) + sale.totalPrice;
    return acc;
  }, {} as Record<string, number>);

  const topCategories = Object.entries(categorySales)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Análisis temporal
  const salesByMonth = sales.reduce((acc, sale) => {
    const month = new Date(sale.timestamp).toLocaleDateString('es-ES', { year: 'numeric', month: 'long' });
    acc[month] = (acc[month] || 0) + sale.totalPrice;
    return acc;
  }, {} as Record<string, number>);

  const monthlySales = Object.entries(salesByMonth)
    .slice(-6)
    .map(([month, revenue]) => ({ month, revenue }));

  // --- NUEVA LÓGICA: Ventas de todos los productos en el mes actual ---
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const currentMonthName = now.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

  // 1. Filtrar ventas del mes
  const salesThisMonth = sales.filter(sale => {
    const d = new Date(sale.timestamp);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  // 2. Agrupar por producto
  const productStatsThisMonth = salesThisMonth.reduce((acc, sale) => {
    if (!acc[sale.productId]) {
      // Intentamos buscar el producto actual para obtener categoría actualizada, 
      // si no, usamos la info de la venta o valores por defecto.
      const currentProduct = products.find(p => p.id === sale.productId);
      
      acc[sale.productId] = {
        name: currentProduct?.name || sale.productName || 'Producto desconocido',
        category: currentProduct?.category || 'Sin categoría',
        quantity: 0,
        totalRevenue: 0
      };
    }
    
    acc[sale.productId].quantity += sale.quantity;
    acc[sale.productId].totalRevenue += sale.totalPrice;
    
    return acc;
  }, {} as Record<string, { name: string, category: string, quantity: number, totalRevenue: number }>);

  // 3. Convertir a array y ordenar (por ingresos descendente)
  const monthlyProductList = Object.values(productStatsThisMonth).sort((a, b) => b.totalRevenue - a.totalRevenue);
  // --- FIN NUEVA LÓGICA ---

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Analíticas</h1>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <BarChart3 className="w-4 h-4" />
          <span>Datos en tiempo real</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Productos más vendidos */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center space-x-2 mb-4">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold">Top 5 Productos (Histórico)</h3>
          </div>
          <div className="space-y-3">
            {topProducts.map((item, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold">
                    {index + 1}
                  </div>
                  <span className="font-medium">{item.product}</span>
                </div>
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                  {item.quantity} vendidos
                </span>
              </div>
            ))}
            {topProducts.length === 0 && (
              <p className="text-gray-500 text-center py-8">No hay datos de ventas disponibles</p>
            )}
          </div>
        </div>

        {/* Ventas por categoría */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center space-x-2 mb-4">
            <Package className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-semibold">Ingresos por Categoría</h3>
          </div>
          <div className="space-y-3">
            {topCategories.map(([category, revenue], index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-semibold">
                    {index + 1}
                  </div>
                  <span className="font-medium">{category}</span>
                </div>
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                  ${revenue.toFixed(2)}
                </span>
              </div>
            ))}
            {topCategories.length === 0 && (
              <p className="text-gray-500 text-center py-8">No hay datos de ventas disponibles</p>
            )}
          </div>
        </div>
      </div>

      {/* Gráfico de ventas mensuales */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center space-x-2 mb-6">
          <DollarSign className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-semibold">Tendencia de Ventas Mensuales</h3>
        </div>
        {monthlySales.length > 0 ? (
          <div className="space-y-4">
            {monthlySales.map((data, index) => {
              const maxRevenue = Math.max(...monthlySales.map(m => m.revenue));
              const percentage = maxRevenue > 0 ? (data.revenue / maxRevenue) * 100 : 0;
              
              return (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">{data.month}</span>
                    <span className="text-sm font-semibold text-purple-600">${data.revenue.toFixed(2)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-purple-600 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No hay datos suficientes para mostrar tendencias</p>
        )}
      </div>

      {/* --- NUEVA SECCIÓN: LISTA DE VENTAS POR PRODUCTO (MES ACTUAL) --- */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center space-x-2 mb-4">
          <Calendar className="w-5 h-5 text-orange-600" />
          <h3 className="text-lg font-semibold">Detalle de Ventas por Producto - {currentMonthName}</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoría</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unidades Vendidas</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Ingresos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {monthlyProductList.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{item.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{item.category}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{item.quantity}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-green-600">
                    ${item.totalRevenue.toLocaleString('es-CL')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {monthlyProductList.length === 0 && (
            <p className="text-gray-500 text-center py-8">
              No hay ventas registradas en este mes.
            </p>
          )}
        </div>
      </div>

      {/* Resumen de métricas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-xl">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-blue-100 text-sm">Total de Productos</p>
              <p className="text-3xl font-bold">{products.length}</p>
            </div>
            <Package className="w-8 h-8 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-xl">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-green-100 text-sm">Total de Ventas</p>
              <p className="text-3xl font-bold">{sales.length}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-xl">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-purple-100 text-sm">Ingresos Totales</p>
              <p className="text-3xl font-bold">
                ${sales.reduce((sum, sale) => sum + sale.totalPrice, 0).toFixed(2)}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-purple-200" />
          </div>
        </div>
      </div>
    </div>
  );
}