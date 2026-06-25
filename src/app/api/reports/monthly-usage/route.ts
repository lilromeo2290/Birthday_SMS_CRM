import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = getAuthUser(request);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const now = new Date();
    const data = [];

    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
      const monthName = monthStart.toLocaleString('default', { month: 'short', year: '2-digit' });

      const [sent, delivered, failed] = await Promise.all([
        db.smsLog.count({ where: { sentAt: { gte: monthStart, lte: monthEnd } } }),
        db.smsLog.count({ where: { sentAt: { gte: monthStart, lte: monthEnd }, status: 'delivered' } }),
        db.smsLog.count({ where: { sentAt: { gte: monthStart, lte: monthEnd }, status: 'failed' } }),
      ]);

      data.push({ month: monthName, sent, delivered, failed });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}