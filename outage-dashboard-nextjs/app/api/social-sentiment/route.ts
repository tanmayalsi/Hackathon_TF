import { NextRequest, NextResponse } from 'next/server';
import { loadSocialMediaData } from '@/lib/social-data-loader';

// Sentiment classification based on category
function getSentiment(category: string): 'positive' | 'negative' | 'neutral' {
  const positiveCategories = ['Positive Feedback'];
  const negativeCategories = [
    'Service Issue',
    'Billing Issue',
    'Customer Service Complaint',
    'Corporate/PR Issue',
  ];
  
  if (positiveCategories.includes(category)) {
    return 'positive';
  } else if (negativeCategories.includes(category)) {
    return 'negative';
  } else {
    return 'neutral';
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const hours = parseInt(searchParams.get('hours') || '168', 10); // Default 7 days
    const timeFilter = new Date(Date.now() - hours * 60 * 60 * 1000);

    console.log(`Fetching sentiment data for last ${hours} hours (since ${timeFilter.toISOString()})`);

    // Load all data from CSV
    const allData = loadSocialMediaData();

    // Filter posts within time range
    const posts = allData
      .filter((post) => new Date(post.timestamp) >= timeFilter)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    console.log(`Found ${posts.length} posts for sentiment analysis`);

    // Time series data (by day or hour depending on range)
    const timeSeriesMap = new Map<string, { positive: number; negative: number; neutral: number }>();
    
    posts.forEach((post) => {
      // timestamp is already a string from CSV, extract the date part
      const dateKey = post.timestamp.split(' ')[0]; // Get date part (YYYY-MM-DD)
      const sentiment = getSentiment(post.category);
      
      if (!timeSeriesMap.has(dateKey)) {
        timeSeriesMap.set(dateKey, { positive: 0, negative: 0, neutral: 0 });
      }
      
      const data = timeSeriesMap.get(dateKey)!;
      data[sentiment]++;
    });

    const timeSeriesData = Array.from(timeSeriesMap.entries()).map(([date, counts]) => ({
      date,
      positive: counts.positive,
      negative: counts.negative,
      neutral: counts.neutral,
      total: counts.positive + counts.negative + counts.neutral,
    }));

    // Category breakdown
    const categoryMap = new Map<string, number>();
    posts.forEach((post) => {
      categoryMap.set(post.category, (categoryMap.get(post.category) || 0) + 1);
    });

    const totalPosts = posts.length;
    const categoryBreakdown = Array.from(categoryMap.entries()).map(([category, count]) => ({
      category,
      count,
      percentage: totalPosts > 0 ? Math.round((count / totalPosts) * 100 * 10) / 10 : 0,
    }));

    // Location sentiment
    const locationMap = new Map<string, { positive: number; negative: number; neutral: number }>();
    posts.forEach((post) => {
      const sentiment = getSentiment(post.category);
      if (!locationMap.has(post.location)) {
        locationMap.set(post.location, { positive: 0, negative: 0, neutral: 0 });
      }
      locationMap.get(post.location)![sentiment]++;
    });

    const locationSentiment = Array.from(locationMap.entries()).map(([location, counts]) => ({
      location,
      positive: counts.positive,
      negative: counts.negative,
      neutral: counts.neutral,
      total: counts.positive + counts.negative + counts.neutral,
    }));

    // Platform distribution
    const platformMap = new Map<string, number>();
    posts.forEach((post) => {
      platformMap.set(post.social_media, (platformMap.get(post.social_media) || 0) + 1);
    });

    const platformDistribution = Array.from(platformMap.entries()).map(([platform, count]) => ({
      platform,
      count,
      percentage: totalPosts > 0 ? Math.round((count / totalPosts) * 100 * 10) / 10 : 0,
    }));

    // Overall stats
    let positiveCount = 0;
    let negativeCount = 0;
    let neutralCount = 0;

    posts.forEach((post) => {
      const sentiment = getSentiment(post.category);
      if (sentiment === 'positive') positiveCount++;
      else if (sentiment === 'negative') negativeCount++;
      else neutralCount++;
    });

    const overallStats = {
      totalPosts,
      positivePercentage: totalPosts > 0 ? Math.round((positiveCount / totalPosts) * 100 * 10) / 10 : 0,
      negativePercentage: totalPosts > 0 ? Math.round((negativeCount / totalPosts) * 100 * 10) / 10 : 0,
      neutralPercentage: totalPosts > 0 ? Math.round((neutralCount / totalPosts) * 100 * 10) / 10 : 0,
    };

    return NextResponse.json({
      timeSeriesData,
      categoryBreakdown,
      locationSentiment,
      platformDistribution,
      overallStats,
      timeRangeHours: hours,
    });
  } catch (error) {
    console.error('Error fetching sentiment data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sentiment data', details: String(error) },
      { status: 500 }
    );
  }
}

