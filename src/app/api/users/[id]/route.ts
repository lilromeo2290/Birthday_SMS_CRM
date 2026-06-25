import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser, createAuditEntry, hasRole } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = getAuthUser(request);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    const u = await db.user.findUnique({ where: { id }, select: { id: true, email: true, name: true, role: true, isActive: true, lastLogin: true, createdAt: true } });
    if (!u) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: u });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = getAuthUser(request);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    const data = await request.json();

    if (!hasRole(user, ['super_admin']) && user.id !== id) {
      return NextResponse.json({ success: false, error: 'Cannot edit other users' }, { status: 403 });
    }

    const updateData: any = {};
    if (data.name) updateData.name = data.name;
    if (data.role && hasRole(user, ['super_admin'])) updateData.role = data.role;
    if (data.isActive !== undefined && hasRole(user, ['super_admin'])) updateData.isActive = data.isActive;

    const updated = await db.user.update({ where: { id }, data: updateData });
    await db.auditLog.create({ data: createAuditEntry(user.id, 'UPDATE', 'users', `Updated user ${updated.email}`) });
    return NextResponse.json({ success: true, data: { id: updated.id, email: updated.email, name: updated.name, role: updated.role, isActive: updated.isActive } });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = getAuthUser(request);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (!hasRole(user, ['super_admin'])) {
      return NextResponse.json({ success: false, error: 'Super admin only' }, { status: 403 });
    }
    const { id } = await params;
    await db.user.update({ where: { id }, data: { isActive: false } });
    await db.auditLog.create({ data: createAuditEntry(user.id, 'DELETE', 'users', `Deactivated user ID: ${id}`) });
    return NextResponse.json({ success: true, message: 'User deactivated' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}