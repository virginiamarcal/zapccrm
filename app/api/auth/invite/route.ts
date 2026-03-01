/**
 * POST /api/auth/invite — Story 1.3 AC1, AC2
 *
 * Create team invitation token and send email invite.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import inviteService from '@/lib/auth/invite-service';
import { createInviteEmail } from '@/lib/emails/invite-email';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

interface InviteRequest {
  organizationId: string;
  email: string;
  role?: 'admin' | 'member' | 'viewer';
}

/**
 * POST: Create invite and send email
 */
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: user, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body: InviteRequest = await request.json();
    const { organizationId, email, role = 'member' } = body;

    // Validate email format
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    // Verify user is org admin
    const { data: member } = await supabase
      .from('org_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single();

    if (!member || member.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only administrators can send invitations' },
        { status: 403 }
      );
    }

    // Get organization details
    const { data: org } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', organizationId)
      .single();

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Get inviter details
    const { data: inviterUser } = await supabase
      .from('users')
      .select('full_name, email')
      .eq('id', user.id)
      .single();

    const inviterName = inviterUser?.full_name || inviterUser?.email || 'A team member';

    // Create invitation
    const { token: inviteToken, expiresAt } = await inviteService.createInvite(
      organizationId,
      email,
      role,
      user.id
    );

    // Generate invite link
    const baseUrl = request.headers.get('x-base-url') || 'http://localhost:3000';
    const inviteLink = inviteService.generateInviteLink(inviteToken, baseUrl);

    // Send email (using mock sendEmail for now)
    const emailContent = createInviteEmail({
      organizationName: org.name,
      inviterName,
      inviteLink,
      recipientEmail: email,
      role,
      expiresInDays: 7,
    });

    // TODO: Integrate with email service (SendGrid, Resend, etc.)
    console.log('📧 Invite email to send:', {
      to: emailContent.to,
      subject: emailContent.subject,
      // Don't log full content
    });

    return NextResponse.json(
      {
        success: true,
        message: `Invitation sent to ${email}`,
        invitation: {
          email,
          role,
          expiresAt: expiresAt.toISOString(),
          sentAt: new Date().toISOString(),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Failed to create invitation:', error);
    return NextResponse.json(
      {
        error: 'Failed to create invitation',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
