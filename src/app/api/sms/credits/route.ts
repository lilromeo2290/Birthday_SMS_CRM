import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = getAuthUser(request);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const setting = await db.systemSetting.findUnique({ where: { key: 'sms_credits' } });
    const credits = setting ? parseInt(setting.value) : 0;

    return NextResponse.json({ success: true, data: { credits } });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}