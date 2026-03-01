/**
 * /settings/team — Team Management — Story 1.3 AC6
 *
 * Manage organization members, roles, and permissions.
 */

'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { UUID } from '@/lib/db/schema';

interface TeamMember {
  id: UUID;
  user_id: UUID;
  email: string;
  full_name?: string;
  role: 'admin' | 'member' | 'viewer';
  joined_at: string;
}

interface InvitePending {
  id: UUID;
  email: string;
  role: string;
  created_at: string;
  expires_at: string;
}

export default function TeamSettingsPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [pendingInvites, setPendingInvites] = useState<InvitePending[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'member' | 'viewer'>('member');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [orgId, setOrgId] = useState<string>('');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  );

  useEffect(() => {
    loadTeamData();
  }, []);

  async function loadTeamData() {
    try {
      setLoading(true);

      // Get current user
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        throw new Error('Not authenticated');
      }

      // Get user's organization (first one for now)
      const { data: orgMembers } = await supabase
        .from('org_members')
        .select('organization_id')
        .eq('user_id', userData.user.id)
        .limit(1);

      if (!orgMembers || orgMembers.length === 0) {
        setError('You are not a member of any organization');
        return;
      }

      const organizationId = orgMembers[0].organization_id;
      setOrgId(organizationId);

      // Load members
      const { data: membersData } = await supabase
        .from('org_members')
        .select(
          `
          id,
          user_id,
          role,
          joined_at,
          users!user_id(email, full_name)
        `
        )
        .eq('organization_id', organizationId)
        .order('joined_at', { ascending: false });

      if (membersData) {
        setMembers(
          membersData.map((m: any) => ({
            id: m.id,
            user_id: m.user_id,
            email: m.users.email,
            full_name: m.users.full_name,
            role: m.role,
            joined_at: m.joined_at,
          }))
        );
      }

      // Load pending invites
      const { data: invites } = await supabase
        .from('org_invites')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (invites) {
        setPendingInvites(invites);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load team data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSendInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail || !orgId) return;

    try {
      setInviteLoading(true);
      const { data: session } = await supabase.auth.getSession();

      const response = await fetch('/api/auth/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.session?.access_token}`,
          'X-Base-URL': window.location.origin,
        },
        body: JSON.stringify({
          organizationId: orgId,
          email: inviteEmail,
          role: inviteRole,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send invitation');
      }

      // Reset form and reload
      setInviteEmail('');
      setInviteRole('member');
      loadTeamData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invitation');
    } finally {
      setInviteLoading(false);
    }
  }

  async function handleRemoveMember(memberId: UUID) {
    if (!confirm('Are you sure you want to remove this member?')) return;

    try {
      const response = await fetch(`/api/team/members/${memberId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to remove member');
      }

      loadTeamData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove member');
    }
  }

  async function handleRevokeInvite(inviteId: UUID) {
    if (!confirm('Are you sure you want to revoke this invitation?')) return;

    try {
      const response = await fetch(`/api/auth/invite/${inviteId}/revoke`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to revoke invitation');
      }

      loadTeamData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke invitation');
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Team Management</h1>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          {error}
        </div>
      )}

      {/* Invite Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Send Invitation</h2>
        <form onSubmit={handleSendInvite} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="email"
              placeholder="Email address"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              required
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="admin">Admin</option>
              <option value="member">Member</option>
              <option value="viewer">Viewer</option>
            </select>
            <button
              type="submit"
              disabled={inviteLoading}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-medium rounded-lg"
            >
              {inviteLoading ? 'Sending...' : 'Send Invite'}
            </button>
          </div>
        </form>
      </div>

      {/* Members List */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Team Members ({members.length})</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-medium text-gray-700">Name</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Email</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Role</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Joined</th>
                <th className="text-right py-3 px-4 font-medium text-gray-700">Action</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">{member.full_name || 'Unknown'}</td>
                  <td className="py-3 px-4">{member.email}</td>
                  <td className="py-3 px-4">
                    <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                      {member.role}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {new Date(member.joined_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleRemoveMember(member.id)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pending Invites */}
      {pendingInvites.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Pending Invitations</h2>
          <div className="space-y-3">
            {pendingInvites.map((invite) => (
              <div key={invite.id} className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{invite.email}</p>
                  <p className="text-sm text-gray-600">
                    Role: <span className="font-medium">{invite.role}</span> • Expires{' '}
                    {new Date(invite.expires_at).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => handleRevokeInvite(invite.id)}
                  className="text-orange-600 hover:text-orange-800 text-sm font-medium"
                >
                  Revoke
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
