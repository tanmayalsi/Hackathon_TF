import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';
import type { SocialMediaPost } from '@/types';

// Cache for parsed data
let cachedData: SocialMediaPost[] | null = null;

export function loadSocialMediaData(): SocialMediaPost[] {
  // Return cached data if available
  if (cachedData) {
    return cachedData;
  }

  try {
    // Read CSV file
    const csvPath = path.join(process.cwd(), '..', 'data', 'social_media_data.csv');
    const fileContent = fs.readFileSync(csvPath, 'utf-8');

    // Parse CSV
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
    });

    // Transform to SocialMediaPost format
    cachedData = records.map((row: any) => ({
      id: parseInt(row.id, 10),
      username: row.Username,
      social_media: row.Social_Media,
      comment: row.Comment,
      location: row.Location,
      timestamp: row.Timestamp,
      category: row.Category,
    }));

    console.log(`✅ Loaded ${cachedData.length} social media posts from CSV`);
    return cachedData;
  } catch (error) {
    console.error('❌ Error loading social media data:', error);
    return [];
  }
}

export function clearCache() {
  cachedData = null;
}

