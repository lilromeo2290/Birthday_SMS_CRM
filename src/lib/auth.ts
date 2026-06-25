import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'crm-birthday-sms-secret-key-2024';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(payload: object): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
}

export function verifyToken(token: string): object | null {
  try {
    return jwt.verify(token, JWT_SECRET) as object;
  } catch {
    return null;
  }
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export function getAuthUser(request: Request): AuthUser | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  const decoded = verifyToken(token);
  if (!decoded) return null;
  return decoded as AuthUser;
}

export function hasRole(user: AuthUser | null, roles: string[]): boolean {
  if (!user) return false;
  return roles.includes(user.role);
}

export function createAuditEntry(userId: string, action: string, module: string, details?: string, ipAddress?: string) {
  return {
    userId,
    action,
    module,
    details: details || null,
    ipAddress: ipAddress || null,
  };
}