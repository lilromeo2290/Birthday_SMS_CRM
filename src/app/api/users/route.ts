import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser, createAuditEntry, hasRole } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = getAuthUser(request);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (!hasRole(user, ['super_admin'])) {
      return NextResponse.json({ success: false, error: 'Super admin only' }, { status: 403 });
    }
    const users = await db.user.findMany({ select: { id: true, email: true, name: true, role: true, isActive: true, lastLogin: true, createdAt: true }, orderBy: { createdAt: 'desc' } });
    return NextResponse.json({ success: true, data: users });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = getAuthUser(request);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (!hasRole(user, ['super_admin'])) {
      return NextResponse.json({ success: false, error: 'Super admin only' }, { status: 403 });
    }

    const { email, name, password, role } = await request.json();
    if (!email || !name || !password || !role) {
      return NextResponse.json({ success: false, error: 'All fields required' }, { status: 400 });
    }

    const existing = await db.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) return NextResponse.json({ success: false, error: 'Email already exists' }, { status: 400 });

    const bcrypt = await import('bcryptjs');
    const hashed = await bcrypt.hash(password, 12);
    const newUser = await db.user.create({ data: { email: email.toLowerCase(), name, password: hashed, role } });

    await db.auditLog.create({ data: createAuditEntry(user.id, 'CREATE', 'users', `Created user ${email}`) });
    return NextResponse.json({ success: true, data: { id: newUser.id, email: newUser.email, name: newUser.name, role: newUser.role } }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}