/**
 * Keywords Configuration API — Story 2.4
 *
 * GET: Retrieve all keywords for organization
 * POST: Create new keyword configuration
 * PUT: Update keyword
 * DELETE: Remove keyword
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import type { UUID } from '@/lib/db/schema';
import { KeywordMatcher } from '@/lib/bridge/keyword-matcher';
import { bridgeLogger } from '@/lib/bridge/logger';

const orgId = (process.env.DEFAULT_ORG_ID || 'default-org') as UUID;

/**
 * GET /api/keywords
 * Retrieve all keyword configurations
 */
export async function GET(request: NextRequest) {
  try {
    const keywordMatcher = new KeywordMatcher(orgId);

    const keywords = keywordMatcher.getKeywords();
    const stats = keywordMatcher.getStats();

    return NextResponse.json(
      {
        success: true,
        data: keywords,
        stats,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Keywords retrieval failed:', error);
    bridgeLogger.logSyncFailure(
      'KeywordsAPI',
      orgId,
      'get_keywords_failed',
      error as Error
    );

    return NextResponse.json(
      { error: 'Failed to retrieve keywords' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/keywords
 * Create new keyword configuration
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      keyword,
      board_id,
      stage_id,
      enabled,
    } = body;

    if (!keyword || !board_id || !stage_id) {
      return NextResponse.json(
        {
          error: 'keyword, board_id, and stage_id are required',
        },
        { status: 400 }
      );
    }

    const keywordMatcher = new KeywordMatcher(orgId);

    const newKeyword = {
      id: `kw-${Date.now()}` as UUID,
      org_id: orgId,
      keyword,
      board_id,
      stage_id,
      enabled: enabled !== false,
      created_at: new Date().toISOString(),
    };

    keywordMatcher.addKeyword(newKeyword);

    return NextResponse.json(
      {
        success: true,
        data: newKeyword,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Keyword creation failed:', error);
    bridgeLogger.logSyncFailure(
      'KeywordsAPI',
      orgId,
      'create_keyword_failed',
      error as Error
    );

    return NextResponse.json(
      { error: 'Failed to create keyword' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/keywords?id=xxx
 * Update keyword configuration
 */
export async function PUT(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const keywordId = searchParams.get('id') as UUID;

    if (!keywordId) {
      return NextResponse.json(
        { error: 'id parameter is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const keywordMatcher = new KeywordMatcher(orgId);

    keywordMatcher.updateKeyword(keywordId, body);
    const keywords = keywordMatcher.getKeywords();
    const updated = keywords.find((k) => k.id === keywordId);

    if (!updated) {
      return NextResponse.json(
        { error: 'Keyword not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: updated,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Keyword update failed:', error);
    bridgeLogger.logSyncFailure(
      'KeywordsAPI',
      orgId,
      'update_keyword_failed',
      error as Error
    );

    return NextResponse.json(
      { error: 'Failed to update keyword' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/keywords?id=xxx
 * Remove keyword configuration
 */
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const keywordId = searchParams.get('id') as UUID;

    if (!keywordId) {
      return NextResponse.json(
        { error: 'id parameter is required' },
        { status: 400 }
      );
    }

    const keywordMatcher = new KeywordMatcher(orgId);
    keywordMatcher.removeKeyword(keywordId);

    return NextResponse.json(
      {
        success: true,
        message: 'Keyword deleted',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Keyword deletion failed:', error);
    bridgeLogger.logSyncFailure(
      'KeywordsAPI',
      orgId,
      'delete_keyword_failed',
      error as Error
    );

    return NextResponse.json(
      { error: 'Failed to delete keyword' },
      { status: 500 }
    );
  }
}
