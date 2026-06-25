import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyPassword, generateToken, createAuditEntry } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return NextResponse.json({ success: false, error: 'Email and password are required' }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user || !user.isActive) {
      return NextResponse.json({ success: false, error: 'Invalid credentials or account deactivated' }, { status: 401 });
    }

    const valid = await verifyPassword(password, user.password);
    if (!valid) {
      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
    }

    const token = generateToken({ id: user.id, email: user.email, name: user.name, role: user.role });
    await db.user.update({ where: { id: user.id }, data: { lastLogin: new Date() } });
    await db.auditLog.create({ data: createAuditEntry(user.id, 'LOGIN', 'auth', `User ${user.email} logged in`, request.headers.get('x-forwarded-for') || undefined) });

    return NextResponse.json({
      success: true,
      data: { user: { id: user.id, email: user.email, name: user.name, role: user.role }, token },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Login failed' }, { status: 500 });
  }
}