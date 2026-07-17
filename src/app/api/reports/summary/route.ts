import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = getAuthUser(request);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const now = new Date();
    const todayMonth = now.getMonth() + 1;
    const todayDay = now.getDate();

    const [
      totalClients,
      allClients,
      smsSentToday,
      smsSentThisMonth,
      failedSms,
    ] = await Promise.all([
      db.client.count({ where: { status: 'active' } }),
      db.client.findMany({ where: { status: 'active' } }),
      db.smsLog.count({ where: { sentAt: { gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()) } } }),
      db.smsLog.count({ where: { sentAt: { gte: new Date(now.getFullYear(), now.getMonth(), 1) } } }),
      db.smsLog.count({ where: { status: 'failed' } }),
    ]);

    const birthdaysToday = allClients.filter(c => {
      const dob = new Date(c.dateOfBirth);
      return dob.getMonth() + 1 === todayMonth && dob.getDate() === todayDay;
    }).length;

    // Upcoming birthdays (next 30 days)
    const currentYear = now.getFullYear();
    const upcomingBirthdays = allClients
      .map(c => {
        const dob = new Date(c.dateOfBirth);
        let nextBday = new Date(currentYear, dob.getMonth(), dob.getDate());
        if (nextBday < new Date(currentYear, now.getMonth(), now.getDate())) {
          nextBday = new Date(currentYear + 1, dob.getMonth(), dob.getDate());
        }
        const daysUntil = Math.ceil((nextBday.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return { ...c, nextBirthday: nextBday, daysUntil };
      })
      .filter(c => c.daysUntil > 0 && c.daysUntil <= 30)
      .sort((a, b) => a.daysUntil - b.daysUntil);

    return NextResponse.json({
      success: true,
      data: { totalClients, birthdaysToday, smsSentToday, smsSentThisMonth, failedSms, upcomingBirthdays },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}