import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser, createAuditEntry, hasRole } from '@/lib/auth';
import Papa from 'papaparse';

export async function POST(request: NextRequest) {
  try {
    const user = getAuthUser(request);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (!hasRole(user, ['super_admin', 'marketing_admin'])) {
      return NextResponse.json({ success: false, error: 'Only admins can import clients' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    if (!file) return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 });

    const text = await file.text();
    const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
    const rows = parsed.data as any[];

    const lastClient = await db.client.findFirst({ orderBy: { createdAt: 'desc' }, select: { clientId: true } });
    let nextNum = 1;
    if (lastClient?.clientId) {
      const match = lastClient.clientId.match(/CLT-(\d+)/);
      if (match) nextNum = parseInt(match[1]) + 1;
    }

    let imported = 0;
    for (const row of rows) {
      if (!row.fullName || !row.dateOfBirth || !row.mobileNumber) continue;
      const clientId = `CLT-${String(nextNum).padStart(4, '0')}`;
      nextNum++;
      try {
        await db.client.create({
          data: {
            clientId, fullName: row.fullName, gender: row.gender || 'not_specified',
            dateOfBirth: new Date(row.dateOfBirth), mobileNumber: row.mobileNumber,
            alternativeNumber: row.alternativeNumber || null, emailAddress: row.emailAddress || null,
            residentialAddress: row.residentialAddress || null, occupation: row.occupation || null,
            customerCategory: row.customerCategory || 'general', notes: row.notes || null,
          },
        });
        imported++;
      } catch { /* skip invalid rows */ }
    }

    await db.auditLog.create({ data: createAuditEntry(user.id, 'IMPORT', 'clients', `Imported ${imported} clients from CSV`) });
    return NextResponse.json({ success: true, data: { imported, total: rows.length } });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}