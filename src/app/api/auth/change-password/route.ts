import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser, verifyPassword, hashPassword, createAuditEntry } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { oldPassword, newPassword } = await request.json();
    if (!oldPassword || !newPassword) {
      return NextResponse.json({ success: false, error: 'Both old and new passwords are required' }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { id: authUser.id } });
    if (!user) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });

    const valid = await verifyPassword(oldPassword, user.password);
    if (!valid) return NextResponse.json({ success: false, error: 'Current password is incorrect' }, { status: 400 });

    const hashed = await hashPassword(newPassword);
    await db.user.update({ where: { id: authUser.id }, data: { password: hashed } });
    await db.auditLog.create({ data: createAuditEntry(authUser.id, 'CHANGE_PASSWORD', 'auth', 'Password changed') });

    return NextResponse.json({ success: true, message: 'Password changed successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}