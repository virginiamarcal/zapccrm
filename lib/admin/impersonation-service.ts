/**
 * Impersonation Service — Story 1.5 AC3
 *
 * Allows super admins to impersonate org members for debugging.
 * Logs all impersonation actions to audit log.
 */

import { createClient } from '@supabase/supabase-js';
import { UUID } from '@/lib/db/schema';

interface ImpersonationSession {
  id: UUID;
  superAdminId: UUID;
  organizationId: UUID;
  impersonatedUserId: UUID;
  startedAt: Date;
  endedAt?: Date;
  reason?: string;
}

export class ImpersonationService {
  private supabase: ReturnType<typeof createClient>;

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );
  }

  /**
   * AC3: Start impersonation session
   * AC4: Audit log all super admin actions
   * AC5: Restrict to super_admin users
   */
  async startImpersonation(
    superAdminId: UUID,
    organizationId: UUID,
    targetUserId: UUID,
    reason?: string
  ): Promise<ImpersonationSession> {
    // Verify super admin status
    const { data: superAdmin } = await this.supabase
      .from('users')
      .select('is_super_admin')
      .eq('id', superAdminId)
      .single();

    if (!superAdmin?.is_super_admin) {
      throw new Error('Only super admins can impersonate users');
    }

    // Cannot impersonate another super admin
    const { data: targetUser } = await this.supabase
      .from('users')
      .select('is_super_admin')
      .eq('id', targetUserId)
      .single();

    if (targetUser?.is_super_admin) {
      throw new Error('Cannot impersonate other super admins');
    }

    // Verify target is member of organization
    const { data: member } = await this.supabase
      .from('org_members')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('user_id', targetUserId)
      .single();

    if (!member) {
      throw new Error('Target user is not a member of this organization');
    }

    // Create impersonation session record
    const { data: session, error } = await this.supabase
      .from('impersonation_sessions')
      .insert({
        super_admin_id: superAdminId,
        organization_id: organizationId,
        impersonated_user_id: targetUserId,
        reason,
        started_at: new Date(),
      })
      .select()
      .single();

    if (error) throw error;

    // Log to audit table
    await this.logAuditEvent(
      organizationId,
      superAdminId,
      'IMPERSONATION_START',
      'impersonation_sessions',
      session.id,
      {
        target_user_id: targetUserId,
        reason,
      }
    );

    return {
      id: session.id,
      superAdminId,
      organizationId,
      impersonatedUserId: targetUserId,
      startedAt: new Date(session.started_at),
      reason,
    };
  }

  /**
   * End impersonation session and log the event
   */
  async endImpersonation(sessionId: UUID, superAdminId: UUID): Promise<void> {
    const { data: session } = await this.supabase
      .from('impersonation_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (!session) {
      throw new Error('Session not found');
    }

    if (session.super_admin_id !== superAdminId) {
      throw new Error('Can only end own impersonation sessions');
    }

    // Update session
    const { error } = await this.supabase
      .from('impersonation_sessions')
      .update({ ended_at: new Date() })
      .eq('id', sessionId);

    if (error) throw error;

    // Log event
    await this.logAuditEvent(
      session.organization_id,
      superAdminId,
      'IMPERSONATION_END',
      'impersonation_sessions',
      sessionId,
      {
        duration_minutes: Math.round(
          (new Date().getTime() - new Date(session.started_at).getTime()) / 60000
        ),
      }
    );
  }

  /**
   * Get active impersonation sessions
   */
  async getActiveImpersonations(superAdminId: UUID) {
    const { data } = await this.supabase
      .from('impersonation_sessions')
      .select('*')
      .eq('super_admin_id', superAdminId)
      .is('ended_at', null);

    return data || [];
  }

  /**
   * AC4: Log all super admin actions
   */
  private async logAuditEvent(
    organizationId: UUID,
    userId: UUID,
    action: string,
    tableName: string,
    recordId: UUID,
    changes: Record<string, any>
  ): Promise<void> {
    const { error } = await this.supabase.from('audit_logs').insert({
      organization_id: organizationId,
      user_id: userId,
      action,
      table_name: tableName,
      record_id: recordId,
      changes,
      timestamp: new Date(),
    });

    if (error) {
      console.error('Failed to log audit event:', error);
    }
  }

  /**
   * Get audit log for super admin actions
   */
  async getAuditLog(organizationId: UUID, options?: { limit?: number; offset?: number }) {
    const limit = options?.limit || 50;
    const offset = options?.offset || 0;

    const { data } = await this.supabase
      .from('audit_logs')
      .select('*')
      .eq('organization_id', organizationId)
      .order('timestamp', { ascending: false })
      .range(offset, offset + limit - 1);

    return data || [];
  }
}

export default new ImpersonationService();
