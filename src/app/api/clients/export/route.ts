import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import Papa from 'papaparse';

export async function GET(request: NextRequest) {
  try {
    const user = getAuthUser(request);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || '';
    const category = searchParams.get('category') || '';

    const where: any = {};
    if (status) where.status = status;
    if (category) where.customerCategory = category;

    const clients = await db.client.findMany({ where, orderBy: { createdAt: 'desc' } });
    const csv = Papa.unparse(clients.map(c => ({
      'Client ID': c.clientId, 'Full Name': c.fullName, 'Gender': c.gender,
      'Date of Birth': c.dateOfBirth.toISOString().split('T')[0],
      'Mobile Number': c.mobileNumber, 'Alternative Number': c.alternativeNumber || '',
      'Email': c.emailAddress || '', 'Address': c.residentialAddress || '',
      'Occupation': c.occupation || '', 'Category': c.customerCategory,
      'Status': c.status, 'Registration Date': c.registrationDate.toISOString().split('T')[0],
      'Notes': c.notes || '',
    })));

    return new NextResponse(csv, {
      headers: { 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename=clients.csv' },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}