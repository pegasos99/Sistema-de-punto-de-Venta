import { createHash } from 'node:crypto';
import type { Pool, PoolClient } from 'pg';
import { ApiError, isUuid, money, parseSale, parseStockChange, type SaleItemInput } from './domain.js';
import type { Principal } from './auth.js';

const transaction = async <T>(pool: Pool, work: (client: PoolClient) => Promise<T>): Promise<T> => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await work(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

async function recheckMember(client: PoolClient, principal: Principal) {
  const result = await client.query(
    `select role from public.business_memberships
     where business_id=$1 and user_id=$2 and is_active=true for share`,
    [principal.businessId, principal.userId],
  );
  if (!result.rows[0] || result.rows[0].role !== principal.role) {
    throw new ApiError(403, 'FORBIDDEN', 'La pertenencia al negocio cambió');
  }
}

export async function createSale(pool: Pool, principal: Principal, body: unknown) {
  const { idempotencyKey, items } = parseSale(body);
  const requestHash = createHash('sha256').update(JSON.stringify(items)).digest('hex');

  return transaction(pool, async (client) => {
    await recheckMember(client, principal);
    // Bloqueo único y determinista que protege la clave antes de comprobar su existencia.
    await client.query('select pg_advisory_xact_lock(hashtextextended($1, 0))',
      [principal.businessId + ':' + idempotencyKey]);

    const existing = await client.query(
      'select id, total_amount, request_hash from public.sales where business_id=$1 and idempotency_key=$2',
      [principal.businessId, idempotencyKey],
    );
    if (existing.rows[0]) {
      if (existing.rows[0].request_hash !== requestHash) {
        throw new ApiError(409, 'IDEMPOTENCY_CONFLICT', 'La clave ya se utilizó para otra venta');
      }
      return { saleId: existing.rows[0].id as string, total: Number(existing.rows[0].total_amount), replayed: true };
    }

    // Bloquear productos en orden estable para evitar interbloqueos entre cajas.
    const ids = [...new Set(items.map(item => item.productId))].sort();
    const products = new Map<string, {
      id: string; name: string; price_amount: string; cost_total_amount: string;
      has_variants: boolean; has_variable_price: boolean; is_weight_based: boolean;
      store_stock: string; total_stock: string;
    }>();
    for (const id of ids) {
      const r = await client.query(
        `select id, name, price_amount, cost_total_amount, has_variants,
                has_variable_price, is_weight_based from public.products
         where id=$1 and business_id=$2 and is_active=true for update`,
        [id, principal.businessId],
      );
      if (!r.rows[0]) throw new ApiError(404, 'PRODUCT_NOT_FOUND', 'Producto no disponible');
      if (r.rows[0].has_variants || r.rows[0].is_weight_based) {
        throw new ApiError(422, 'UNSUPPORTED_PRODUCT', 'Variantes y ventas por peso requieren integración específica');
      }
      const stock = await client.query(
        `select location, quantity from public.inventory_balances
         where business_id=$1 and product_id=$2 and variant_id is null
         order by location for update`,
        [principal.businessId, id],
      );
      const store = Number(stock.rows.find(x => x.location === 'store')?.quantity ?? 0);
      const total = stock.rows.reduce((sum, row) => sum + Number(row.quantity), 0);
      products.set(id, { ...r.rows[0], store_stock: String(store), total_stock: String(total) });
    }
    const requested = new Map<string, number>();
    for (const item of items) {
      requested.set(item.productId, (requested.get(item.productId) || 0) + item.quantity);
    }
    for (const [id, qty] of requested) {
      if (qty > Number(products.get(id)!.store_stock)) {
        throw new ApiError(409, 'INSUFFICIENT_STOCK', 'Stock insuficiente en tienda');
      }
    }
    let totalCents = 0;
    const saleRows: Array<{ item: SaleItemInput; name: string; unitPrice: number; unitCost: number; lineTotal: number }> = [];
    for (const item of items) {
      const product = products.get(item.productId)!;
      if (item.customPrice !== undefined &&
        (!product.has_variable_price || principal.role !== 'admin')) {
        throw new ApiError(403, 'MANUAL_PRICE_FORBIDDEN', 'Precio manual no permitido para este usuario o producto');
      }
      const unitPrice = item.customPrice ?? Number(product.price_amount);
      const unitCost = Number(product.total_stock) > 0
        ? money(Number(product.cost_total_amount) / Number(product.total_stock)) : 0;
      const lineTotal = money(unitPrice * item.quantity);
      totalCents += Math.round(lineTotal * 100);
      saleRows.push({ item, name: product.name, unitPrice, unitCost, lineTotal });
    }
    const total = totalCents / 100;
    const sale = await client.query<{ id: string }>(
      `insert into public.sales(business_id,sold_by,idempotency_key,request_hash,total_amount)
       values($1,$2,$3,$4,$5) returning id`,
      [principal.businessId, principal.userId, idempotencyKey, requestHash, total],
    );
    const saleId = sale.rows[0].id;
    const payments = new Map<string, number>();
    for (const line of saleRows) {
      const item = line.item;
      await client.query(
        `insert into public.sale_items
          (business_id,sale_id,product_id,product_name,quantity,unit_price,unit_cost,total_price,payment_method)
         values($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [principal.businessId, saleId, item.productId, line.name, item.quantity,
          line.unitPrice, line.unitCost, line.lineTotal, item.paymentMethod],
      );
      payments.set(item.paymentMethod,
        money((payments.get(item.paymentMethod) || 0) + line.lineTotal));
    }
    for (const id of ids) {
      const quantity = requested.get(id)!;
      const updated = await client.query(
        `update public.inventory_balances set quantity=quantity-$1, updated_at=now()
         where business_id=$2 and product_id=$3 and variant_id is null
           and location='store' and quantity >= $1 returning quantity`,
        [quantity, principal.businessId, id],
      );
      if (updated.rowCount !== 1) throw new ApiError(409, 'INSUFFICIENT_STOCK', 'Stock modificado por otra caja');
      await client.query(
        `insert into public.stock_movements
           (business_id,product_id,location,quantity_delta,reason,reference_id,performed_by)
         values($1,$2,'store',$3,'sale',$4,$5)`,
        [principal.businessId, id, -quantity, saleId, principal.userId],
      );
      const product = products.get(id)!;
      const costReduction = money(
        Number(product.total_stock) > 0
          ? Number(product.cost_total_amount) * quantity / Number(product.total_stock) : 0);
      await client.query(
        `update public.products
           set cost_total_amount=greatest(0,cost_total_amount-$1), updated_at=now()
         where id=$2 and business_id=$3`,
        [costReduction, id, principal.businessId],
      );
    }
    for (const [method, amount] of payments) {
      await client.query(
        `insert into public.sale_payments(business_id,sale_id,method,amount)
         values($1,$2,$3,$4)`,
        [principal.businessId, saleId, method, amount],
      );
    }
    return { saleId, total, replayed: false };
  });
}

export async function changeStock(pool: Pool, principal: Principal, body: unknown) {
  const input = parseStockChange(body);
  return transaction(pool, async client => {
    await recheckMember(client, principal);
    const p = await client.query(
      `select id, has_variants from public.products
       where id=$1 and business_id=$2 and is_active=true for update`,
      [input.productId, principal.businessId],
    );
    if (!p.rows[0]) throw new ApiError(404, 'PRODUCT_NOT_FOUND', 'Producto no disponible');
    if (p.rows[0].has_variants) throw new ApiError(422, 'UNSUPPORTED_PRODUCT', 'Variantes pendientes de implementación');
    // Crear balance si no existía, garantizando una única fila por tienda/bodega.
    await client.query(
      `insert into public.inventory_balances(business_id,product_id,location,quantity)
       values($1,$2,$3,0) on conflict do nothing`,
      [principal.businessId, input.productId, input.location],
    );
    const changed = await client.query(
      `update public.inventory_balances
       set quantity=quantity+$1, updated_at=now()
       where business_id=$2 and product_id=$3 and variant_id is null
         and location=$4 and quantity+$1>=0 returning quantity`,
      [input.quantity, principal.businessId, input.productId, input.location],
    );
    if (!changed.rows[0]) throw new ApiError(409, 'INSUFFICIENT_STOCK', 'El ajuste dejaría stock negativo');
    await client.query(
      `insert into public.stock_movements
        (business_id,product_id,location,quantity_delta,reason,performed_by)
       values($1,$2,$3,$4,$5,$6)`,
      [principal.businessId, input.productId, input.location, input.quantity, input.reason, principal.userId],
    );
    return { productId: input.productId, location: input.location, quantity: Number(changed.rows[0].quantity) };
  });
}

export async function transferStock(pool: Pool, principal: Principal, body: unknown) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new ApiError(400, 'INVALID_BODY', 'Se espera un objeto JSON');
  }
  const input = body as Record<string, unknown>;
  if (Object.keys(input).some(k => !['productId', 'quantity'].includes(k)) ||
    !isUuid(input.productId) ||
    !Number.isInteger(input.quantity) || Number(input.quantity) <= 0 || Number(input.quantity) > 100000) {
    throw new ApiError(400, 'INVALID_TRANSFER', 'Transferencia inválida');
  }
  return transaction(pool, async client => {
    await recheckMember(client, principal);
    const product = await client.query(
      'select has_variants from public.products where id=$1 and business_id=$2 and is_active=true for update',
      [input.productId, principal.businessId]);
    if (!product.rows[0]) throw new ApiError(404, 'PRODUCT_NOT_FOUND', 'Producto no disponible');
    if (product.rows[0].has_variants) throw new ApiError(422, 'UNSUPPORTED_PRODUCT', 'Variantes pendientes de implementación');
    // Crear filas antes de bloquearlas en el mismo orden.
    for (const location of ['store', 'warehouse']) {
      await client.query(
        `insert into public.inventory_balances(business_id,product_id,location,quantity)
         values($1,$2,$3,0) on conflict do nothing`,
        [principal.businessId, input.productId, location]);
    }
    const balances = await client.query(
      `select location, quantity from public.inventory_balances
       where business_id=$1 and product_id=$2 and variant_id is null
       order by location for update`,
      [principal.businessId, input.productId]);
    const from = Number(balances.rows.find(r=>r.location === 'warehouse')?.quantity ?? 0);
    if (from < Number(input.quantity)) throw new ApiError(409, 'INSUFFICIENT_STOCK', 'Sin stock suficiente en bodega');
    for (const [location, delta] of [['warehouse', -Number(input.quantity)], ['store', Number(input.quantity)]] as const) {
      await client.query(
        `update public.inventory_balances set quantity=quantity+$1,updated_at=now()
         where business_id=$2 and product_id=$3 and variant_id is null and location=$4`,
        [delta, principal.businessId, input.productId, location]);
      await client.query(
        `insert into public.stock_movements
         (business_id,product_id,location,quantity_delta,reason,performed_by)
         values($1,$2,$3,$4,'transfer',$5)`,
        [principal.businessId, input.productId, location, delta, principal.userId]);
    }
    return { productId: input.productId, transferred: input.quantity, from: 'warehouse', to: 'store' };
  });
}
