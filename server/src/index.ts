import Fastify from 'fastify';
import { config, pool } from './config.js';
import { authenticate, requireAdmin } from './auth.js';
import { ApiError, isCurrency, isUuid } from './domain.js';
import { createSale, changeStock, transferStock } from './operations.js';

const app = Fastify({ logger: true, bodyLimit: 1024 * 1024 });

// Solo un origen explícito; jamás usar '*', especialmente en una API comercial.
app.addHook('onRequest', async (req, reply) => {
  const origin = req.headers.origin;
  if (origin && origin !== config.frontendOrigin) {
    throw new ApiError(403, 'ORIGIN_FORBIDDEN', 'Origen no autorizado');
  }
  if (origin === config.frontendOrigin) {
    reply.header('Access-Control-Allow-Origin', config.frontendOrigin);
    reply.header('Vary', 'Origin');
    reply.header('Access-Control-Allow-Headers', 'Authorization, Content-Type, X-Business-Id');
    reply.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  }
  if (req.method === 'OPTIONS') return reply.code(204).send();
});

app.setErrorHandler((error, _request, reply) => {
  if (error instanceof ApiError) {
    return reply.code(error.statusCode).send({ error: { code: error.code, message: error.message } });
  }
  const pgCode = (error as { code?: string }).code;
  if (pgCode === '23505') return reply.code(409).send({ error: { code: 'CONFLICT', message: 'Registro duplicado' } });
  if (['23503', '23514', '22P02'].includes(pgCode || '')) {
    return reply.code(400).send({ error: { code: 'INVALID_DATA', message: 'Datos inválidos' } });
  }
  app.log.error(error);
  return reply.code(500).send({ error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor' } });
});

app.get('/health', async () => ({ status: 'ok' }));

app.get('/api/products', async (req) => {
  const user = await authenticate(req);
  const rows = await pool.query(
    `select p.id, p.name, p.description, p.price_amount, p.cost_total_amount,
      p.min_stock, p.has_variants, p.has_variable_price, p.is_weight_based,
      p.category_id, p.created_at, p.updated_at,
      coalesce((select sum(quantity) from public.inventory_balances b
        where b.business_id=p.business_id and b.product_id=p.id and b.location='store'),0) as stock_store,
      coalesce((select sum(quantity) from public.inventory_balances b
        where b.business_id=p.business_id and b.product_id=p.id and b.location='warehouse'),0) as stock_warehouse
     from public.products p where p.business_id=$1 and p.is_active=true order by p.name`,
    [user.businessId],
  );
  return { data: rows.rows };
});

app.post('/api/products', async (req, reply) => {
  const user = await authenticate(req);
  requireAdmin(user);
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    throw new ApiError(400, 'INVALID_BODY', 'Se espera un producto');
  }
  const p = req.body as Record<string, unknown>;
  if (Object.keys(p).some(k => !['name','description','price','minStock','categoryId'].includes(k)) ||
    typeof p.name !== 'string' || !p.name.trim() || p.name.length > 200 ||
    !isCurrency(p.price) || typeof p.minStock !== 'number' ||
    !Number.isInteger(p.minStock) || p.minStock < 0 ||
    (p.categoryId !== undefined && !isUuid(p.categoryId)) ||
    (p.description !== undefined && (typeof p.description !== 'string' || p.description.length > 5000))) {
    throw new ApiError(400, 'INVALID_PRODUCT', 'Datos de producto inválidos');
  }
  const r = await pool.query(
    `insert into public.products (business_id,name,description,price_amount,min_stock,category_id)
     values ($1,$2,$3,$4,$5,$6) returning id,name,price_amount`,
    [user.businessId, p.name.trim(), p.description || '', p.price, p.minStock, p.categoryId || null],
  );
  return reply.code(201).send({ data: r.rows[0] });
});

app.post('/api/sales', async (req, reply) => {
  const user = await authenticate(req);
  const result = await createSale(pool, user, req.body);
  return reply.code(result.replayed ? 200 : 201).send({ data: result });
});

app.get('/api/sales', async req => {
  const user = await authenticate(req);
  const r = await pool.query(
    `select s.id,s.total_amount,s.created_at,s.sold_by,
      coalesce(json_agg(json_build_object('productId',i.product_id,'productName',i.product_name,
      'quantity',i.quantity,'unitPrice',i.unit_price,'unitCost',i.unit_cost,
      'totalPrice',i.total_price,'paymentMethod',i.payment_method)
      order by i.id) filter (where i.id is not null),'[]'::json) as items
     from public.sales s left join public.sale_items i
       on i.sale_id=s.id and i.business_id=s.business_id
     where s.business_id=$1 group by s.id order by s.created_at desc limit 100`,
    [user.businessId]);
  return { data: r.rows };
});

app.post('/api/inventory/adjustments', async req => {
  const user = await authenticate(req);
  requireAdmin(user);
  return { data: await changeStock(pool, user, req.body) };
});
app.post('/api/inventory/transfers', async req => {
  const user = await authenticate(req);
  requireAdmin(user);
  return { data: await transferStock(pool, user, req.body) };
});

app.addHook('onClose', async () => { await pool.end(); });
app.listen({ host: config.host, port: config.port }).catch(error => {
  app.log.error(error);
  process.exitCode = 1;
});
