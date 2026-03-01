/**
 * Invite Service — Story 1.3 AC1, AC2
 *
 * Manages team invitation tokens, validation, and acceptance workflow.
 */

import { createClient } from '@supabase/supabase-js';
import * as jwt from 'jsonwebtoken';
import { UUID } from '@/lib/db/schema';

interface InvitePayload {
  invite_id: string;
  org_id: UUID;
  email: string;
  role: 'admin' | 'member' | 'viewer';
  invited_at: number;
}

export class InviteService {
  private supabase: ReturnType<typeof createClient>;
  private jwtSecret: string;
  private tokenExpireDays = 7;

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );
    this.jwtSecret = process.env.JWT_SECRET || 'dev-secret-key';
  }

  /**
   * AC1: Create invitation token with 7-day expiration
   */
  async createInvite(
    organizationId: UUID,
    email: string,
    role: 'admin' | 'member' | 'viewer' = 'member',
    invitedBy: UUID
  ): Promise<{ token: string; expiresAt: Date }> {
    // Check for duplicate pending invites
    const { data: existing } = await this.supabase
      .from('org_invites')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('email', email)
      .eq('status', 'pending')
      .limit(1);

    if (existing && existing.length > 0) {
      throw new Error(`Invitation already pending for ${email}`);
    }

    // Create invite record
    const { data: invite, error: inviteError } = await this.supabase
      .from('org_invites')
      .insert({
        organization_id: organizationId,
        email,
        role,
        invited_by: invitedBy,
        status: 'pending',
        expires_at: new Date(Date.now() + this.tokenExpireDays * 24 * 60 * 60 * 1000),
      })
      .select()
      .single();

    if (inviteError) throw inviteError;

    // Generate JWT token
    const payload: InvitePayload = {
      invite_id: invite.id,
      org_id: organizationId,
      email,
      role,
      invited_at: Date.now(),
    };

    const token = jwt.sign(payload, this.jwtSecret, {
      expiresIn: `${this.tokenExpireDays}d`,
    });

    return {
      token,
      expiresAt: new Date(Date.now() + this.tokenExpireDays * 24 * 60 * 60 * 1000),
    };
  }

  /**
   * AC2: Generate invite link for email
   */
  generateInviteLink(token: string, baseUrl = 'http://localhost:3000'): string {
    return `${baseUrl}/join?token=${encodeURIComponent(token)}`;
  }

  /**
   * AC3: Validate token and return invite details
   */
  async validateInviteToken(token: string): Promise<InvitePayload> {
    try {
      const payload = jwt.verify(token, this.jwtSecret) as InvitePayload;

      // Check if invite still exists and is not expired in DB
      const { data: invite, error } = await this.supabase
        .from('org_invites')
        .select('*')
        .eq('id', payload.invite_id)
        .eq('status', 'pending')
        .single();

      if (error || !invite) {
        throw new Error('Invalid or expired invitation');
      }

      // Check expiration date
      if (new Date(invite.expires_at) < new Date()) {
        throw new Error('Invitation has expired');
      }

      return payload;
    } catch (error) {
      throw new Error(`Invalid token: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * AC3: Accept invitation and create user + org_member record
   */
  async acceptInvite(
    token: string,
    userId: UUID,
    email: string
  ): Promise<{
    organizationId: UUID;
    role: string;
  }> {
    const payload = await this.validateInviteToken(token);

    // Verify email matches
    if (payload.email.toLowerCase() !== email.toLowerCase()) {
      throw new Error('Email does not match invitation');
    }

    // Create org_member record
    const { data: member, error: memberError } = await this.supabase
      .from('org_members')
      .insert({
        organization_id: payload.org_id,
        user_id: userId,
        role: payload.role,
        invited_by: null,
        joined_at: new Date(),
      })
      .select()
      .single();

    if (memberError) {
      throw new Error(`Failed to create membership: ${memberError.message}`);
    }

    // Mark invite as accepted
    const { error: updateError } = await this.supabase
      .from('org_invites')
      .update({ status: 'accepted', accepted_at: new Date() })
      .eq('id', payload.invite_id);

    if (updateError) {
      console.error('Failed to mark invite as accepted:', updateError);
    }

    return {
      organizationId: payload.org_id,
      role: payload.role,
    };
  }

  /**
   * AC6: Revoke expired invites (cleanup job)
   */
  async revokeExpiredInvites(): Promise<number> {
    const { data, error } = await this.supabase
      .from('org_invites')
      .update({ status: 'expired' })
      .eq('status', 'pending')
      .lt('expires_at', new Date().toISOString())
      .select();

    if (error) {
      throw new Error(`Failed to revoke expired invites: ${error.message}`);
    }

    return data?.length || 0;
  }

  /**
   * Get pending invites for an organization
   */
  async getPendingInvites(organizationId: UUID) {
    const { data, error } = await this.supabase
      .from('org_invites')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Revoke a specific pending invite
   */
  async revokeInvite(inviteId: UUID): Promise<void> {
    const { error } = await this.supabase
      .from('org_invites')
      .update({ status: 'revoked' })
      .eq('id', inviteId);

    if (error) throw error;
  }
}

export default new InviteService();
