import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { TrendingUp, Calendar, Package, DollarSign, Receipt } from 'lucide-react';

export function ProfitAnalysis() {
  const { products, sales, expenses } = useApp();
  const [selectedPeriod, setSelectedPeriod] = useState('day');

  const calculateProfitBySale = (sale: any) => {
    let revenue = sale.totalPrice;
    const cost = sale.costPrice * sale.quantity;
    
    // Si es pago con tarjeta, descontar IVA de la ganancia
    if (sale.paymentMethod === 'tarjeta') {
      revenue = revenue * 0.81; // Descontar 19% IVA del ingreso
    }
    
    return revenue - cost;
  };

  const getDateRange = (period: string) => {
    const now = new Date();
    const start = new Date();
    
    switch (period) {
      case 'day':
        start.setHours(0, 0, 0, 0);
        break;
      case 'week':
        start.setDate(now.getDate() - 7);
        break;
      case 'month':
        start.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        start.setFullYear(now.getFullYear() - 1);
        break;
    }
    
    return { start, end: now };
  };

  const filterSalesByPeriod = (period: string) => {
    const { start, end } = getDateRange(period);
    return sales.filter(sale => {
      const saleDate = new Date(sale.timestamp);
      return saleDate >= start && saleDate <= end;
    });
  };

  const filteredSales = filterSalesByPeriod(selectedPeriod);
  const totalProfit = filteredSales.reduce((sum, sale) => sum + calculateProfitBySale(sale), 0);
  const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.totalPrice, 0);
  const totalSalesCost = filteredSales.reduce((sum, sale) => sum + (sale.costPrice * sale.quantity), 0);
  
  // Filtrar gastos por período
  const filterExpensesByPeriod = (period: string) => {
    const { start, end } = getDateRange(period);
    return expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate >= start && expenseDate <= end;
    });
  };
  
  const filteredExpenses = filterExpensesByPeriod(selectedPeriod);
  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const netProfit = totalProfit - totalExpenses;

  // Análisis por producto
  const profitByProduct = filteredSales.reduce((acc, sale) => {
    const productId = sale.productId;
    const profit = calculateProfitBySale(sale);
    
    if (!acc[productId]) {
      acc[productId] = {
        productName: sale.productName,
        totalProfit: 0,
        totalRevenue: 0,
        totalCost: 0,
        quantity: 0
      };
    }
    
    acc[productId].totalProfit += profit;
    acc[productId].totalRevenue += sale.totalPrice;
    acc[productId].totalCost += (sale.costPrice * sale.quantity);
    acc[productId].quantity += sale.quantity;
    
    return acc;
  }, {} as Record<string, any>);

  const topProfitableProducts = Object.values(profitByProduct)
    .sort((a: any, b: any) => b.totalProfit - a.totalProfit)
    .slice(0, 10);

  // Análisis mensual comparativo (últimos 6 meses)
  const getMonthlyComparison = () => {
    const months = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      
      const monthSales = sales.filter(sale => {
        const saleDate = new Date(sale.timestamp);
        return saleDate >= monthDate && saleDate < nextMonth;
      });
      
      const monthExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate >= monthDate && expenseDate < nextMonth;
      });
      
      const monthProfit = monthSales.reduce((sum, sale) => sum + calculateProfitBySale(sale), 0);
      const monthExpensesTotal = monthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      const monthRevenue = monthSales.reduce((sum, sale) => sum + sale.totalPrice, 0);
      
      months.push({
        month: monthDate.toLocaleDateString('es-ES', { year: 'numeric', month: 'long' }),
        profit: monthProfit,
        expenses: monthExpensesTotal,
        netProfit: monthProfit - monthExpensesTotal,
        revenue: monthRevenue,
        salesCount: monthSales.length
      });
    }
    
    return months;
  };
  
  const monthlyData = getMonthlyComparison();

  const getPeriodLabel = (period: string) => {
    switch (period) {
      case 'day': return 'Hoy';
      case 'week': return 'Últimos 7 días';
      case 'month': return 'Último mes';
      case 'year': return 'Último año';
      default: return 'Hoy';
    }
  };

  const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100) : 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Análisis de Ganancias</h1>
        <div className="flex items-center space-x-2">
          <Calendar className="w-5 h-5 text-gray-600" />
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="day">Hoy</option>
            <option value="week">Últimos 7 días</option>
            <option value="month">Último mes</option>
            <option value="year">Último año</option>
          </select>
        </div>
      </div>

      {/* Resumen de ganancias */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-green-50 p-6 rounded-xl border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600">Ganancia Bruta</p>
              <p className="text-2xl font-bold text-green-700">${totalProfit.toLocaleString('es-CL')}</p>
              <p className="text-xs text-green-600 mt-1">{getPeriodLabel(selectedPeriod)}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600">Ingresos Totales</p>
              <p className="text-2xl font-bold text-blue-700">${totalRevenue.toLocaleString('es-CL')}</p>
              <p className="text-xs text-blue-600 mt-1">{filteredSales.length} ventas</p>
            </div>
            <DollarSign className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-orange-50 p-6 rounded-xl border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-600">Gastos Totales</p>
              <p className="text-2xl font-bold text-orange-700">${totalExpenses.toLocaleString('es-CL')}</p>
              <p className="text-xs text-orange-600 mt-1">Gastos del período</p>
            </div>
            <Receipt className="w-8 h-8 text-orange-600" />
          </div>
        </div>

        <div className="bg-red-50 p-6 rounded-xl border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600">Ganancia Neta</p>
              <p className="text-2xl font-bold text-red-700">${netProfit.toLocaleString('es-CL')}</p>
              <p className="text-xs text-red-600 mt-1">Ganancia - Gastos</p>
            </div>
            <TrendingUp className="w-8 h-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* Análisis mensual comparativo */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Análisis Mensual Comparativo (Últimos 6 Meses)</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mes</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ventas</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ingresos</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ganancia Bruta</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gastos</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ganancia Neta</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Margen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {monthlyData.map((month, index) => {
                const margin = month.revenue > 0 ? ((month.netProfit / month.revenue) * 100) : 0;
                const isPositive = month.netProfit >= 0;
                
                return (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{month.month}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{month.salesCount}</td>
                    <td className="px-6 py-4 text-sm font-medium text-blue-600">
                      ${month.revenue.toLocaleString('es-CL')}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-green-600">
                      ${month.profit.toLocaleString('es-CL')}
                    </td>
                    <td className="px-6 py-4 text-sm text-orange-600">
                      ${month.expenses.toLocaleString('es-CL')}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold">
                      <span className={isPositive ? 'text-green-600' : 'text-red-600'}>
                        ${month.netProfit.toLocaleString('es-CL')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        margin >= 20 ? 'bg-green-100 text-green-800' :
                        margin >= 10 ? 'bg-yellow-100 text-yellow-800' :
                        margin >= 0 ? 'bg-orange-100 text-orange-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {margin.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {monthlyData.length === 0 && (
          <p className="text-center py-8 text-gray-500">
            No hay datos suficientes para el análisis mensual
          </p>
        )}
      </div>

      {/* Productos más rentables */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Productos Más Rentables - {getPeriodLabel(selectedPeriod)}</h3>
        
        {topProfitableProducts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cantidad Vendida</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ingresos</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Costos</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ganancia</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Margen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {topProfitableProducts.map((product: any, index) => {
                  const margin = product.totalRevenue > 0 ? ((product.totalProfit / product.totalRevenue) * 100) : 0;
                  return (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-semibold text-sm">
                            {index + 1}
                          </div>
                          <span className="font-medium text-gray-900">{product.productName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{product.quantity}</td>
                      <td className="px-6 py-4 text-sm font-medium text-blue-600">
                        ${product.totalRevenue.toLocaleString('es-CL')}
                      </td>
                      <td className="px-6 py-4 text-sm text-red-600">
                        ${product.totalCost.toLocaleString('es-CL')}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-green-600">
                        ${product.totalProfit.toLocaleString('es-CL')}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          margin >= 50 ? 'bg-green-100 text-green-800' :
                          margin >= 30 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {margin.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center py-8 text-gray-500">
            No hay datos de ventas para el período seleccionado
          </p>
        )}
      </div>
    </div>
  );
}