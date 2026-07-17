import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser, createAuditEntry, hasRole } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const user = getAuthUser(request);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (!hasRole(user, ['super_admin', 'marketing_admin'])) {
      return NextResponse.json({ success: false, error: 'Insufficient permissions' }, { status: 403 });
    }

    const { phoneNumber, message } = await request.json();
    if (!phoneNumber || !message) {
      return NextResponse.json({ success: false, error: 'Phone number and message are required' }, { status: 400 });
    }

    const gateway = await db.smsGatewayConfig.findFirst({ where: { isActive: true } });
    const provider = gateway?.provider || 'arkesel';

    // Simulate SMS sending for demo purposes
    const log = await db.smsLog.create({
      data: {
        clientId: 'test', recipientName: 'Test Recipient', recipientPhone: phoneNumber,
        message, status: 'sent', provider,
        providerResponse: JSON.stringify({ simulated: true, gateway: provider }),
      },
    });

    await db.auditLog.create({ data: createAuditEntry(user.id, 'TEST_SMS', 'sms', `Sent test SMS to ${phoneNumber}`) });
    return NextResponse.json({ success: true, data: log, message: 'Test SMS sent successfully (simulated)' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}