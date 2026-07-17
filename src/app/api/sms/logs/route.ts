import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = getAuthUser(request);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const status = searchParams.get('status') || '';
    const provider = searchParams.get('provider') || '';
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';

    const where: any = {};
    if (status) where.status = status;
    if (provider) where.provider = provider;
    if (startDate || endDate) {
      where.sentAt = {};
      if (startDate) where.sentAt.gte = new Date(startDate);
      if (endDate) where.sentAt.lte = new Date(endDate);
    }

    const [logs, total] = await Promise.all([
      db.smsLog.findMany({ where, skip: (page - 1) * pageSize, take: pageSize, orderBy: { sentAt: 'desc' }, include: { client: { select: { clientId: true, fullName: true } } } }),
      db.smsLog.count({ where }),
    ]);

    return NextResponse.json({ success: true, data: { logs, total, page, pageSize, totalPages: Math.ceil(total / pageSize) } });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}