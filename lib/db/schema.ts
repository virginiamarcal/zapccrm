/**
 * Database Schema Types — Story 1.1 Multi-Tenant & Story 1.2 RLS
 *
 * Auto-generated TypeScript definitions for Supabase schema.
 * Update this when schema changes.
 */

export type UUID = string;
export type Timestamp = string; // ISO 8601

// ============================================================================
// Organizations (Story 1.1)
// ============================================================================

export interface Organization {
  id: UUID;
  name: string;
  slug: string;
  owner_id: UUID;
  logo_url?: string;
  description?: string;
  settings: Record<string, any>;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export type CreateOrganizationInput = Omit<
  Organization,
  'id' | 'created_at' | 'updated_at'
>;

export type UpdateOrganizationInput = Partial<
  Omit<Organization, 'id' | 'owner_id' | 'created_at' | 'updated_at'>
>;

// ============================================================================
// Users (Extends auth.users)
// ============================================================================

export interface User {
  id: UUID;
  email: string;
  full_name?: string;
  avatar_url?: string;
  role: 'admin' | 'user' | 'guest';
  organization_id?: UUID; // NEW: Story 1.1
  created_at: Timestamp;
  updated_at: Timestamp;
}

export type CreateUserInput = Omit<
  User,
  'id' | 'created_at' | 'updated_at'
>;

export type UpdateUserInput = Partial<
  Omit<User, 'id' | 'email' | 'created_at' | 'updated_at'>
>;

// ============================================================================
// Workspaces
// ============================================================================

export interface Workspace {
  id: UUID;
  name: string;
  owner_id: UUID;
  slug: string;
  logo_url?: string;
  organization_id?: UUID; // NEW: Story 1.1
  created_at: Timestamp;
  updated_at: Timestamp;
}

export type CreateWorkspaceInput = Omit<
  Workspace,
  'id' | 'created_at' | 'updated_at'
>;

export type UpdateWorkspaceInput = Partial<
  Omit<Workspace, 'id' | 'owner_id' | 'created_at' | 'updated_at'>
>;

// ============================================================================
// Organization Members (Story 1.2 & 1.3 - RLS & Auth)
// ============================================================================

export interface OrganizationMember {
  id: UUID;
  organization_id: UUID;
  user_id: UUID;
  role: 'admin' | 'member' | 'viewer';
  invited_by?: UUID;
  joined_at: Timestamp;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export type CreateOrganizationMemberInput = Omit<
  OrganizationMember,
  'id' | 'joined_at' | 'created_at' | 'updated_at'
>;

export type UpdateOrganizationMemberInput = Partial<
  Omit<OrganizationMember, 'id' | 'organization_id' | 'user_id' | 'created_at' | 'updated_at'>
>;

// ============================================================================
// Audit Logs (Story 1.2 - RLS Compliance)
// ============================================================================

export interface AuditLog {
  id: UUID;
  organization_id: UUID;
  user_id?: UUID;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  table_name: string;
  record_id?: UUID;
  changes: Record<string, any>;
  timestamp: Timestamp;
}

export type CreateAuditLogInput = Omit<AuditLog, 'id' | 'timestamp'>;

// ============================================================================
// Database Client Types (with RLS)
// ============================================================================

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: Organization;
        Insert: CreateOrganizationInput;
        Update: UpdateOrganizationInput;
      };
      users: {
        Row: User;
        Insert: CreateUserInput;
        Update: UpdateUserInput;
      };
      workspaces: {
        Row: Workspace;
        Insert: CreateWorkspaceInput;
        Update: UpdateWorkspaceInput;
      };
      org_members: {
        Row: OrganizationMember;
        Insert: CreateOrganizationMemberInput;
        Update: UpdateOrganizationMemberInput;
      };
      audit_logs: {
        Row: AuditLog;
        Insert: CreateAuditLogInput;
        Update: never;
      };
    };
    Functions: {
      is_org_member: {
        Args: { org_id: UUID };
        Returns: boolean;
      };
      is_org_admin: {
        Args: { org_id: UUID };
        Returns: boolean;
      };
      get_user_organizations: {
        Args: Record<string, never>;
        Returns: UUID[];
      };
    };
  };
}

// ============================================================================
// Helper Types
// ============================================================================

export type OrganizationWithOwner = Organization & {
  owner: User;
};

export type WorkspaceWithOrganization = Workspace & {
  organization: Organization;
};

/**
 * Changelog
 *
 * 2026-03-01 (@dev Dex)
 * - Added Organization interface (Story 1.1)
 * - Added organization_id to User and Workspace (Story 1.1)
 * - Added OrganizationMember interface with role-based access (Story 1.2/1.3)
 * - Added AuditLog interface for compliance logging (Story 1.2)
 * - Added is_org_member(), is_org_admin(), get_user_organizations() functions (Story 1.2)
 * - Updated Database type definitions with RLS helpers
 */
