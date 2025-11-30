import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { BarcodeScanner } from './BarcodeScanner';
import { WeightSaleModal } from './WeightSaleModal';
import { VariablePriceModal } from './VariablePriceModal';
import { 
  Keyboard, 
  ShoppingCart, 
  Search, 
  Plus, 
  Minus, 
  CreditCard, 
  DollarSign,
  LayoutGrid, // Icono para Categorías
  List, // Icono para Todos los productos
  ChevronLeft // Icono para "Volver"
} from 'lucide-react';

export function Sales() {
  const { products, addSale, updateStockStore } = useApp();
  const [showScanner, setShowScanner] = useState(false);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [showVariablePriceModal, setShowVariablePriceModal] = useState(false);
  const [selectedWeightProduct, setSelectedWeightProduct] = useState<any>(null);
  const [selectedVariablePriceProduct, setSelectedVariablePriceProduct] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<Array<{ 
    product: any; 
    quantity: number; 
    weight?: number; 
    customPrice?: number;
    paymentMethod: 'efectivo' | 'tarjeta';
    scannedBarcode?: string;
  }>>([]);

  type ViewMode = 'products' | 'categories';
  const [viewMode, setViewMode] = useState<ViewMode>('products');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean)));

  const filteredProducts = products.filter(product =>
    (
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.barcodes && product.barcodes.some(b => b.includes(searchTerm))) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase())
    ) && product.stockStore > 0
  );

  const productsToDisplay = viewMode === 'categories' && selectedCategory
    ? filteredProducts.filter(p => p.category === selectedCategory) 
    : filteredProducts; 

  
  // --- Función Modificada ---
  const handleBarcodeScan = (barcode: string) => {
    // Busca el producto por su código de barras
    const product = products.find(p => p.barcodes && p.barcodes.includes(barcode));
    
    if (product) {
      // Agrega el producto al carrito
      addToCart(product, barcode);
    } else {
      // Muestra alerta si no se encuentra
      alert('Producto no encontrado');
    }
    
    // --- LÍNEA ELIMINADA ---
    // setShowScanner(false); // Esta línea se eliminó para que el modal no se cierre.
    // --- FIN LÍNEA ELIMINADA ---
  };

  const addToCart = (product: any, scannedBarcode?: string) => {
    if (product.stockStore <= 0) {
      alert('Producto sin stock en tienda');
      return;
    }
    if (product.isPriceByWeight) {
      setSelectedWeightProduct(product);
      setShowWeightModal(true);
      return;
    }
    if (product.hasVariablePrice) {
      setSelectedVariablePriceProduct(product);
      setShowVariablePriceModal(true);
      return;
    }
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id && !item.weight);
      if (existing) {
        if (existing.quantity >= product.stockStore) {
          alert('No hay suficiente stock en tienda');
          return prev;
        }
        return prev.map(item =>
          item.product.id === product.id && !item.weight
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { 
        product, 
        quantity: 1, 
        paymentMethod: 'efectivo' as const,
        scannedBarcode
      }];
    });
  };

  const addWeightProductToCart = (product: any, weight: number, pricePerGram: number) => {
    const totalPrice = weight * pricePerGram;
    setCart(prev => [...prev, {
      product,
      quantity: 1,
      weight,
      customPrice: totalPrice,
      paymentMethod: 'efectivo' as const
    }]);
    setShowWeightModal(false);
    setSelectedWeightProduct(null);
  };

  const addVariablePriceProductToCart = (product: any, customPrice: number) => {
    setCart(prev => [...prev, {
      product,
      quantity: 1,
      customPrice,
      paymentMethod: 'efectivo' as const
    }]);
    setShowVariablePriceModal(false);
    setSelectedVariablePriceProduct(null);
  };

  const updateCartQuantity = (index: number, change: number) => {
    setCart(prev => prev.map((item, i) => {
      if (i === index) {
        const newQuantity = Math.max(0, item.quantity + change);
        if (newQuantity > item.product.stockStore && !item.weight) {
          alert('No hay suficiente stock en tienda');
          return item;
        }
        return { ...item, quantity: newQuantity };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const updatePaymentMethod = (index: number, method: 'efectivo' | 'tarjeta') => {
    setCart(prev => prev.map((item, i) => 
      i === index ? { ...item, paymentMethod: method } : item
    ));
  };

  const removeFromCart = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const calculateItemTotal = (item: any) => {
    if (item.weight && item.customPrice) {
      return item.customPrice;
    }
    if (item.customPrice) {
      return item.customPrice * item.quantity;
    }
    return item.product.price * item.quantity;
  };


  const processSale = () => {
    if (cart.length === 0) {
      return;
    }
    cart.forEach(item => {
      const totalStock = item.product.stockStore + item.product.stockWarehouse;
      const unitCost = totalStock > 0 ? item.product.costPrice / totalStock : 0;
      const salePrice = item.customPrice || item.product.price;
      const finalPrice = calculateItemTotal(item);
      
      addSale({
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        weight: item.weight,
        unitPrice: salePrice,
        costPrice: unitCost,
        totalPrice: finalPrice,
        paymentMethod: item.paymentMethod,
        barcode: item.scannedBarcode || (item.product.barcodes && item.product.barcodes.length > 0 ? item.product.barcodes[0] : '') || '',
      });
      
      if (!item.weight) {
        updateStockStore(item.product.id, item.quantity);
      }
    });
    setCart([]);
    alert('Venta procesada exitosamente');
  };
  
  const cartTotal = cart.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  
  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    setSelectedCategory(null); 
  };

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category);
  };
  
  const resetCategoryView = () => {
    setSelectedCategory(null);
  };


  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Punto de Venta</h1>
        <button
          onClick={() => setShowScanner(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Keyboard className="w-5 h-5" />
          <span>Ingresar Código</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna de Productos / Categorías */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar productos por nombre, código o categoría..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Selectores de Vista */}
          <div className="flex items-center space-x-2 p-1 bg-gray-200 rounded-lg">
            <button
              onClick={() => handleViewModeChange('products')}
              className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-all ${
                viewMode === 'products'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <List className="w-4 h-4 mr-2" />
              Mostrar Todos
            </button>
            <button
              onClick={() => handleViewModeChange('categories')}
              className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-all ${
                viewMode === 'categories'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <LayoutGrid className="w-4 h-4 mr-2" />
              Mostrar Categorías
            </button>
          </div>
          

          {/* Contenedor Principal (Categorías o Productos) */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 max-h-[70vh] overflow-y-auto">
            
            {/* VISTA 1: Mostrar Productos */}
            {(viewMode === 'products' || (viewMode === 'categories' && selectedCategory)) && (
              <>
                {/* Botón "Volver" si estamos viendo una categoría */}
                {viewMode === 'categories' && selectedCategory && (
                  <div className="p-4 border-b border-gray-200">
                    <button
                      onClick={resetCategoryView}
                      className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-800"
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Volver a Categorías
                    </button>
                    <h3 className="text-lg font-semibold text-gray-800 mt-2">
                      Categoría: {selectedCategory}
                    </h3>
                  </div>
                )}
                
                {/* Grid de Productos */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4">
                  {productsToDisplay.map(product => (
                    <div
                      key={product.id}
                      className={`p-4 border rounded-lg transition-all duration-200 cursor-pointer ${
                        product.stockStore > 0 
                          ? 'border-gray-200 hover:border-blue-300 hover:shadow-md' 
                          : 'border-red-200 bg-red-50 cursor-not-allowed'
                      }`}
                      onClick={() => product.stockStore > 0 && addToCart(product)}
                    >
                      <h3 className="font-semibold text-gray-900">{product.name}</h3>
                      <p className="text-sm text-gray-600">{product.category}</p>
                      {product.isPriceByWeight && (
                        <p className="text-xs text-yellow-600 font-medium">Por peso - ${product.pricePerGram?.toLocaleString('es-CL')}/g</p>
                      )}
                      {product.hasVariablePrice && (
                        <p className="text-xs text-blue-600 font-medium">Precio variable</p>
                      )}
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-lg font-bold text-green-600">
                          ${product.price.toLocaleString('es-CL')}
                        </span>
                        <span className={`text-sm ${
                          product.stockStore > product.minStock ? 'text-green-600' : 'text-red-600'
                        }`}>
                          Tienda: {product.stockStore}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                {productsToDisplay.length === 0 && (
                  <p className="text-center py-8 text-gray-500">
                    No se encontraron productos {selectedCategory ? `en "${selectedCategory}"` : 'con stock'}
                  </p>
                )}
              </>
            )}
            
            {/* VISTA 2: Mostrar Categorías */}
            {viewMode === 'categories' && !selectedCategory && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4">
                {categories.map(category => (
                  <div
                    key={category}
                    onClick={() => handleCategoryClick(category)}
                    className="p-6 border rounded-lg transition-all duration-200 cursor-pointer 
                               border-gray-200 hover:border-blue-400 hover:shadow-lg hover:bg-blue-50
                               flex flex-col items-center justify-center text-center aspect-square"
                  >
                    <LayoutGrid className="w-10 h-10 text-blue-500 mb-3" />
                    <h3 className="font-semibold text-gray-900">{category}</h3>
                  </div>
                ))}
                {categories.length === 0 && (
                  <p className="text-center py-8 text-gray-500 col-span-full">
                    No hay categorías definidas en el inventario.
                  </p>
                )}
              </div>
            )}
            
          </div>
        </div>

        {/* Columna de Carrito (Sin cambios) */}
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center space-x-2 mb-4">
              <ShoppingCart className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold">Carrito de Compras</h2>
            </div>

            <div className="space-y-3 max-h-64 overflow-y-auto">
              {cart.length > 0 ? (
                cart.map((item, index) => (
                  <div key={`${item.product.id}-${index}`} className="p-3 bg-gray-50 rounded-lg space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.product.name}</p>
                        <p className="text-xs text-gray-600">
                          ${(item.customPrice || item.product.price).toLocaleString('es-CL')} c/u
                        </p>
                        {item.weight && (
                          <p className="text-xs text-yellow-600">
                            Peso: {item.weight}g
                          </p>
                        )}
                        {item.product.hasVariablePrice && (
                          <p className="text-xs text-blue-600">
                            Precio personalizado
                          </p>
                        )}
                        {item.scannedBarcode && (
                          <p className="text-xs text-gray-500 font-mono">
                            Código: {item.scannedBarcode}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => removeFromCart(index)}
                        className="text-red-500 hover:text-red-700 text-xs"
                      >
                        ✕
                      </button>
                    </div>
                    
                    {!item.weight && (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateCartQuantity(index, -1)}
                          className="p-1 hover:bg-gray-200 rounded"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateCartQuantity(index, 1)}
                          className="p-1 hover:bg-gray-200 rounded"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updatePaymentMethod(index, 'efectivo')}
                        className={`flex items-center space-x-1 px-2 py-1 rounded text-xs ${
                          item.paymentMethod === 'efectivo' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        <DollarSign className="w-3 h-3" />
                        <span>Efectivo</span>
                      </button>
                      <button
                        onClick={() => updatePaymentMethod(index, 'tarjeta')}
                        className={`flex items-center space-x-1 px-2 py-1 rounded text-xs ${
                          item.paymentMethod === 'tarjeta' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        <CreditCard className="w-3 h-3" />
                        <span>Tarjeta</span>
                      </button>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-semibold text-green-600">
                        ${calculateItemTotal(item).toLocaleString('es-CL')}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-8">Carrito vacío</p>
              )}
            </div>

            {cart.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-semibold">Total:</span>
                  <span className="text-2xl font-bold text-green-600">${cartTotal.toLocaleString('es-CL')}</span>
                </div>
                <button
                  onClick={processSale}
                  className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold"
                >
                  Procesar Venta
                </button>
                <button
                  onClick={() => setCart([])}
                  className="w-full mt-2 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Limpiar Carrito
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modales (Sin cambios) */}
      {showScanner && (
        <BarcodeScanner
          onScan={handleBarcodeScan}
          onClose={() => setShowScanner(false)}
        />
      )}

      {showVariablePriceModal && selectedVariablePriceProduct && (
        <VariablePriceModal
          product={selectedVariablePriceProduct}
          onSave={addVariablePriceProductToCart}
          onClose={() => {
            setShowVariablePriceModal(false);
            setSelectedVariablePriceProduct(null);
          }}
        />
      )}
      {showWeightModal && selectedWeightProduct && (
        <WeightSaleModal
          product={selectedWeightProduct}
          onSave={addWeightProductToCart}
          onClose={() => {
            setShowWeightModal(false);
            setSelectedWeightProduct(null);
          }}
        />
      )}
    </div>
  );
}