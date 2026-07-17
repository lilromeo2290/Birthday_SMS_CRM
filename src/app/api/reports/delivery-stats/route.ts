import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = getAuthUser(request);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const total = await db.smsLog.count();
    const sent = await db.smsLog.count({ where: { status: 'sent' } });
    const delivered = await db.smsLog.count({ where: { status: 'delivered' } });
    const failed = await db.smsLog.count({ where: { status: 'failed' } });
    const pending = await db.smsLog.count({ where: { status: 'pending' } });

    return NextResponse.json({
      success: true,
      data: { total, sent, delivered, failed, pending, successRate: total > 0 ? Math.round(((sent + delivered) / total) * 100) : 0 },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}