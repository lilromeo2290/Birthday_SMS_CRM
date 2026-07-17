import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser, createAuditEntry, hasRole } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = getAuthUser(request);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const category = searchParams.get('category') || '';

    const where: any = {};
    if (search) {
      where.OR = [
        { fullName: { contains: search } },
        { clientId: { contains: search } },
        { mobileNumber: { contains: search } },
        { emailAddress: { contains: search } },
      ];
    }
    if (status) where.status = status;
    if (category) where.customerCategory = category;

    const [clients, total] = await Promise.all([
      db.client.findMany({ where, skip: (page - 1) * pageSize, take: pageSize, orderBy: { createdAt: 'desc' } }),
      db.client.count({ where }),
    ]);

    return NextResponse.json({ success: true, data: { clients, total, page, pageSize, totalPages: Math.ceil(total / pageSize) } });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = getAuthUser(request);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (!hasRole(user, ['super_admin', 'marketing_admin', 'staff'])) {
      return NextResponse.json({ success: false, error: 'Insufficient permissions' }, { status: 403 });
    }

    const data = await request.json();
    const { fullName, gender, dateOfBirth, mobileNumber, alternativeNumber, emailAddress, residentialAddress, occupation, customerCategory, notes } = data;

    if (!fullName || !dateOfBirth || !mobileNumber) {
      return NextResponse.json({ success: false, error: 'Full name, date of birth, and mobile number are required' }, { status: 400 });
    }

    const lastClient = await db.client.findFirst({ orderBy: { createdAt: 'desc' }, select: { clientId: true } });
    let nextNum = 1;
    if (lastClient?.clientId) {
      const match = lastClient.clientId.match(/CLT-(\d+)/);
      if (match) nextNum = parseInt(match[1]) + 1;
    }
    const clientId = `CLT-${String(nextNum).padStart(4, '0')}`;

    const client = await db.client.create({
      data: {
        clientId, fullName, gender: gender || 'not_specified', dateOfBirth: new Date(dateOfBirth),
        mobileNumber, alternativeNumber: alternativeNumber || null, emailAddress: emailAddress || null,
        residentialAddress: residentialAddress || null, occupation: occupation || null,
        customerCategory: customerCategory || 'general', notes: notes || null,
      },
    });

    await db.auditLog.create({ data: createAuditEntry(user.id, 'CREATE', 'clients', `Created client ${clientId} - ${fullName}`) });
    return NextResponse.json({ success: true, data: client }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}