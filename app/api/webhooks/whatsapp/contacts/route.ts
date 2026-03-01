/**
 * WhatsApp Contacts Webhook Handler — Story 2.2
 *
 * Receives WhatsApp contact events and syncs to CRM.
 * Next.js API route handler.
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import type { UUID } from '@/lib/db/schema';
import { ContactSync } from '@/lib/bridge/contact-sync';
import { DuplicateDetector } from '@/lib/bridge/duplicate-detector';
import { bridgeLogger } from '@/lib/bridge/logger';

/**
 * Verify webhook signature (WhatsApp requires HMAC verification)
 */
function verifyWebhookSignature(
  request: NextRequest,
  payload: string
): boolean {
  try {
    const signature = request.headers.get('x-hub-signature-256');
    if (!signature) return false;

    // In production, verify HMAC signature against WhatsApp shared secret
    // const secret = process.env.WHATSAPP_WEBHOOK_SECRET;
    // const hmac = crypto
    //   .createHmac('sha256', secret)
    //   .update(payload)
    //   .digest('hex');
    // return signature === `sha256=${hmac}`;

    return true; // Stub for now
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return false;
  }
}

/**
 * Extract organization ID from webhook
 * In production, would determine from account_id or webhook context
 */
function getOrgIdFromWebhook(body: any): UUID | null {
  // Stub: would extract from WhatsApp business account context
  // return body.account_id || process.env.DEFAULT_ORG_ID;
  return process.env.DEFAULT_ORG_ID as UUID;
}

/**
 * Handle POST: receive webhook from WhatsApp
 */
export async function POST(request: NextRequest) {
  try {
    const payload = await request.text();
    const body = JSON.parse(payload);

    // Verify webhook signature
    if (!verifyWebhookSignature(request, payload)) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    const orgId = getOrgIdFromWebhook(body);
    if (!orgId) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 400 }
      );
    }

    // Initialize services
    const contactSync = new ContactSync({ orgId });
    const duplicateDetector = new DuplicateDetector({ orgId });

    // Extract contact from webhook payload
    // WhatsApp payload structure:
    // {
    //   entry: [{
    //     changes: [{
    //       value: {
    //         messages: [{ from: '...', text: {...}, ... }],
    //         contacts: [{ profile: { name: '...' }, wa_id: '...' }]
    //       }
    //     }]
    //   }]
    // }

    const contacts = body.entry?.[0]?.changes?.[0]?.value?.contacts || [];

    for (const whatsappContact of contacts) {
      try {
        // Sync contact
        const contact = await contactSync.syncContact({
          from: whatsappContact.wa_id,
          name: whatsappContact.profile?.name,
          whatsapp_id: whatsappContact.wa_id,
        });

        // Check for duplicates
        const duplicates = await duplicateDetector.findDuplicates({
          phone: contact.phone,
          email: contact.email,
          name: contact.name,
        });

        if (duplicates.length > 0) {
          bridgeLogger.logSyncSuccess(
            'WhatsAppContactsWebhook',
            orgId,
            'duplicates_detected',
            {
              contactId: contact.id,
              duplicateCount: duplicates.length,
            }
          );
        }

        // TODO: Emit contact.created event for downstream listeners
        // await eventBus.emit({
        //   type: 'contact.created',
        //   org_id: orgId,
        //   data: contact
        // });
      } catch (error) {
        bridgeLogger.logSyncFailure(
          'WhatsAppContactsWebhook',
          orgId,
          'sync_contact_failed',
          error as Error,
          { whatsappContact }
        );
      }
    }

    return NextResponse.json(
      { success: true, processed: contacts.length },
      { status: 200 }
    );
  } catch (error) {
    console.error('Webhook processing failed:', error);
    bridgeLogger.logSyncFailure(
      'WhatsAppContactsWebhook',
      process.env.DEFAULT_ORG_ID as UUID,
      'webhook_processing_error',
      error as Error
    );

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Handle GET: webhook verification from WhatsApp
 * WhatsApp calls GET to verify webhook is accessible
 */
export async function GET(request: NextRequest) {
  const hub_mode = request.nextUrl.searchParams.get('hub.mode');
  const hub_challenge = request.nextUrl.searchParams.get('hub.challenge');
  const hub_verify_token = request.nextUrl.searchParams.get('hub.verify_token');

  const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;

  if (hub_mode === 'subscribe' && hub_verify_token === verifyToken) {
    return NextResponse.text(hub_challenge, { status: 200 });
  }

  return NextResponse.json(
    { error: 'Invalid verify token' },
    { status: 403 }
  );
}
