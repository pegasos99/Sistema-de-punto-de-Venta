import test from 'node:test';
import assert from 'node:assert/strict';
import { parseSale, parseStockChange, money } from '../src/domain.ts';

const productId = 'a1d0abf0-1111-4111-8111-a1d0abf01111';
const idempotencyKey = 'a1d0abf0-2222-4222-8222-a1d0abf02222';

test('una venta válida contiene líneas y clave idempotente', () => {
  const sale = parseSale({ idempotencyKey, items: [{ productId, quantity: 2, paymentMethod: 'tarjeta' }] });
  assert.equal(sale.items[0].quantity, 2);
});

test('rechaza totales enviados por navegador', () => {
  assert.throws(() => parseSale({ idempotencyKey, items: [{ productId, quantity: 1,
    paymentMethod: 'efectivo', totalPrice: 1 }] }), { code: 'UNSUPPORTED_SALE_FIELDS' });
});

test('rechaza venta por peso/variantes hasta tener implementación real', () => {
  assert.throws(() => parseSale({ idempotencyKey, items: [{ productId, quantity: 1,
    paymentMethod: 'efectivo', weight: 2.5 }] }), { code: 'UNSUPPORTED_SALE_FIELDS' });
});

test('rechaza cantidad negativa y sin idempotencia', () => {
  assert.throws(() => parseSale({ idempotencyKey, items: [{ productId, quantity: -1,
    paymentMethod: 'efectivo' }] }), { code: 'INVALID_ITEM' });
  assert.throws(() => parseSale({ items: [{ productId, quantity: 1, paymentMethod: 'efectivo' }] }),
    { code: 'INVALID_IDEMPOTENCY_KEY' });
});

test('acepta un precio decimal válido', () => {
  const sale = parseSale({ idempotencyKey, items: [{ productId, quantity: 1,
    paymentMethod: 'efectivo', customPrice: 0.29 }] });
  assert.equal(sale.items[0].customPrice, 0.29);
});

test('rechaza precio manual negativo', () => {
  assert.throws(() => parseSale({ idempotencyKey, items: [{ productId, quantity: 1,
    paymentMethod: 'efectivo', customPrice: -5 }] }), { code: 'INVALID_PRICE' });
});

test('rechaza ajustes que dejarían cantidades manipuladas en el cliente', () => {
  assert.throws(() => parseStockChange({ productId, quantity: 0, location: 'store',
    reason: 'adjustment' }), { code: 'INVALID_STOCK_CHANGE' });
});

test('admite un ingreso a bodega', () => {
  const stock = parseStockChange({ productId, quantity: 7, location: 'warehouse', reason: 'purchase' });
  assert.equal(stock.quantity, 7);
});

test('redondea valores monetarios', () => assert.equal(money(12.345), 12.35));
