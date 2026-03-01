/**
 * /admin/dashboard — Super Admin Dashboard — Story 1.5 AC1
 *
 * Display system metrics, organization list, and impersonation controls.
 */

'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

interface Organization {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  user_count?: number;
  last_activity?: string;
}

interface Metrics {
  totalOrganizations: number;
  totalUsers: number;
  messagesLastMonth: number;
  activityChart: Array<{ date: string; count: number }>;
}

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [showImpersonate, setShowImpersonate] = useState(false);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  );

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      setLoading(true);

      // Get session
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session) {
        throw new Error('Not authenticated');
      }

      // Fetch metrics
      const metricsResponse = await fetch('/api/admin/metrics', {
        headers: {
          'Authorization': `Bearer ${session.session.access_token}`,
        },
      });

      if (!metricsResponse.ok) {
        throw new Error('Failed to fetch metrics');
      }

      const metricsData = await metricsResponse.json();
      setMetrics(metricsData);

      // Fetch organizations (only super admin can see all)
      const { data: orgs } = await supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false });

      if (orgs) {
        setOrganizations(orgs);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleImpersonate(org: Organization) {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session) return;

      // Get first member of organization
      const { data: members } = await supabase
        .from('org_members')
        .select('user_id')
        .eq('organization_id', org.id)
        .limit(1);

      if (!members?.length) {
        setError('No members found in organization');
        return;
      }

      const response = await fetch('/api/admin/impersonate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.session.access_token}`,
        },
        body: JSON.stringify({
          organizationId: org.id,
          userId: members[0].user_id,
          reason: 'Dashboard debugging',
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to impersonate');
      }

      setShowImpersonate(false);
      alert(`Now impersonating user in ${org.name}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to impersonate');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Super Admin Dashboard</h1>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            {error}
          </div>
        )}

        {/* Metrics Cards */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <MetricsCard
              title="Organizations"
              value={metrics.totalOrganizations}
              icon="🏢"
            />
            <MetricsCard title="Users" value={metrics.totalUsers} icon="👥" />
            <MetricsCard
              title="Messages (30d)"
              value={metrics.messagesLastMonth}
              icon="💬"
            />
            <MetricsCard
              title="Active"
              value={metrics.activityChart.reduce((sum, d) => sum + d.count, 0)}
              icon="📈"
            />
          </div>
        )}

        {/* Organizations Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
          <div className="px-6 py-4 border-b">
            <h2 className="text-2xl font-bold text-gray-900">Organizations</h2>
          </div>

          <table className="min-w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                  Organization
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                  Slug
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-sm font-medium text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {organizations.map((org) => (
                <tr key={org.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900">{org.name}</p>
                      <p className="text-sm text-gray-600">{org.id}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-900">{org.slug}</td>
                  <td className="px-6 py-4 text-gray-900">
                    {new Date(org.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      onClick={() => handleImpersonate(org)}
                      className="text-indigo-600 hover:text-indigo-800 font-medium text-sm"
                    >
                      Impersonate
                    </button>
                    <button className="text-gray-600 hover:text-gray-800 font-medium text-sm">
                      Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Activity Chart */}
        {metrics && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Activity (Last 30 Days)</h2>
            <div className="h-64 flex items-end space-x-1">
              {metrics.activityChart.map((day) => (
                <div
                  key={day.date}
                  className="flex-1 bg-indigo-500 rounded-t"
                  style={{
                    height: `${(day.count / Math.max(...metrics.activityChart.map((d) => d.count))) * 100}%`,
                    minHeight: '2px',
                  }}
                  title={`${day.date}: ${day.count} messages`}
                />
              ))}
            </div>
            <p className="text-xs text-gray-600 mt-2 text-center">Messages per day</p>
          </div>
        )}
      </div>
    </div>
  );
}

interface MetricsCardProps {
  title: string;
  value: number;
  icon: string;
}

function MetricsCard({ title, value, icon }: MetricsCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value.toLocaleString()}</p>
        </div>
        <div className="text-4xl">{icon}</div>
      </div>
    </div>
  );
}
