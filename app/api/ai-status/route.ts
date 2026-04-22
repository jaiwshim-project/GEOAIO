import { NextRequest, NextResponse } from 'next/server';
import { getGeminiKey, getClaudeKey, withCors, corsOptionsResponse } from '@/lib/api-auth';

export async function OPTIONS() {
  return corsOptionsResponse();
}

export async function GET(request: NextRequest) {
  try {
    const geminiKey = getGeminiKey(request);
    const claudeKey = getClaudeKey(request);

    const status = {
      hasGeminiKey: !!geminiKey,
      hasClaudeKey: !!claudeKey,
      geminiKeyPrefix: geminiKey ? `${geminiKey.slice(0, 10)}...` : null,
      claudeKeyPrefix: claudeKey ? `${claudeKey.slice(0, 10)}...` : null,
    };

    return withCors(NextResponse.json(status));
  } catch (error) {
    return withCors(NextResponse.json({ error: 'Failed to check API status' }, { status: 500 }));
  }
}
