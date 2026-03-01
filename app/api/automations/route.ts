/**
 * Automations Configuration API — Story 2.5
 *
 * GET: Retrieve all automation configurations
 * POST: Create new automation
 * PUT: Update automation
 * DELETE: Remove automation
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import type { UUID } from '@/lib/db/schema';
import { AutomationTrigger } from '@/lib/bridge/automation-trigger';
import { bridgeLogger } from '@/lib/bridge/logger';

const orgId = (process.env.DEFAULT_ORG_ID || 'default-org') as UUID;

/**
 * GET /api/automations
 * Retrieve all automation configurations
 */
export async function GET(request: NextRequest) {
  try {
    const trigger = new AutomationTrigger({ orgId });

    const automations = trigger.getAutomations();
    const stats = trigger.getStats();

    return NextResponse.json(
      {
        success: true,
        data: automations,
        stats,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Automations retrieval failed:', error);
    bridgeLogger.logSyncFailure(
      'AutomationsAPI',
      orgId,
      'get_automations_failed',
      error as Error
    );

    return NextResponse.json(
      { error: 'Failed to retrieve automations' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/automations
 * Create new automation configuration
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { stage_id, template_id, enabled } = body;

    if (!stage_id || !template_id) {
      return NextResponse.json(
        {
          error: 'stage_id and template_id are required',
        },
        { status: 400 }
      );
    }

    const trigger = new AutomationTrigger({ orgId });

    const automation = await trigger.createAutomation({
      eventType: 'stage_changed',
      stageId: stage_id,
      templateId: template_id,
      enabled: enabled !== false,
    });

    return NextResponse.json(
      {
        success: true,
        data: automation,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Automation creation failed:', error);
    bridgeLogger.logSyncFailure(
      'AutomationsAPI',
      orgId,
      'create_automation_failed',
      error as Error
    );

    return NextResponse.json(
      { error: 'Failed to create automation' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/automations?id=xxx
 * Update automation configuration
 */
export async function PUT(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const automationId = searchParams.get('id') as UUID;

    if (!automationId) {
      return NextResponse.json(
        { error: 'id parameter is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const trigger = new AutomationTrigger({ orgId });

    const updated = trigger.updateAutomation(automationId, body);

    if (!updated) {
      return NextResponse.json(
        { error: 'Automation not found' },
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
    console.error('Automation update failed:', error);
    bridgeLogger.logSyncFailure(
      'AutomationsAPI',
      orgId,
      'update_automation_failed',
      error as Error
    );

    return NextResponse.json(
      { error: 'Failed to update automation' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/automations?id=xxx
 * Remove automation configuration
 */
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const automationId = searchParams.get('id') as UUID;

    if (!automationId) {
      return NextResponse.json(
        { error: 'id parameter is required' },
        { status: 400 }
      );
    }

    const trigger = new AutomationTrigger({ orgId });
    const deleted = trigger.deleteAutomation(automationId);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Automation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Automation deleted',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Automation deletion failed:', error);
    bridgeLogger.logSyncFailure(
      'AutomationsAPI',
      orgId,
      'delete_automation_failed',
      error as Error
    );

    return NextResponse.json(
      { error: 'Failed to delete automation' },
      { status: 500 }
    );
  }
}
