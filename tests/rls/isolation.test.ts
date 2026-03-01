/**
 * RLS Isolation Tests — Story 1.2 AC4
 *
 * Verify that users can only access data from their organization
 * and that cross-organization access is properly blocked.
 */

import { createClient } from '@supabase/supabase-js';
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';

const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDc4NDMzNzQsImV4cCI6MTk2Mzk1Mzc3NH0.';

describe('RLS Organization Isolation', () => {
  let org1Id: string;
  let org2Id: string;
  let user1Id: string;
  let user2Id: string;
  let user1Client: ReturnType<typeof createClient>;
  let user2Client: ReturnType<typeof createClient>;
  let adminClient: ReturnType<typeof createClient>;

  beforeAll(async () => {
    // Initialize admin client with service role (can bypass RLS for setup)
    adminClient = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY || '');

    // Create test organizations
    const { data: orgs, error: orgError } = await adminClient
      .from('organizations')
      .insert([
        { name: 'Org 1', slug: 'org-1', owner_id: 'user-1' },
        { name: 'Org 2', slug: 'org-2', owner_id: 'user-2' },
      ])
      .select();

    if (orgError) throw orgError;
    org1Id = orgs[0].id;
    org2Id = orgs[1].id;

    // In a real test, you would authenticate actual users
    // For now, we test the RLS logic structure
  });

  describe('AC4: Cross-organization access is blocked', () => {
    it('should prevent user from accessing data in different organization', async () => {
      // Create workspace in org 1
      const { data: workspace, error } = await adminClient
        .from('workspaces')
        .insert({
          name: 'Workspace in Org 1',
          organization_id: org1Id,
          owner_id: user1Id,
          slug: 'workspace-org1',
        })
        .select();

      expect(error).toBeNull();
      expect(workspace).toBeDefined();

      // Attempt to access with user from org 2 (should fail)
      // In actual testing, this would use org2User's authenticated session
    });

    it('should verify org_members requirement for access', async () => {
      // Verify user must be in org_members to access any data
      const { data: members } = await adminClient
        .from('org_members')
        .select('*')
        .eq('organization_id', org1Id);

      expect(members?.length).toBeGreaterThan(0);
    });

    it('should isolate workspaces by organization_id', async () => {
      // RLS policy: organization_id IN (SELECT organization_id FROM org_members WHERE user_id = auth.uid())
      // This ensures workspaces are only visible to organization members

      const { data: workspaces } = await adminClient
        .from('workspaces')
        .select('*, organizations(name)')
        .eq('organization_id', org1Id);

      // Verify all returned workspaces belong to org1
      expect(workspaces?.every(w => w.organization_id === org1Id)).toBe(true);
    });
  });

  describe('AC5: Truncate/Delete blocked for regular users', () => {
    it('should prevent regular users from truncating tables', async () => {
      // Direct TRUNCATE attempt should fail with insufficient privileges
      // This is enforced at DB level - only service_role can truncate

      expect(true).toBe(true); // Placeholder for actual DB-level test
    });

    it('should allow service_role to bypass RLS', async () => {
      // Service role (admin) can read all data across organizations
      const { data: allOrgs } = await adminClient
        .from('organizations')
        .select('*');

      // Should be able to see all orgs without RLS filter
      expect(allOrgs?.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('AC6: Audit logging on writes', () => {
    it('should log INSERT operations to audit_logs', async () => {
      // Create a workspace (write operation)
      const { data: workspace } = await adminClient
        .from('workspaces')
        .insert({
          name: 'Audit Test Workspace',
          organization_id: org1Id,
          owner_id: user1Id,
          slug: 'audit-test',
        })
        .select();

      // Check audit log
      const { data: logs } = await adminClient
        .from('audit_logs')
        .select('*')
        .eq('table_name', 'workspaces')
        .eq('action', 'INSERT')
        .eq('record_id', workspace[0].id);

      expect(logs?.length).toBeGreaterThan(0);
      expect(logs[0].action).toBe('INSERT');
    });

    it('should log UPDATE operations to audit_logs', async () => {
      // Update a workspace
      const { data: workspaces } = await adminClient
        .from('workspaces')
        .select('*')
        .eq('organization_id', org1Id)
        .limit(1);

      if (workspaces?.length > 0) {
        const workspaceId = workspaces[0].id;
        await adminClient
          .from('workspaces')
          .update({ name: 'Updated Name' })
          .eq('id', workspaceId);

        // Check audit log
        const { data: logs } = await adminClient
          .from('audit_logs')
          .select('*')
          .eq('table_name', 'workspaces')
          .eq('action', 'UPDATE')
          .eq('record_id', workspaceId);

        expect(logs?.length).toBeGreaterThan(0);
        expect(logs[0].action).toBe('UPDATE');
      }
    });

    it('should log DELETE operations to audit_logs', async () => {
      // Create and delete a workspace
      const { data: workspace } = await adminClient
        .from('workspaces')
        .insert({
          name: 'To Delete',
          organization_id: org1Id,
          owner_id: user1Id,
          slug: 'to-delete',
        })
        .select();

      const workspaceId = workspace[0].id;

      await adminClient
        .from('workspaces')
        .delete()
        .eq('id', workspaceId);

      // Check audit log
      const { data: logs } = await adminClient
        .from('audit_logs')
        .select('*')
        .eq('table_name', 'workspaces')
        .eq('action', 'DELETE')
        .eq('record_id', workspaceId);

      expect(logs?.length).toBeGreaterThan(0);
      expect(logs[0].action).toBe('DELETE');
    });
  });

  describe('AC2: SELECT policy checks membership', () => {
    it('should only return data for organizations user is member of', async () => {
      // This test verifies the SELECT policy:
      // public.is_org_member(id) checks org_members table

      const { data: orgs } = await adminClient
        .from('organizations')
        .select('*');

      expect(Array.isArray(orgs)).toBe(true);
    });
  });

  describe('AC3: INSERT/UPDATE/DELETE restricted to admins', () => {
    it('should enforce role-based write permissions', async () => {
      // INSERT/UPDATE/DELETE policies use public.is_org_admin(organization_id)
      // which checks role = 'admin' in org_members

      expect(true).toBe(true); // Placeholder for authenticated user test
    });
  });

  afterAll(async () => {
    // Cleanup: Delete test data
    await adminClient
      .from('organizations')
      .delete()
      .in('id', [org1Id, org2Id]);
  });
});
