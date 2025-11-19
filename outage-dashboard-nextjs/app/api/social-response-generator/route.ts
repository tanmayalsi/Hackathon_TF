import { NextRequest, NextResponse } from 'next/server';
import { loadSocialMediaData } from '@/lib/social-data-loader';
import type { ResponseGeneratorRequest } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body: ResponseGeneratorRequest = await request.json();
    const { postIds, tone = 'professional', template } = body;

    if (!postIds || postIds.length === 0) {
      return NextResponse.json(
        { error: 'Post IDs are required' },
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

    console.log(`Generating responses for ${postIds.length} posts with tone: ${tone}`);

    // Load all data from CSV and filter by IDs
    const allData = loadSocialMediaData();
    const posts = allData.filter((post) => postIds.includes(post.id));

    if (posts.length === 0) {
      return NextResponse.json(
        { error: 'No posts found with provided IDs' },
        { status: 404 }
      );
    }

    console.log(`Found ${posts.length} posts to generate responses for`);

    // Build context for each post
    const postsContext = posts.map((post) => {
      return `Post ID ${post.id}:
Platform: ${post.social_media}
Category: ${post.category}
Location: ${post.location}
User: @${post.username}
Timestamp: ${post.timestamp}
Comment: "${post.comment}"`;
    }).join('\n\n---\n\n');

    // Tone descriptions
    const toneGuides = {
      professional: 'Maintain a professional, corporate tone. Be polite, clear, and solution-oriented.',
      empathetic: 'Show empathy and understanding. Acknowledge the customer\'s feelings and frustration. Be warm and compassionate.',
      promotional: 'Be enthusiastic and highlight benefits. Focus on positive aspects and opportunities.',
    };

    const systemPrompt = `You are a social media manager for a telecom company, crafting responses to customer posts.

Tone: ${tone} - ${toneGuides[tone]}

Guidelines:
1. Keep responses concise (2-4 sentences, max 280 characters for Twitter)
2. Always be respectful and professional
3. For complaints: Acknowledge the issue, apologize if appropriate, offer next steps
4. For inquiries: Provide helpful information or direct them to resources
5. For positive feedback: Thank them genuinely
6. For service issues: Express concern and provide support contact or timeline
7. Use appropriate platform style (Twitter: brief, Reddit: more detailed, Facebook: friendly)
8. Include relevant hashtags or @mentions when appropriate
9. Never make promises you can't keep
10. Always offer a way to continue the conversation privately for account-specific issues

${template ? `Template/Additional Instructions: ${template}` : ''}

For each post below, generate an appropriate public response. Return your responses in JSON format:
[
  {
    "postId": number,
    "response": "your response text here"
  }
]

Here are the posts to respond to:

${postsContext}

Return ONLY the JSON array, no additional text or markdown.`;

    // Call Claude API
    console.log('Calling Claude API for response generation...');
    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 3072,
        temperature: 0.8,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: 'Please generate appropriate social media responses for these posts in JSON format.',
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
    let generatedResponses;
    try {
      // Try to extract JSON if wrapped in markdown or other text
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        generatedResponses = JSON.parse(jsonMatch[0]);
      } else {
        generatedResponses = JSON.parse(responseText);
      }
    } catch (parseError) {
      console.error('Failed to parse Claude response as JSON:', parseError);
      console.error('Response text:', responseText);
      return NextResponse.json(
        { error: 'Failed to parse AI response', details: String(parseError) },
        { status: 500 }
      );
    }

    // Map responses to posts with full context
    const responses = generatedResponses.map((item: any) => {
      const post = posts.find((p) => p.id === item.postId);
      return {
        postId: item.postId,
        originalComment: post?.comment || '',
        draftResponse: item.response,
        tone,
      };
    });

    return NextResponse.json({
      responses,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error generating responses:', error);
    return NextResponse.json(
      { error: 'Failed to generate responses', details: String(error) },
      { status: 500 }
    );
  }
}

