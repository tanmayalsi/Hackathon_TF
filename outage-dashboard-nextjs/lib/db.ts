import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['query', 'error', 'warn'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Cache for ZIP coordinates loaded from CSV
let zipCoordinatesCache: Record<string, { lat: number; lon: number; city: string }> | null = null;

/**
 * Load ZIP coordinates from the zip.csv file
 * This function reads all US ZIP codes with their lat/lon coordinates
 * Results are cached after first load for performance
 */
export function getZipCoordinates(): Record<string, { lat: number; lon: number; city: string }> {
  if (zipCoordinatesCache) {
    return zipCoordinatesCache;
  }

  try {
    const zipFilePath = path.join(process.cwd(), 'lib', 'zip.csv');
    const zipData = fs.readFileSync(zipFilePath, 'utf-8');
    const lines = zipData.split('\n');
    
    zipCoordinatesCache = {};
    
    // Skip header row (ZIP,LAT,LNG)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const [zip, lat, lng] = line.split(',');
      if (zip && lat && lng) {
        const zipCode = zip.trim();
        zipCoordinatesCache[zipCode] = {
          lat: parseFloat(lat.trim()),
          lon: parseFloat(lng.trim()),
          city: 'Unknown', // CSV doesn't include city names
        };
      }
    }
    
    console.log(`Loaded ${Object.keys(zipCoordinatesCache).length} ZIP codes from CSV`);
    return zipCoordinatesCache;
  } catch (error) {
    console.error('Error loading ZIP coordinates from CSV:', error);
    // Return empty object as fallback
    return {};
  }
}

// Export for backward compatibility - loads from CSV on first access
export const ZIP_COORDINATES = getZipCoordinates();

export default prisma;
