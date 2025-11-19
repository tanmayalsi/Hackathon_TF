import { NextRequest, NextResponse } from 'next/server';
import { loadSocialMediaData } from '@/lib/social-data-loader';
import type { SocialChatRequest } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body: SocialChatRequest = await request.json();
    const { messages, filters } = body;

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages are required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error('ANTHROPIC_API_KEY not configured');
      return NextResponse.json(
        { error: 'AI service not configured' },
        { status: 500 }
      );
    }

    // Apply filters
    const hours = filters?.hours || 168; // Default 7 days
    const timeFilter = new Date(Date.now() - hours * 60 * 60 * 1000);

    console.log('Fetching posts for chat context with filters:', filters);

    // Load all data from CSV and filter
    const allData = loadSocialMediaData();
    let posts = allData.filter((post) => {
      const postDate = new Date(post.timestamp);
      if (postDate < timeFilter) return false;

      if (filters?.platform && post.social_media !== filters.platform) return false;
      if (filters?.category && post.category !== filters.category) return false;
      if (filters?.location && !post.location.toLowerCase().includes(filters.location.toLowerCase())) return false;

      return true;
    });

    // Sort and limit
    posts = posts
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 150); // Limit context size

    console.log(`Found ${posts.length} posts for chat context`);

    // Build context summary
    const MAX_COMMENT_LENGTH = 500;
    const postsSummary = posts.map((post, idx) => {
      const comment = post.comment.length > MAX_COMMENT_LENGTH
        ? post.comment.substring(0, MAX_COMMENT_LENGTH) + '...[truncated]'
        : post.comment;
      
      return `Post ${idx + 1} (ID: ${post.id}, Platform: ${post.social_media}, Location: ${post.location}, Category: ${post.category}, Time: ${new Date(post.timestamp).toLocaleString()}):
@${post.username}: "${comment}"`;
    }).join('\n\n---\n\n');

    // Category distribution
    const categoryCount = new Map<string, number>();
    posts.forEach((post) => {
      categoryCount.set(post.category, (categoryCount.get(post.category) || 0) + 1);
    });
    const categoryStats = Array.from(categoryCount.entries())
      .map(([cat, count]) => `${cat}: ${count}`)
      .join(', ');

    // Platform distribution
    const platformCount = new Map<string, number>();
    posts.forEach((post) => {
      platformCount.set(post.social_media, (platformCount.get(post.social_media) || 0) + 1);
    });
    const platformStats = Array.from(platformCount.entries())
      .map(([plat, count]) => `${plat}: ${count}`)
      .join(', ');

    // Build system prompt
    const systemPrompt = `You are an AI assistant analyzing social media feedback for a telecom company.

You have access to ${posts.length} social media posts from the last ${Math.round(hours / 24)} days across Twitter, Reddit, and Facebook.

Summary Statistics:
- Total Posts: ${posts.length}
- Categories: ${categoryStats}
- Platforms: ${platformStats}
${filters?.platform ? `- Filtered by Platform: ${filters.platform}` : ''}
${filters?.category ? `- Filtered by Category: ${filters.category}` : ''}
${filters?.location ? `- Filtered by Location: ${filters.location}` : ''}

Your role is to:
- Answer questions about the posts based ONLY on the provided data
- Identify patterns, trends, and common themes
- Provide specific examples and quote from posts when relevant
- Summarize key information when asked
- Be concise, factual, and data-driven
- Use numbers and statistics to support your answers
- If you don't have enough information, say so clearly

Available Categories:
- Service Issue: Technical problems, outages, connectivity issues
- Billing Issue: Charges, refunds, pricing concerns
- Customer Service Complaint: Support quality, wait times
- Positive Feedback: Happy customers, praise
- Sales Opportunity: Inquiries about plans, pricing, services
- Feature Request: New features, improvements
- Network Coverage: Cell tower requests, coverage gaps
- Corporate/PR Issue: Company policies, working conditions

Here are the social media posts:

${postsSummary}

Remember: Only use information from these posts. Be helpful and insightful.`;

    // Prepare messages for Claude API
    const anthropicMessages = messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    // Call Claude API
    console.log('Calling Claude API for social media chat...');
    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2048,
        system: systemPrompt,
        messages: anthropicMessages,
      }),
    });

    if (!anthropicResponse.ok) {
      const errorText = await anthropicResponse.text();
      console.error('Claude API error:', errorText);
      return NextResponse.json(
        { error: 'AI service error', details: errorText },
        { status: anthropicResponse.status }
      );
    }

    const anthropicData = await anthropicResponse.json();
    const reply = anthropicData.content[0].text;

    return NextResponse.json({
      reply,
      contextUsed: {
        postCount: posts.length,
        timeRangeHours: hours,
      },
    });
  } catch (error) {
    console.error('Error in social media chat:', error);
    return NextResponse.json(
      { error: 'Failed to process chat request', details: String(error) },
      { status: 500 }
    );
  }
}

