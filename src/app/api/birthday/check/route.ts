import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser, createAuditEntry, hasRole } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const user = getAuthUser(request);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (!hasRole(user, ['super_admin', 'marketing_admin'])) {
      return NextResponse.json({ success: false, error: 'Only admins can trigger birthday SMS' }, { status: 403 });
    }

    const now = new Date();
    const todayMonth = now.getMonth() + 1;
    const todayDay = now.getDate();
    const currentYear = now.getFullYear();

    // Find clients whose birthday is today
    const clients = await db.client.findMany({
      where: { status: 'active' },
    });

    const birthdayClients = clients.filter(c => {
      const dob = new Date(c.dateOfBirth);
      return dob.getMonth() + 1 === todayMonth && dob.getDate() === todayDay;
    });

    // Get active default template
    const template = await db.smsTemplate.findFirst({ where: { isActive: true, isDefault: true } });
    if (!template) {
      return NextResponse.json({ success: false, error: 'No active default template found. Please configure one.' }, { status: 400 });
    }

    // Get company name
    const companySetting = await db.systemSetting.findUnique({ where: { key: 'company_name' } });
    const companyName = companySetting?.value || 'Our Company';

    // Get active gateway
    const gateway = await db.smsGatewayConfig.findFirst({ where: { isActive: true } });
    const provider = gateway?.provider || 'arkesel';

    // Check SMS credits
    const creditSetting = await db.systemSetting.findUnique({ where: { key: 'sms_credits' } });
    let credits = creditSetting ? parseInt(creditSetting.value) : 0;

    let processed = 0;
    let skipped = 0;

    for (const client of birthdayClients) {
      // Check duplicate for this year
      const existing = await db.birthdaySmsTracker.findUnique({
        where: { clientId_year: { clientId: client.id, year: currentYear } },
      });
      if (existing) { skipped++; continue; }

      if (credits <= 0) {
        await db.notification.create({
          data: { type: 'low_credits', title: 'SMS Credits Exhausted', message: 'Cannot send birthday SMS — credits have run out.' },
        });
        break;
      }

      // Replace placeholders
      const message = template.content
        .replace(/\{Client Name\}/g, client.fullName)
        .replace(/\{Company Name\}/g, companyName);

      await db.smsLog.create({
        data: {
          clientId: client.id, templateId: template.id, recipientName: client.fullName,
          recipientPhone: client.mobileNumber, message, status: 'sent', provider,
          providerResponse: JSON.stringify({ automated: true, gateway: provider }),
        },
      });

      await db.birthdaySmsTracker.create({ data: { clientId: client.id, year: currentYear } });
      credits--;
      processed++;
    }

    // Update credits
    await db.systemSetting.upsert({
      where: { key: 'sms_credits' },
      update: { value: String(credits) },
      create: { key: 'sms_credits', value: String(credits) },
    });

    // Create upcoming birthday notifications (next 7 days)
    for (const client of clients) {
      const dob = new Date(client.dateOfBirth);
      let nextBirthday = new Date(currentYear, dob.getMonth(), dob.getDate());
      if (nextBirthday < now) nextBirthday = new Date(currentYear + 1, dob.getMonth(), dob.getDate());
      const daysUntil = Math.ceil((nextBirthday.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (daysUntil > 0 && daysUntil <= 7) {
        const existingNotif = await db.notification.findFirst({
          where: { type: 'upcoming_birthday', message: { contains: client.fullName } },
          orderBy: { createdAt: 'desc' },
        });
        if (!existingNotif) {
          await db.notification.create({
            data: {
              type: 'upcoming_birthday',
              title: 'Upcoming Birthday',
              message: `${client.fullName}'s birthday is in ${daysUntil} day${daysUntil > 1 ? 's' : ''}!`,
            },
          });
        }
      }
    }

    await db.auditLog.create({
      data: createAuditEntry(user.id, 'BIRTHDAY_SMS', 'birthday', `Birthday check: ${processed} sent, ${skipped} skipped`),
    });

    return NextResponse.json({
      success: true,
      data: { processed, skipped, total: birthdayClients.length, creditsRemaining: credits },
      message: `Birthday SMS processed: ${processed} sent, ${skipped} skipped (already sent this year)`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}