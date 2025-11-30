import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Plus, 
  Trash2, 
  DollarSign, 
  Calendar, 
  Repeat, 
  FastForward,
  History, // <-- AÑADIDO
  X          // <-- AÑADIDO
} from 'lucide-react';
// Asegúrate de importar 'RecurringExpense'
import { Expense, RecurringExpense } from '../../types'; 

export function ExpenseManager() {
  const { 
    expenses, 
    recurringExpenses, 
    addRecurringExpense, 
    deleteRecurringExpense,
    addExpense // Usamos addExpense para gastos 'once' y 'adelantos'
  } = useApp();
  
  const [showForm, setShowForm] = useState(false);
  const [showHistory, setShowHistory] = useState(false); // <-- AÑADIDO
  
  // Estado del formulario
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState(0);
  const [category, setCategory] = useState<'personal' | 'local' | 'otros'>('otros');
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly' | 'once'>('once');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [dayOfWeek, setDayOfWeek] = useState(new Date().getDay());
  const [dayOfMonth, setDayOfMonth] = useState(new Date().getDate());
  
  // Guarda el ID de la regla que estamos adelantando
  const [ruleToUpdateId, setRuleToUpdateId] = useState<string | undefined>(undefined);

  const resetForm = () => {
    setDescription('');
    setAmount(0);
    setCategory('otros');
    setFrequency('once');
    setStartDate(new Date().toISOString().split('T')[0]);
    setDayOfWeek(new Date().getDay());
    setDayOfMonth(new Date().getDate());
    setShowForm(false);
    setRuleToUpdateId(undefined); 
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || amount <= 0 || !startDate) {
      alert('Completa Descripción, Monto y Fecha');
      return;
    }

    // Si es 'una sola vez' (o un adelanto), lo agregamos al log de gastos
    if (frequency === 'once') {
      addExpense({
        description,
        amount,
        category,
        date: new Date(startDate), // Usamos la fecha seleccionada
        recurringRuleId: ruleToUpdateId, // <-- Pasamos el ID de la regla (si existe)
      }, ruleToUpdateId); // <-- Pasamos el ID de la regla para "saltar" el pago
    } else {
      // Si es recurrente, creamos la REGLA
      const ruleData: Omit<RecurringExpense, 'id' | 'userName' | 'createdAt' | 'nextDueDate'> = {
        description,
        amount,
        category,
        frequency,
        startDate,
        dayOfWeek: frequency === 'weekly' ? dayOfWeek : undefined,
        dayOfMonth: frequency === 'monthly' ? dayOfMonth : undefined,
      };
      addRecurringExpense(ruleData);
    }
    
    resetForm();
  };
  
  const handleDeleteRule = (ruleId: string) => {
    if (confirm('¿Seguro que quieres eliminar esta regla de gasto programado?')) {
      deleteRecurringExpense(ruleId);
    }
  };
  
  const handleAdelantar = (rule: RecurringExpense) => {
    // Llenamos el formulario con los datos de la regla
    setDescription(rule.description);
    setAmount(rule.amount); // El usuario puede cambiar esto
    setCategory(rule.category);
    setFrequency('once'); // Importante: lo forzamos a 'una sola vez'
    setStartDate(new Date().toISOString().split('T')[0]); // Fecha de hoy (el usuario puede cambiarla)
    setRuleToUpdateId(rule.id); // <-- Guardamos el ID de la regla
    
    setShowForm(true); // Abrimos el formulario
  };
  
  // (Funciones helper sin cambios)
  const getFrequencyName = (rule: RecurringExpense) => {
    switch (rule.frequency) {
      case 'daily': return 'Diario';
      case 'weekly':
        const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        return `Semanal (cada ${days[rule.dayOfWeek || 0]})`;
      case 'monthly':
        return `Mensual (día ${rule.dayOfMonth || 1})`;
      default: return 'Una vez';
    }
  };

  // --- CÁLCULOS MODIFICADOS ---
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const expensesThisMonth = expenses.filter(expense => {
    const expenseDate = new Date(expense.date);
    return expenseDate.getMonth() === currentMonth &&
           expenseDate.getFullYear() === currentYear;
  });

  const totalExpensesMonth = expensesThisMonth.reduce((sum, expense) => sum + expense.amount, 0);
  // --- FIN CÁLCULOS MODIFICADOS ---


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Gestión de Gastos</h2>
        
        {/* --- BOTONES MODIFICADOS --- */}
        <div className="flex space-x-2">
          <button
            onClick={() => setShowHistory(true)}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
          >
            <History className="w-4 h-4" />
            <span>Ver Historial</span>
          </button>
          <button
            onClick={() => {
              resetForm();
              setFrequency('once'); 
              setShowForm(true);
            }}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Gasto</span>
          </button>
        </div>
        {/* --- FIN BOTONES MODIFICADOS --- */}
      </div>

      {/* --- TARJETA MODIFICADA --- */}
      <div className="bg-red-50 p-4 rounded-lg border border-red-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-red-600">Total Gastos (Mes Actual)</p>
            <p className="text-2xl font-bold text-red-700">${totalExpensesMonth.toLocaleString('es-CL')}</p>
          </div>
          <DollarSign className="w-8 h-8 text-red-600" />
        </div>
      </div>
      {/* --- FIN TARJETA MODIFICADA --- */}


      {/* Tabla de Reglas de Gastos Programados */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <h3 className="text-lg font-semibold p-4 border-b">Gastos Programados y Reglas</h3>
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Monto</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Frecuencia</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Próximo Cobro</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {recurringExpenses.map((rule) => (
              <tr key={rule.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium">{rule.description}</td>
                <td className="px-6 py-4 font-semibold text-red-600">
                  ${rule.amount.toLocaleString('es-CL')}
                </td>
                <td className="px-6 py-4 text-sm">{getFrequencyName(rule)}</td>
                <td className="px-6 py-4 text-sm">
                  {new Date(rule.nextDueDate).toLocaleDateString('es-ES')}
                </td>
                <td className="px-6 py-4 space-x-2">
                  <button
                    onClick={() => handleAdelantar(rule)}
                    className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded"
                    title="Adelantar o Pagar Manualmente"
                  >
                    <FastForward className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteRule(rule.id)}
                    className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded"
                    title="Eliminar Regla"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {recurringExpenses.length === 0 && (
          <p className="text-center py-8 text-gray-500">
            No hay gastos programados.
          </p>
        )}
      </div>

      {/* Formulario (Modal) */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full mx-4 max-h-screen overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              {frequency === 'once' ? (ruleToUpdateId ? 'Adelantar Gasto' : 'Registrar Gasto Único') : 'Crear Regla de Gasto'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ej: Sueldo, Arriendo, Luz"
                  className="w-full p-3 border border-gray-300 rounded-lg" required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monto (CLP)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                  className="w-full p-3 border border-gray-300 rounded-lg" required min="1"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full p-3 border border-gray-300 rounded-lg"
                  >
                    <option value="personal">Personal (Sueldos)</option>
                    <option value="local">Local (Gastos)</option>
                    <option value="otros">Otros</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Frecuencia</label>
                  <select
                    value={frequency}
                    disabled={!!ruleToUpdateId}
                    onChange={(e) => setFrequency(e.target.value as any)}
                    className={`w-full p-3 border border-gray-300 rounded-lg ${!!ruleToUpdateId ? 'bg-gray-100' : ''}`}
                  >
                    <option value="once">Una sola vez</option>
                    <option value="daily">Diario</option>
                    <option value="weekly">Semanal</option>
                    <option value="monthly">Mensual</option>
                  </select>
                </div>
              </div>

              {/* Fecha de Inicio (para todos) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {frequency === 'once' ? 'Fecha del Gasto' : 'Fecha de Inicio del Primer Cobro'}
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg" required
                />
              </div>

              {/* Opciones Condicionales (solo para reglas nuevas) */}
              {frequency === 'weekly' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Día de la Semana</label>
                  <select
                    value={dayOfWeek}
                    onChange={(e) => setDayOfWeek(parseInt(e.target.value))}
                    className="w-full p-3 border border-gray-300 rounded-lg"
                  >
                    <option value="1">Lunes</option>
                    <option value="2">Martes</option>
                    <option value="3">Miércoles</option>
                    <option value="4">Jueves</option>
                    <option value="5">Viernes</option>
                    <option value="6">Sábado</option>
                    <option value="0">Domingo</option>
                  </select>
                </div>
              )}
              
              {frequency === 'monthly' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Día del Mes (1-31)</label>
                  <input
                    type="number"
                    value={dayOfMonth}
                    onChange={(e) => setDayOfMonth(parseInt(e.target.value) || 1)}
                    className="w-full p-3 border border-gray-300 rounded-lg"
                    min="1" max="31"
                  />
                </div>
              )}

              {ruleToUpdateId && frequency === 'once' && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
                  💡 Estás registrando un pago manual para una regla existente. Al guardar, este pago se registrará y el próximo cobro automático se saltará al siguiente período.
                </div>
              )}

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700"
                >
                  {frequency === 'once' ? 'Registrar Gasto' : 'Guardar Regla'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL DE HISTORIAL NUEVO --- */}
      {showHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
            
            <div className="flex justify-between items-center mb-4 pb-4 border-b">
              <h3 className="text-xl font-semibold text-gray-900">
                Historial de Gastos
              </h3>
              <button
                onClick={() => setShowHistory(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Total Histórico */}
            <div className="bg-red-50 p-4 rounded-lg border border-red-200 mb-4">
              <p className="text-sm text-red-600">Total Gastos (Histórico)</p>
              <p className="text-2xl font-bold text-red-700">
                ${totalExpenses.toLocaleString('es-CL')}
              </p>
            </div>

            {/* Lista de Gastos Históricos */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
              <table className="w-full min-w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Categoría</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Monto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {expenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(expense => (
                    <tr key={expense.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                        {new Date(expense.date).toLocaleDateString('es-ES')}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-800">
                        {expense.description}
                        {expense.recurringRuleId && (
                            <Repeat className="w-3 h-3 inline-block ml-1 text-blue-500" title="Gasto recurrente" />
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {expense.category}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-red-600 whitespace-nowrap">
                        ${expense.amount.toLocaleString('es-CL')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {expenses.length === 0 && (
                <p className="text-center py-8 text-gray-500">
                  No hay gastos históricos registrados.
                </p>
              )}
            </div>

            {/* Botón de Cierre */}
            <div className="mt-6 pt-4 border-t">
              <button
                type="button"
                onClick={() => setShowHistory(false)}
                className="w-full bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
      {/* --- FIN MODAL DE HISTORIAL --- */}

    </div>
  );
}