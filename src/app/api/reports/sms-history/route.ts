import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = getAuthUser(request);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const logs = await db.smsLog.findMany({
      where: { sentAt: { gte: thirtyDaysAgo } },
      select: { sentAt: true, status: true },
      orderBy: { sentAt: 'asc' },
    });

    // Group by date
    const grouped: Record<string, { date: string; sent: number; delivered: number; failed: number }> = {};
    for (let i = 0; i < 30; i++) {
      const d = new Date(now.getTime() - (29 - i) * 24 * 60 * 60 * 1000);
      const key = d.toISOString().split('T')[0];
      grouped[key] = { date: key, sent: 0, delivered: 0, failed: 0 };
    }

    for (const log of logs) {
      const key = log.sentAt.toISOString().split('T')[0];
      if (grouped[key]) {
        grouped[key].sent++;
        if (log.status === 'delivered') grouped[key].delivered++;
        if (log.status === 'failed') grouped[key].failed++;
      }
    }

    return NextResponse.json({ success: true, data: Object.values(grouped) });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}