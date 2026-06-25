import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser, createAuditEntry, hasRole } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = getAuthUser(request);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const configs = await db.smsGatewayConfig.findMany();
    // Mask API keys
    const masked = configs.map(c => {
      const out: any = { ...c };
      if (c.apiKey) out.apiKey = c.apiKey.slice(0, 4) + '****' + c.apiKey.slice(-4);
      if (c.apiSecret) out.apiSecret = c.apiSecret.slice(0, 4) + '****' + c.apiSecret.slice(-4);
      return out;
    });
    return NextResponse.json({ success: true, data: masked });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = getAuthUser(request);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (!hasRole(user, ['super_admin'])) {
      return NextResponse.json({ success: false, error: 'Only super admin can manage gateways' }, { status: 403 });
    }

    const { provider, apiKey, apiSecret, senderId, apiUrl, additionalConfig } = await request.json();
    const config = await db.smsGatewayConfig.upsert({
      where: { provider },
      update: { apiKey: apiKey || undefined, apiSecret: apiSecret || undefined, senderId: senderId || undefined, apiUrl: apiUrl || undefined, additionalConfig: additionalConfig || undefined },
      create: { provider, apiKey: apiKey || null, apiSecret: apiSecret || null, senderId: senderId || null, apiUrl: apiUrl || null, additionalConfig: additionalConfig || null },
    });

    await db.auditLog.create({ data: createAuditEntry(user.id, 'UPDATE', 'settings', `Updated gateway config for ${provider}`) });
    return NextResponse.json({ success: true, data: config });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = getAuthUser(request);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (!hasRole(user, ['super_admin'])) {
      return NextResponse.json({ success: false, error: 'Only super admin can manage gateways' }, { status: 403 });
    }

    const { provider } = await request.json();
    // Deactivate all, activate selected
    await db.smsGatewayConfig.updateMany({ data: { isActive: false } });
    await db.smsGatewayConfig.upsert({
      where: { provider },
      update: { isActive: true },
      create: { provider, isActive: true },
    });

    await db.auditLog.create({ data: createAuditEntry(user.id, 'ACTIVATE_GATEWAY', 'settings', `Activated ${provider} as SMS gateway`) });
    return NextResponse.json({ success: true, message: `${provider} activated as primary gateway` });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}