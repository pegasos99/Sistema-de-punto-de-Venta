// Validaciones puras para impedir operaciones peligrosas antes de consultar PostgreSQL.
export type PaymentMethod = 'efectivo' | 'tarjeta';
export type SaleItemInput = {
  productId: string;
  quantity: number;
  paymentMethod: PaymentMethod;
  customPrice?: number;
  // Las variantes y las ventas por peso se habilitarán solo al implementar el modelo.
};

export class ApiError extends Error {
  constructor(public readonly statusCode: number, public readonly code: string, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export const isUuid = (v: unknown): v is string =>
  typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);

export const isCurrency = (v: unknown): v is number =>
  typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 1_000_000_000
    && Math.round(v * 100) === v * 100;

export const money = (n: number): number => Math.round((n + Number.EPSILON) * 100) / 100;

export function parseSale(input: unknown): { idempotencyKey: string; items: SaleItemInput[] } {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new ApiError(400, 'INVALID_BODY', 'Se espera un objeto JSON');
  }
  const data = input as Record<string, unknown>;
  if (!isUuid(data.idempotencyKey)) {
    throw new ApiError(400, 'INVALID_IDEMPOTENCY_KEY', 'La venta requiere idempotencyKey UUID');
  }
  if (!Array.isArray(data.items) || data.items.length < 1 || data.items.length > 100) {
    throw new ApiError(400, 'INVALID_ITEMS', 'Se requieren entre 1 y 100 productos');
  }
  const items: SaleItemInput[] = data.items.map((item) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      throw new ApiError(400, 'INVALID_ITEM', 'Producto inválido');
    }
    const row = item as Record<string, unknown>;
    const keys = Object.keys(row);
    if (keys.some((key) => !['productId', 'quantity', 'paymentMethod', 'customPrice'].includes(key))) {
      throw new ApiError(400, 'UNSUPPORTED_SALE_FIELDS', 'No se admiten variantes, peso ni totales indicados por el cliente');
    }
    if (!isUuid(row.productId) || !Number.isInteger(row.quantity) || !(Number(row.quantity) > 0)
      || Number(row.quantity) > 100000) {
      throw new ApiError(400, 'INVALID_ITEM', 'Producto o cantidad inválidos');
    }
    if (row.paymentMethod !== 'efectivo' && row.paymentMethod !== 'tarjeta') {
      throw new ApiError(400, 'INVALID_PAYMENT', 'Método de pago no permitido');
    }
    if (row.customPrice !== undefined && (!isCurrency(row.customPrice) || row.customPrice <= 0)) {
      throw new ApiError(400, 'INVALID_PRICE', 'Precio manual inválido');
    }
    return {
      productId: row.productId,
      quantity: row.quantity as number,
      paymentMethod: row.paymentMethod,
      ...(row.customPrice === undefined ? {} : { customPrice: row.customPrice as number }),
    };
  });
  return { idempotencyKey: data.idempotencyKey, items };
}

export function parseStockChange(input: unknown) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new ApiError(400, 'INVALID_BODY', 'Se espera un objeto JSON');
  }
  const data = input as Record<string, unknown>;
  if (Object.keys(data).some(k => !['productId', 'quantity', 'location', 'reason'].includes(k))
    || !isUuid(data.productId) || !Number.isInteger(data.quantity)
    || Math.abs(Number(data.quantity)) > 100000 || Number(data.quantity) === 0
    || !['store', 'warehouse'].includes(String(data.location))
    || !['purchase', 'adjustment'].includes(String(data.reason))) {
    throw new ApiError(400, 'INVALID_STOCK_CHANGE', 'Movimiento de inventario inválido');
  }
  if (data.reason === 'purchase' && Number(data.quantity) < 0) {
    throw new ApiError(400, 'INVALID_STOCK_CHANGE', 'Una entrada no puede tener cantidad negativa');
  }
  return {
    productId: data.productId as string,
    quantity: data.quantity as number,
    location: data.location as 'store' | 'warehouse',
    reason: data.reason as 'purchase' | 'adjustment',
  };
}
