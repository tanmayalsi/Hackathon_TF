import { NextRequest, NextResponse } from 'next/server';
import { loadSocialMediaData } from '@/lib/social-data-loader';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Parse filters
    const platform = searchParams.get('platform');
    const category = searchParams.get('category');
    const location = searchParams.get('location');
    const hours = parseInt(searchParams.get('hours') || '168', 10); // Default 7 days
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '50', 10);
    const search = searchParams.get('search');

    // Load all data from CSV
    const allData = loadSocialMediaData();

    // Calculate time filter
    const timeFilter = new Date(Date.now() - hours * 60 * 60 * 1000);

    // Filter data
    let filteredData = allData.filter((post) => {
      const postDate = new Date(post.timestamp);
      if (postDate < timeFilter) return false;
      
      if (platform && post.social_media !== platform) return false;
      if (category && post.category !== category) return false;
      if (location && !post.location.toLowerCase().includes(location.toLowerCase())) return false;
      
      if (search) {
        const searchLower = search.toLowerCase();
        if (
          !post.comment.toLowerCase().includes(searchLower) &&
          !post.username.toLowerCase().includes(searchLower)
        ) {
          return false;
        }
      }
      
      return true;
    });

    // Sort by timestamp descending
    filteredData.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Paginate
    const total = filteredData.length;
    const start = (page - 1) * pageSize;
    const paginatedData = filteredData.slice(start, start + pageSize);

    return NextResponse.json({
      data: paginatedData,
      total,
      page,
      pageSize,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching social media data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch social media data', details: String(error) },
      { status: 500 }
    );
  }
}

