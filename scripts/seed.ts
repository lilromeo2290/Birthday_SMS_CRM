import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const db = new PrismaClient();

const NAMES = [
  'Kwame Asante', 'Ama Mensah', 'Kofi Boateng', 'Abena Osei', 'Yaw Adjei',
  'Akosua Owusu', 'Kwabena Darko', 'Afia Amponsah', 'Emmanuel Tetteh', 'Grace Agbeko',
  'Samuel Okyere', 'Esther Addo', 'Daniel Agyeman', 'Rebecca Kissi', 'Joseph Owusu-Ansah',
  'Patience Mensah', 'Isaac Darkwa', 'Felicia Tetteh', 'Samuel Adjei-Kusi', 'Ruth Adu',
  'Benjamin Amponsah', 'Naomi Ofori', 'Gabriel Agyei', 'Hannah Boateng', 'Mark Asamoah',
  'Lydia Owusu', 'David Tetteh-Fio', 'Cecilia Amankwah', 'Stephen Ansah', 'Victoria Osei-Bonsu',
  'Andrews Kofi', 'Priscilla Adjei', 'Michael Boakye', 'Regina Mensah', 'Albert Osei',
  'Dorcas Ampofo', 'Francis Boadi', 'Matilda Owusu', 'Patrick Asante', 'Agnes Tawiah',
  'Ebenezer Ofori-Atta', 'Juliet Adjei', 'John Kwarteng', 'Evelyn Obeng', 'Peter Adu-Gyamfi',
  'Benedicta Osei', 'Thomas Amoako', 'Mary Ansong', 'Samuel Ahenkorah', 'Rosaline Osei-Wusu',
];

const OCCUPATIONS = ['Teacher', 'Nurse', 'Business Owner', 'Engineer', 'Accountant', 'Doctor', 'Lawyer', 'IT Professional', 'Farmer', 'Civil Servant', 'Banker', 'Marketing Manager', 'Sales Representative', 'Student', 'Trader'];
const CATEGORIES = ['premium', 'regular', 'general', 'vip'];
const AREAS = ['Accra', 'Kumasi', 'Tamale', 'Takoradi', 'Cape Coast', 'Sunyani', 'Tema', 'Ho', 'Koforidua', 'Wa'];

function randomItem<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function randomDate(month?: number, day?: number): Date {
  const y = 1970 + Math.floor(Math.random() * 40);
  const m = month ?? (1 + Math.floor(Math.random() * 12));
  const d = day ?? (1 + Math.floor(Math.random() * 28));
  return new Date(y, m - 1, d);
}

async function main() {
  console.log('Seeding database...');

  // Clear existing data
  await db.birthdaySmsTracker.deleteMany();
  await db.auditLog.deleteMany();
  await db.smsLog.deleteMany();
  await db.notification.deleteMany();
  await db.systemSetting.deleteMany();
  await db.smsGatewayConfig.deleteMany();
  await db.smsTemplate.deleteMany();
  await db.client.deleteMany();
  await db.user.deleteMany();

  // Users
  const adminPass = await bcrypt.hash('admin123', 12);
  const marketingPass = await bcrypt.hash('marketing123', 12);
  const staffPass = await bcrypt.hash('staff123', 12);

  const admin = await db.user.create({ data: { email: 'admin@crm.com', name: 'System Administrator', password: adminPass, role: 'super_admin' } });
  const marketing = await db.user.create({ data: { email: 'marketing@crm.com', name: 'Marketing Manager', password: marketingPass, role: 'marketing_admin' } });
  const staff = await db.user.create({ data: { email: 'staff@crm.com', name: 'Staff User', password: staffPass, role: 'staff' } });

  console.log('Created 3 users');

  // Clients
  const now = new Date();
  const todayMonth = now.getMonth() + 1;
  const todayDay = now.getDate();
  const clients = [];

  for (let i = 0; i < 50; i++) {
    let dob: Date;
    // 5 clients have birthday today
    if (i < 5) {
      dob = randomDate(todayMonth, todayDay);
    } else if (i < 12) {
      // Next 30 days
      const futureDay = todayDay + 1 + Math.floor(Math.random() * 28);
      dob = randomDate(todayMonth, Math.min(futureDay, 28));
    } else {
      dob = randomDate();
    }

    const gender = i % 3 === 0 ? 'male' : i % 3 === 1 ? 'female' : 'not_specified';
    clients.push({
      clientId: `CLT-${String(i + 1).padStart(4, '0')}`,
      fullName: NAMES[i],
      gender,
      dateOfBirth: dob,
      mobileNumber: `+233${20 + Math.floor(Math.random() * 60)}${String(Math.floor(Math.random() * 10000000)).padStart(7, '0')}`,
      alternativeNumber: Math.random() > 0.6 ? `+233${20 + Math.floor(Math.random() * 60)}${String(Math.floor(Math.random() * 10000000)).padStart(7, '0')}` : null,
      emailAddress: `${NAMES[i].toLowerCase().replace(/\s+/g, '.')}@email.com`,
      residentialAddress: `${Math.floor(Math.random() * 200) + 1} ${randomItem(AREAS)} Road, ${randomItem(AREAS)}`,
      occupation: randomItem(OCCUPATIONS),
      customerCategory: randomItem(CATEGORIES),
      notes: i < 3 ? 'VIP client - handle with care' : Math.random() > 0.7 ? 'Prefers evening communications' : null,
      status: Math.random() > 0.1 ? 'active' : 'inactive',
    });
  }

  for (const c of clients) {
    await db.client.create({ data: c });
  }
  console.log('Created 50 clients');

  // SMS Templates
  await db.smsTemplate.create({
    data: {
      name: 'Default Birthday Greeting',
      content: 'Happy Birthday, {Client Name}! Wishing you joy, success, and good health throughout the coming year. Thank you for being a valued customer. Best wishes from {Company Name}.',
      isActive: true, isDefault: true, campaign: 'birthday-2024',
    },
  });
  await db.smsTemplate.create({
    data: {
      name: 'Premium Birthday Message',
      content: 'Dear {Client Name}, Happy Birthday! As a valued premium member of {Company Name}, we celebrate you today! May this year bring you extraordinary success and happiness. Enjoy your special day!',
      isActive: true, isDefault: false, campaign: 'premium-birthday',
    },
  });
  await db.smsTemplate.create({
    data: {
      name: 'Short Birthday Wish',
      content: 'Happy Birthday {Client Name}! Warmest wishes from {Company Name}. Have a wonderful day!',
      isActive: false, isDefault: false, campaign: 'birthday-short',
    },
  });
  console.log('Created 3 SMS templates');

  // System Settings
  await db.systemSetting.createMany({
    data: [
      { key: 'company_name', value: 'Acme Marketing Solutions' },
      { key: 'sms_credits', value: '1000' },
      { key: 'birthday_scheduler_enabled', value: 'true' },
      { key: 'scheduler_time', value: '08:00' },
    ],
  });
  console.log('Created system settings');

  // SMS Gateway Configs
  await db.smsGatewayConfig.createMany({
    data: [
      { provider: 'arkesel', isActive: true, apiKey: 'ark_live_xxxxxxxxxxxxxxxxx', senderId: 'AcmeCRM', apiUrl: 'https://sms.arkesel.com/api/v2/sms/send' },
      { provider: 'hubtel', isActive: false, apiKey: 'hub_xxxxxxxxxxxxxxxxx', apiSecret: 'hub_secret_xxxxxxxxxxxxxxxxx', senderId: 'AcmeCRM', apiUrl: 'https://api.hubtel.com/v1/messages/sms/send' },
      { provider: 'africas_talking', isActive: false, apiKey: 'at_xxxxxxxxxxxxxxxxx', senderId: 'AcmeCRM', apiUrl: 'https://api.africastalking.com/v1/messaging' },
    ],
  });
  console.log('Created SMS gateway configs');

  // Sample SMS Logs
  const statuses = ['sent', 'delivered', 'delivered', 'delivered', 'failed', 'sent', 'delivered'];
  const providers = ['arkesel', 'hubtel', 'africas_talking'];

  for (let i = 0; i < 25; i++) {
    const daysAgo = Math.floor(Math.random() * 45);
    const sentDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    const clientIdx = Math.floor(Math.random() * 50);
    await db.smsLog.create({
      data: {
        clientId: (await db.client.findFirst({ skip: clientIdx }))!.id,
        recipientName: NAMES[clientIdx],
        recipientPhone: `+233${20 + Math.floor(Math.random() * 60)}${String(Math.floor(Math.random() * 10000000)).padStart(7, '0')}`,
        message: `Happy Birthday, ${NAMES[clientIdx]}! Wishing you joy and success from Acme Marketing Solutions.`,
        status: randomItem(statuses),
        provider: randomItem(providers),
        sentAt: sentDate,
        deliveredAt: randomItem(statuses) === 'delivered' ? new Date(sentDate.getTime() + Math.random() * 600000) : null,
        providerResponse: JSON.stringify({ messageId: `msg_${Math.random().toString(36).slice(2)}` }),
      },
    });
  }
  console.log('Created 25 sample SMS logs');

  // Notifications
  await db.notification.createMany({
    data: [
      { type: 'upcoming_birthday', title: 'Upcoming Birthday', message: 'Kwame Asante\'s birthday is tomorrow!', isRead: false },
      { type: 'low_credits', title: 'SMS Credits Running Low', message: 'You have 1000 credits remaining. Consider recharging soon.', isRead: false },
      { type: 'failed_delivery', title: 'Failed SMS Delivery', message: '2 SMS messages failed to deliver yesterday.', isRead: true },
      { type: 'upcoming_birthday', title: 'Birthday Today', message: '5 clients are celebrating their birthday today!', isRead: false },
    ],
  });
  console.log('Created 4 notifications');

  // Audit logs
  await db.auditLog.createMany({
    data: [
      { userId: admin.id, action: 'LOGIN', module: 'auth', details: 'Admin logged in' },
      { userId: marketing.id, action: 'CREATE', module: 'clients', details: 'Imported 50 clients from CSV' },
      { userId: admin.id, action: 'UPDATE', module: 'settings', details: 'Updated gateway config for arkesel' },
      { userId: marketing.id, action: 'BIRTHDAY_SMS', module: 'birthday', details: 'Birthday check: 5 sent, 0 skipped' },
    ],
  });
  console.log('Created 4 audit log entries');

  console.log('\nSeed completed successfully!');
  console.log('Login credentials:');
  console.log('  Super Admin:   admin@crm.com / admin123');
  console.log('  Marketing:     marketing@crm.com / marketing123');
  console.log('  Staff:         staff@crm.com / staff123');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());