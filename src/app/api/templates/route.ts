import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser, createAuditEntry, hasRole } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = getAuthUser(request);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    const templates = await db.smsTemplate.findMany({ orderBy: { createdAt: 'desc' } });
    return NextResponse.json({ success: true, data: templates });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = getAuthUser(request);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (!hasRole(user, ['super_admin', 'marketing_admin'])) {
      return NextResponse.json({ success: false, error: 'Insufficient permissions' }, { status: 403 });
    }
    const { name, content, campaign } = await request.json();
    if (!name || !content) {
      return NextResponse.json({ success: false, error: 'Name and content are required' }, { status: 400 });
    }
    const template = await db.smsTemplate.create({ data: { name, content, campaign: campaign || null } });
    await db.auditLog.create({ data: createAuditEntry(user.id, 'CREATE', 'templates', `Created template "${name}"`) });
    return NextResponse.json({ success: true, data: template }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}