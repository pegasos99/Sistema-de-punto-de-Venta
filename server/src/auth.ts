import type { FastifyRequest } from 'fastify';
import { pool, supabaseAuth } from './config.js';
import { ApiError, isUuid } from './domain.js';

export interface Principal {
  userId: string;
  businessId: string;
  role: 'admin' | 'vendedor';
}

export async function authenticate(request: FastifyRequest): Promise<Principal> {
  const bearer = request.headers.authorization;
  const businessId = request.headers['x-business-id'];
  if (!bearer?.startsWith('Bearer ') || !isUuid(businessId)) {
    throw new ApiError(401, 'UNAUTHORIZED', 'Se requiere sesión y negocio válido');
  }
  const token = bearer.slice(7).trim();
  if (!token) throw new ApiError(401, 'UNAUTHORIZED', 'Sesión no válida');
  const { data, error } = await supabaseAuth.auth.getUser(token);
  if (error || !data.user) throw new ApiError(401, 'UNAUTHORIZED', 'Sesión caducada o inválida');

  const result = await pool.query<{ role: Principal['role'] }>(
    `select role from public.business_memberships
     where business_id = $1 and user_id = $2 and is_active = true`,
    [businessId, data.user.id],
  );
  if (!result.rows[0]) throw new ApiError(403, 'FORBIDDEN', 'Sin acceso al negocio');
  return { userId: data.user.id, businessId, role: result.rows[0].role };
}

export function requireAdmin(principal: Principal): void {
  if (principal.role !== 'admin') throw new ApiError(403, 'FORBIDDEN', 'Requiere administrador');
}
