import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser, createAuditEntry, hasRole } from '@/lib/auth';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = getAuthUser(request);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (!hasRole(user, ['super_admin', 'marketing_admin'])) {
      return NextResponse.json({ success: false, error: 'Insufficient permissions' }, { status: 403 });
    }
    const { id } = await params;
    const body = await request.json();
    const template = await db.smsTemplate.findUnique({ where: { id } });
    if (!template) return NextResponse.json({ success: false, error: 'Template not found' }, { status: 404 });

    if (body.isDefault) {
      await db.smsTemplate.updateMany({ where: { isDefault: true }, data: { isDefault: false } });
      await db.smsTemplate.update({ where: { id }, data: { isActive: true, isDefault: true } });
    } else {
      await db.smsTemplate.update({ where: { id }, data: { isActive: !template.isActive } });
    }

    const updated = await db.smsTemplate.findUnique({ where: { id } });
    await db.auditLog.create({ data: createAuditEntry(user.id, 'TOGGLE', 'templates', `Toggled template "${template?.name}" active=${updated?.isActive}`) });
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}