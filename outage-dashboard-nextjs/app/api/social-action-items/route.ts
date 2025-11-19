import { NextRequest, NextResponse } from 'next/server';
import { loadSocialMediaData } from '@/lib/social-data-loader';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { hours = 168 } = body; // Default 7 days

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error('ANTHROPIC_API_KEY not configured');
      return NextResponse.json(
        { error: 'AI service not configured' },
        { status: 500 }
      );
    }

    const timeFilter = new Date(Date.now() - hours * 60 * 60 * 1000);

    console.log(`Generating action items for posts since ${timeFilter.toISOString()}`);

    // Load all data from CSV and filter
    const allData = loadSocialMediaData();
    const posts = allData
      .filter((post) => new Date(post.timestamp) >= timeFilter)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 200); // Limit to most recent 200 posts for analysis

    console.log(`Analyzing ${posts.length} posts for action items`);

    // Build context for Claude
    const postsSummary = posts.map((post, idx) => {
      return `Post ${idx + 1} (ID: ${post.id}, Platform: ${post.social_media}, Location: ${post.location}, Category: ${post.category}, Time: ${post.timestamp}):
User @${post.username}: "${post.comment}"`;
    }).join('\n\n');

    const systemPrompt = `You are an AI assistant helping a telecom company analyze social media feedback to generate actionable items for different departments.

You have access to ${posts.length} social media posts from the last ${Math.round(hours / 24)} days across Twitter, Reddit, and Facebook.

Your task is to:
1. Identify the most important issues, opportunities, and concerns
2. Group similar issues together
3. Prioritize them by urgency and impact
4. Assign each to the appropriate department (Sales, Support, PR, or Tech)
5. Provide clear, actionable titles and descriptions

Priority levels:
- urgent: Critical issues affecting many customers or PR crises (< 5% of items)
- high: Important issues requiring prompt attention (10-20% of items)
- medium: Standard issues that should be addressed soon (40-50% of items)
- low: Minor issues or suggestions for future consideration (rest)

Departments:
- Sales: New customer inquiries, pricing questions, plan comparisons, upsell opportunities
- Support: Customer service complaints, account access issues, general assistance needed
- PR: Brand reputation, corporate criticism, customer sentiment management
- Tech: Service outages, network issues, technical problems, feature requests

Please analyze the posts and return a JSON array of action items with this exact structure:
[
  {
    "id": "unique-id-1",
    "title": "Brief title (max 60 chars)",
    "description": "Detailed description of the issue and recommended action (2-3 sentences)",
    "priority": "urgent|high|medium|low",
    "department": "Sales|Support|PR|Tech",
    "relatedPostIds": [list of post IDs]
  }
]

Aim for 8-15 action items total. Focus on the most impactful issues.

Here are the posts:

${postsSummary}

Return ONLY the JSON array, no additional text or markdown.`;

    // Call Claude API
    console.log('Calling Claude API for action items generation...');
    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        temperature: 0.7,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: 'Please analyze these social media posts and generate prioritized action items in JSON format.',
          },
        ],
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
    const responseText = anthropicData.content[0].text;

    // Parse JSON from response
    let actionItems;
    try {
      // Try to extract JSON if wrapped in markdown or other text
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        actionItems = JSON.parse(jsonMatch[0]);
      } else {
        actionItems = JSON.parse(responseText);
      }
    } catch (parseError) {
      console.error('Failed to parse Claude response as JSON:', parseError);
      console.error('Response text:', responseText);
      return NextResponse.json(
        { error: 'Failed to parse AI response', details: String(parseError) },
        { status: 500 }
      );
    }

    // Validate and enrich action items with actual post data
    const enrichedActionItems = actionItems.map((item: any) => {
      const relatedPosts = posts.filter((post) => item.relatedPostIds.includes(post.id));
      return {
        ...item,
        relatedPosts: relatedPosts.map((post) => ({
          id: post.id,
          username: post.username,
          social_media: post.social_media,
          comment: post.comment,
          location: post.location,
          timestamp: post.timestamp,
          category: post.category,
        })),
        status: 'pending',
      };
    });

    return NextResponse.json({
      actionItems: enrichedActionItems,
      generatedAt: new Date().toISOString(),
      postsAnalyzed: posts.length,
    });
  } catch (error) {
    console.error('Error generating action items:', error);
    return NextResponse.json(
      { error: 'Failed to generate action items', details: String(error) },
      { status: 500 }
    );
  }
}

