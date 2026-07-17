import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const db = new PrismaClient();

async function main() {
  console.log('Seeding clean database...');

  const adminPass = await bcrypt.hash('admin123', 12);
  await db.user.create({
    data: { email: 'admin@crm.com', name: 'System Administrator', password: adminPass, role: 'super_admin' }
  });

  // Default system settings
  await db.systemSetting.createMany({
    data: [
      { key: 'company_name', value: '' },
      { key: 'company_phone', value: '' },
      { key: 'sms_signature', value: '' },
      { key: 'birthday_automation_enabled', value: 'true' },
      { key: 'daily_check_time', value: '08:00' },
      { key: 'sms_credits', value: '0' },
    ],
  });

  console.log('Done! Fresh system ready.');
  console.log('Login: admin@crm.com / admin123');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());