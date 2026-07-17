import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser, createAuditEntry, hasRole } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = getAuthUser(request);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    const client = await db.client.findUnique({ where: { id } });
    if (!client) return NextResponse.json({ success: false, error: 'Client not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: client });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = getAuthUser(request);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (!hasRole(user, ['super_admin', 'marketing_admin', 'staff'])) {
      return NextResponse.json({ success: false, error: 'Insufficient permissions' }, { status: 403 });
    }
    const { id } = await params;
    const data = await request.json();
    const client = await db.client.update({ where: { id }, data });
    await db.auditLog.create({ data: createAuditEntry(user.id, 'UPDATE', 'clients', `Updated client ${client.clientId} - ${client.fullName}`) });
    return NextResponse.json({ success: true, data: client });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = getAuthUser(request);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (!hasRole(user, ['super_admin', 'marketing_admin'])) {
      return NextResponse.json({ success: false, error: 'Only admins can delete clients' }, { status: 403 });
    }
    const { id } = await params;
    const client = await db.client.update({ where: { id }, data: { status: 'inactive' } });
    await db.auditLog.create({ data: createAuditEntry(user.id, 'DELETE', 'clients', `Deactivated client ${client.clientId} - ${client.fullName}`) });
    return NextResponse.json({ success: true, message: 'Client deactivated successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}