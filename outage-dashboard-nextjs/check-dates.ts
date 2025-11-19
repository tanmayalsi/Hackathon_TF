import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDates() {
  const result = await prisma.$queryRaw`
    SELECT MIN(startdatetime) as min_date, MAX(startdatetime) as max_date
    FROM team_thread_forge.call_data
  `;
  console.log('Date range:', result);
  await prisma.$disconnect();
}

checkDates().catch(console.error);
