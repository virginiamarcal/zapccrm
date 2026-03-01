/**
 * Database Schema Types — Story 1.1 Multi-Tenant
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
// Database Client Types
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
 * - Updated Database type definitions
 */
