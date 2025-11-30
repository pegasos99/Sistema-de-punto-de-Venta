import React from 'react';
import { useApp } from '../../context/AppContext';
import { StatsCard } from './StatsCard';
import { DollarSign, Package, ShoppingCart, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';

export function Dashboard() {
  const { products, sales, expenses } = useApp();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const salesToday = sales.filter(sale => {
    const saleDate = new Date(sale.timestamp);
    saleDate.setHours(0, 0, 0, 0);
    return saleDate.getTime() === today.getTime();
  });

  // Filtrar gastos de hoy
  const expensesToday = expenses.filter(expense => {
    const expenseDate = new Date(expense.date);
    expenseDate.setHours(0, 0, 0, 0);
    return expenseDate.getTime() === today.getTime();
  });

  // Filtrar ventas del mes actual
  const currentMonth = new Date();
  const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const salesThisMonth = sales.filter(sale => {
    const saleDate = new Date(sale.timestamp);
    return saleDate >= startOfMonth;
  });

  // Filtrar gastos del mes actual
  const expensesThisMonth = expenses.filter(expense => {
    const expenseDate = new Date(expense.date);
    return expenseDate >= startOfMonth;
  });

  // --- ¡FUNCIÓN CORREGIDA! ---
  // Función para calcular ganancia real (considerando IVA en tarjetas)
  const calculateRealProfit = (sale: any) => {
    // 1. Encontrar el producto primero
    const product = products.find(p => p.id === sale.productId);
    
    // 2. Calcular el stock total desde el 'product' (si existe)
    const totalStock = product ? (product.stockStore + product.stockWarehouse) : 1;
    
    // 3. Calcular el costo unitario
    // (Usa el 'sale.costPrice' que se guardó en el momento de la venta.
    // Este 'costPrice' ya es el costo unitario)
    const unitCost = sale.costPrice || 0;
    
    let revenue = sale.totalPrice;
    const cost = unitCost * sale.quantity;
    
    // Si es pago con tarjeta, descontar IVA del ingreso
    if (sale.paymentMethod === 'tarjeta') {
      revenue = revenue * 0.81; // Descontar 19% IVA
    }
    
    // El costo aquí SÍ se refiere al costo unitario guardado en la venta
    return revenue - cost;
  };
  // --- FIN DE LA CORRECCIÓN ---


  const totalRevenue = salesToday.reduce((sum, sale) => sum + sale.totalPrice, 0);
  const totalProfit = salesToday.reduce((sum, sale) => sum + calculateRealProfit(sale), 0);
  const totalExpensesToday = expensesToday.reduce((sum, expense) => sum + expense.amount, 0);
  const netProfitToday = totalProfit - totalExpensesToday;

  // Cálculos mensuales
  const totalRevenueMonth = salesThisMonth.reduce((sum, sale) => sum + sale.totalPrice, 0);
  const totalProfitMonth = salesThisMonth.reduce((sum, sale) => sum + calculateRealProfit(sale), 0);
  const totalExpensesMonth = expensesThisMonth.reduce((sum, expense) => sum + expense.amount, 0);
  const netProfitMonth = totalProfitMonth - totalExpensesMonth;

  const totalSalesToday = salesToday.length;
  const productsCount = products.length;
  const lowStockProducts = products.filter(p => (p.stockStore + p.stockWarehouse) <= p.minStock);

  const recentSales = sales.slice(-5).reverse();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <div className="text-sm text-gray-600">
          {new Date().toLocaleDateString('es-ES', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Ventas Hoy"
          value={totalSalesToday}
          icon={ShoppingCart}
          color="blue"
        />
        <StatsCard
          title="Ingresos Hoy"
          value={`$${totalRevenue.toLocaleString('es-CL')}`}
          icon={DollarSign}
          color="green"
        />
        <StatsCard
          title="Ganancia Neta Hoy"
          value={`$${netProfitToday.toLocaleString('es-CL')}`}
          icon={netProfitToday >= 0 ? TrendingUp : TrendingDown}
          color={netProfitToday >= 0 ? "green" : "red"}
        />
        <StatsCard
          title="Productos Total"
          value={productsCount}
          icon={Package}
          color="yellow"
        />
      </div>

      {/* Métricas mensuales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600">Ingresos del Mes</p>
              <p className="text-2xl font-bold text-blue-700">${totalRevenueMonth.toLocaleString('es-CL')}</p>
              <p className="text-xs text-blue-600 mt-1">{salesThisMonth.length} ventas</p>
            </div>
            <DollarSign className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-green-50 p-6 rounded-xl border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600">Ganancia Bruta Mes</p>
              <p className="text-2xl font-bold text-green-700">${totalProfitMonth.toLocaleString('es-CL')}</p>
              <p className="text-xs text-green-600 mt-1">Solo de ventas</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-orange-50 p-6 rounded-xl border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-600">Gastos del Mes</p>
              <p className="text-2xl font-bold text-orange-700">${totalExpensesMonth.toLocaleString('es-CL')}</p>
              <p className="text-xs text-orange-600 mt-1">Todos los gastos</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-orange-600" />
          </div>
        </div>

        <div className={`p-6 rounded-xl border-2 ${
          netProfitMonth >= 0 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${netProfitMonth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {netProfitMonth >= 0 ? 'Ganancia Neta Mes' : 'Pérdida del Mes'}
              </p>
              <p className={`text-2xl font-bold ${netProfitMonth >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                ${Math.abs(netProfitMonth).toLocaleString('es-CL')}
              </p>
              <p className={`text-xs mt-1 ${netProfitMonth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {netProfitMonth >= 0 ? '✓ Rentable' : '⚠ En pérdida'}
              </p>
            </div>
            {netProfitMonth >= 0 ? (
              <TrendingUp className="w-8 h-8 text-green-600" />
            ) : (
              <TrendingDown className="w-8 h-8 text-red-600" />
            )}
          </div>
        </div>
      </div>

      {/* Alerta de stock bajo */}
      {lowStockProducts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 text-red-700 mb-2">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="font-semibold">Alerta de Stock Bajo</h3>
          </div>
          <p className="text-red-600">
            {lowStockProducts.length} producto(s) con stock total por debajo del mínimo
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Ventas Recientes</h3>
          <div className="space-y-3">
            {recentSales.length > 0 ? (
              recentSales.map((sale) => (
                <div key={sale.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{sale.productName}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(sale.timestamp).toLocaleTimeString('es-ES')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">${sale.totalPrice.toLocaleString('es-CL')}</p>
                    <p className="text-sm text-gray-600">x{sale.quantity}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">No hay ventas recientes</p>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Productos con Stock Bajo</h3>
          <div className="space-y-3">
            {lowStockProducts.length > 0 ? (
              lowStockProducts.map((product) => (
                <div key={product.id} className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-200">
                  <div>
                    <p className="font-medium text-gray-900">{product.name}</p>
                    <p className="text-sm text-gray-600">{product.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-red-600">{product.stockStore + product.stockWarehouse} restantes</p>
                    <p className="text-xs text-gray-500">Mín: {product.minStock}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-green-600 text-center py-8 font-medium">
                ✓ Todos los productos tienen stock suficiente
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}