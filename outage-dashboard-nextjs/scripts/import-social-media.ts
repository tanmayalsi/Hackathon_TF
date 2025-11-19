import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';

const prisma = new PrismaClient();

interface CsvRow {
  id: string;
  Username: string;
  Social_Media: string;
  Comment: string;
  Location: string;
  Timestamp: string;
  Category: string;
}

async function importSocialMediaData() {
  try {
    console.log('Starting social media data import...');

    // Read CSV file
    const csvPath = path.join(__dirname, '../../data/social_media_data.csv');
    const fileContent = fs.readFileSync(csvPath, 'utf-8');

    // Parse CSV
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
    }) as CsvRow[];

    console.log(`Parsed ${records.length} records from CSV`);

    // Delete existing data
    console.log('Clearing existing social media data...');
    await prisma.socialMediaData.deleteMany({});

    // Prepare data for insertion
    const dataToInsert = records.map((row) => ({
      id: parseInt(row.id, 10),
      username: row.Username,
      social_media: row.Social_Media,
      comment: row.Comment,
      location: row.Location,
      timestamp: new Date(row.Timestamp),
      category: row.Category,
    }));

    // Batch insert
    console.log('Inserting data into database...');
    const batchSize = 100;
    for (let i = 0; i < dataToInsert.length; i += batchSize) {
      const batch = dataToInsert.slice(i, i + batchSize);
      await prisma.socialMediaData.createMany({
        data: batch,
        skipDuplicates: true,
      });
      console.log(`Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(dataToInsert.length / batchSize)}`);
    }

    console.log('✅ Social media data import completed successfully!');
    console.log(`Total records imported: ${dataToInsert.length}`);

    // Verify import
    const count = await prisma.socialMediaData.count();
    console.log(`Verification: Database now contains ${count} social media posts`);
  } catch (error) {
    console.error('❌ Error importing social media data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

importSocialMediaData();

