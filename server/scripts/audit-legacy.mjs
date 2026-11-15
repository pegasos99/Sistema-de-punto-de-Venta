/**
 * Auditoría sin escritura en DB para db.json legado.
 * Copia primero el JSON original a una carpeta ignorada por Git.
 * No imprime contenido comercial ni contraseñas en stdout.
 * Uso (desde server/): npm run audit:legacy -- ../db.json
 */
import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const input = resolve(process.argv[2] ?? '../db.json');
const backups = fileURLToPath(new URL('../local-backups/', import.meta.url));

try {
  const raw = await readFile(input);
  const digest = createHash('sha256').update(raw).digest('hex');
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  await mkdir(backups, { recursive: true, mode: 0o700 });
  const backup = join(backups, 'legacy-' + stamp + '-' + randomUUID() + '.json');
  await writeFile(backup, raw, { flag: 'wx', mode: 0o600 });

  // Respaldar ANTES de validar. Los datos originales no se modifican.
  const data = JSON.parse(raw.toString('utf8'));
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('El JSON debe contener un objeto raíz con las colecciones del POS.');
  }
  const collections = ['products','sales','expenses','recurringExpenses','categories','users'];
  const counts = {};
  const findings = {};
  function warn(code, n = 1) { findings[code] = (findings[code] || 0) + n; }

  for (const section of collections) {
    if (!Array.isArray(data[section])) {
      warn('missing_or_invalid_' + section);
      counts[section] = 0;
    } else {
      counts[section] = data[section].length;
    }
  }
  const rows = section => Array.isArray(data[section]) ? data[section] : [];
  function duplicateIds(section) {
    const seen = new Set();
    for (const row of rows(section)) {
      if (!row || typeof row !== 'object' || typeof row.id !== 'string' && typeof row.id !== 'number') {
        warn(section + '_invalid_id');
        continue;
      }
      const id = String(row.id);
      if (seen.has(id)) warn(section + '_duplicate_id');
      seen.add(id);
    }
  }
  for (const section of collections) duplicateIds(section);
  const productIds = new Set(rows('products').map(row => String(row?.id)));
  const barcodes = new Map();
  for (const product of rows('products')) {
    if (!product || typeof product !== 'object' || !String(product.name || '').trim()) {
      warn('product_invalid_name');
      continue;
    }
    for (const field of ['price','costPrice','stockStore','stockWarehouse']) {
      if (typeof product[field] !== 'number' || !Number.isFinite(product[field]) || product[field] < 0) {
        warn('product_invalid_' + field);
      }
    }
    if (product.hasVariants && !Array.isArray(product.variants)) warn('product_invalid_variants');
    for (const variant of (Array.isArray(product.variants) ? product.variants : [])) {
      for (const f of ['stockStore','stockWarehouse']) {
        if (typeof variant[f] !== 'number' || !Number.isFinite(variant[f]) || variant[f] < 0) {
          warn('variant_invalid_' + f);
        }
      }
    }
    if (!Array.isArray(product.barcodes)) {
      warn('product_invalid_barcodes');
    } else {
      for (const code of product.barcodes) {
        const barcode = String(code || '').trim();
        if (!barcode) { warn('product_empty_barcode'); continue; }
        if (barcodes.has(barcode) && barcodes.get(barcode) !== String(product.id)) {
          warn('barcode_shared_by_multiple_products');
        }
        barcodes.set(barcode, String(product.id));
      }
    }
  }
  for (const sale of rows('sales')) {
    if (!sale || typeof sale !== 'object') { warn('sale_invalid_record'); continue; }
    if (typeof sale.quantity !== 'number' || !Number.isFinite(sale.quantity) || sale.quantity <= 0) {
      warn('sale_invalid_quantity');
    }
    if (typeof sale.totalPrice !== 'number' || !Number.isFinite(sale.totalPrice) || sale.totalPrice < 0) {
      warn('sale_invalid_total');
    }
    if (!productIds.has(String(sale.productId))) warn('sale_unknown_product_maybe_deleted');
    if (!sale.timestamp || !Number.isFinite(new Date(sale.timestamp).getTime())) warn('sale_invalid_date');
  }
  let usersWithPlaintextPasswords = 0;
  for (const user of rows('users')) {
    if (typeof user?.password === 'string' && user.password.length) usersWithPlaintextPasswords++;
  }
  if (usersWithPlaintextPasswords) warn('users_with_legacy_plaintext_passwords', usersWithPlaintextPasswords);

  const report = {
    status: Object.keys(findings).length ? 'review_required' : 'initial_checks_passed',
    sha256: digest, bytes: raw.length, counts, findings,
    note: 'Auditoría estructural, no constituye migración. Revisar costos, variantes y fechas antes de importar. Nunca migrar contraseñas en texto plano.'
  };
  const reportPath = join(backups, 'audit-' + stamp + '-' + randomUUID() + '.json');
  await writeFile(reportPath, JSON.stringify(report, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
  console.log('Respaldo local creado en server/local-backups (NO compartir ni versionar).');
  console.log('Huella SHA-256: ' + digest);
  console.log('Resultado: ' + report.status);
  console.log('Colecciones: ' + JSON.stringify(counts));
  console.log('Observaciones (solo conteos): ' + JSON.stringify(findings));
  console.log('Informe local guardado en server/local-backups.');
} catch (error) {
  // Evitar errores de fs que puedan imprimir paths internos inesperados.
  console.error('Auditoría no completada: comprueba la ruta y que el archivo sea JSON válido.');
  process.exitCode = 1;
}
