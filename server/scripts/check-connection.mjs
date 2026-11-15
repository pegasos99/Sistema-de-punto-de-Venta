/**
 * Comprobación local, sin operaciones de escritura ni impresión de secretos.
 * Ejecutar desde server/: npm run check:connection
 */
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import pg from 'pg';

const envPath = fileURLToPath(new URL('../.env', import.meta.url));

function fail(message) {
  console.error('[ERROR] ' + message);
  process.exitCode = 1;
}

if (!existsSync(envPath)) {
  fail('Falta server/.env. Copia server/.env.example y rellena los tres datos de Supabase.');
} else {
  dotenv.config({ path: envPath, quiet: true });
  const apiUrl = process.env.SUPABASE_URL?.trim();
  const publishable = process.env.SUPABASE_PUBLISHABLE_KEY?.trim();
  const databaseUrl = process.env.DATABASE_URL?.trim();

  let dbUri;
  try {
    dbUri = new URL(databaseUrl ?? '');
  } catch {
    // No mostrar el valor original; podría contener credenciales.
  }

  if (!apiUrl?.startsWith('https://') || apiUrl.includes('your-project')) {
    fail('SUPABASE_URL debe ser la URL HTTPS real del proyecto.');
  } else if (!publishable?.startsWith('sb_publishable_') || publishable.includes('REEMPLAZAR') || publishable.includes('REPLACE_ME')) {
    fail('SUPABASE_PUBLISHABLE_KEY debe ser una clave publicable activa.');
  } else if (!dbUri || !['postgres:', 'postgresql:'].includes(dbUri.protocol)
      || !dbUri.hostname || !dbUri.username || !dbUri.password
      || ['HOST', 'USER', 'USUARIO'].includes(decodeURIComponent(dbUri.hostname).toUpperCase())
      || ['PASSWORD', 'CONTRASENA', 'CONTRASEÑA'].includes(decodeURIComponent(dbUri.password).toUpperCase())) {
    fail('DATABASE_URL debe ser una URI PostgreSQL completa del botón Connect de Supabase.');
  } else {
    const pool = new pg.Pool({
      connectionString: databaseUrl,
      max: 1,
      connectionTimeoutMillis: 8000,
    });
    try {
      const result = await pool.query(`
        select current_database() as database_name,
               to_regclass('public.products') is not null as has_products,
               to_regclass('public.business_memberships') is not null as has_memberships
      `);
      const ok = result.rows[0];
      if (!ok.has_products || !ok.has_memberships) {
        fail('PostgreSQL conecta, pero faltan tablas del POS. Revisa que DATABASE_URL corresponda al proyecto correcto.');
      } else {
        console.log('[OK] Conexión PostgreSQL establecida con Supabase.');
        console.log('[OK] Tablas principales del POS encontradas.');
        console.log('[OK] Credenciales cargadas desde server/.env sin mostrarlas.');
      }
    } catch (error) {
      switch (error?.code) {
        case '28P01':
          fail('PostgreSQL rechazó la contraseña. Revisa la contraseña de la BASE DE DATOS en Supabase Connect.');
          break;
        case 'ENOTFOUND':
        case 'EAI_AGAIN':
          fail('No se pudo resolver el servidor PostgreSQL. Revisa el host del panel Connect.');
          break;
        case 'ETIMEDOUT':
        case 'ECONNREFUSED':
          fail('No se pudo alcanzar PostgreSQL. Revisa red, puerto y modo Session pooler.');
          break;
        default:
          fail('No se pudo validar la conexión. Comprueba los valores de server/.env y el método de conexión.');
      }
    } finally {
      await pool.end();
    }
  }
}
