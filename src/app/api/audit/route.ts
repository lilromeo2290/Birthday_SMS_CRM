import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser, hasRole } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = getAuthUser(request);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (!hasRole(user, ['super_admin', 'marketing_admin'])) {
      return NextResponse.json({ success: false, error: 'Insufficient permissions' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const module_ = searchParams.get('module') || '';
    const action_ = searchParams.get('action') || '';
    const userId = searchParams.get('userId') || '';

    const where: any = {};
    if (module_ && module_ !== 'all') where.module = module_;
    if (action_ && action_ !== 'all') where.action = action_;
    if (userId) where.userId = userId;

    const [logs, total] = await Promise.all([
      db.auditLog.findMany({
        where, skip: (page - 1) * pageSize, take: pageSize, orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true, email: true } } },
      }),
      db.auditLog.count({ where }),
    ]);

    return NextResponse.json({ success: true, data: { logs, total, page, pageSize, totalPages: Math.ceil(total / pageSize) } });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}