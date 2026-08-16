import { getSession } from "@/lib/auth";
import { getProjectWithMembers, getDashboardStats } from "@/actions/projects";
import { redirect } from "next/navigation";
import Link from "next/link";
import { StatusBadge, SeverityBadge } from "@/components/Badges";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const user = await getSession();
  if (!user) redirect("/login");

  const { projectId } = await params;
  const projectData = await getProjectWithMembers(projectId);
  const stats = await getDashboardStats(projectId);

  if (!projectData || !stats) redirect("/");

  const statusCounts = {
    investigating: 0,
    identified: 0,
    monitoring: 0,
    resolved: 0,
  };
  for (const item of stats.byStatus) {
    if (item.status in statusCounts) {
      statusCounts[item.status] = Number(item.count);
    }
  }

  const severityCounts = {
    low: 0,
    medium: 0,
    high: 0,
    critical: 0,
  };
  for (const item of stats.bySeverity) {
    if (item.severity in severityCounts) {
      severityCounts[item.severity] = Number(item.count);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <Link
            href={`/projects/${projectId}`}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← Back to {projectData.project.name}
          </Link>
          <h1 className="mt-2 text-3xl font-bold text-gray-900">
            {projectData.project.name} — Dashboard
          </h1>
        </div>
        <Link
          href={`/projects/${projectId}/incidents/new`}
          className="btn btn-primary"
        >
          New Incident
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Incidents"
          value={stats.total}
          color="bg-blue-50 text-blue-700"
        />
        <StatCard
          label="Active"
          value={statusCounts.investigating + statusCounts.identified + statusCounts.monitoring}
          color="bg-orange-50 text-orange-700"
        />
        <StatCard
          label="Critical"
          value={severityCounts.critical}
          color="bg-red-50 text-red-700"
        />
        <StatCard
          label="Resolved"
          value={statusCounts.resolved}
          color="bg-green-50 text-green-700"
        />
      </div>

      {/* Status Breakdown */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card rounded-lg p-6 shadow">
          <h2 className="text-lg font-semibold text-gray-900">By Status</h2>
          <div className="mt-4 space-y-3">
            <StatusRow
              label="Investigating"
              count={statusCounts.investigating}
              total={stats.total}
              color="bg-yellow-500"
            />
            <StatusRow
              label="Identified"
              count={statusCounts.identified}
              total={stats.total}
              color="bg-orange-500"
            />
            <StatusRow
              label="Monitoring"
              count={statusCounts.monitoring}
              total={stats.total}
              color="bg-blue-500"
            />
            <StatusRow
              label="Resolved"
              count={statusCounts.resolved}
              total={stats.total}
              color="bg-green-500"
            />
          </div>
        </div>

        <div className="card rounded-lg p-6 shadow">
          <h2 className="text-lg font-semibold text-gray-900">By Severity</h2>
          <div className="mt-4 space-y-3">
            <StatusRow
              label="Critical"
              count={severityCounts.critical}
              total={stats.total}
              color="bg-red-500"
            />
            <StatusRow
              label="High"
              count={severityCounts.high}
              total={stats.total}
              color="bg-orange-500"
            />
            <StatusRow
              label="Medium"
              count={severityCounts.medium}
              total={stats.total}
              color="bg-yellow-500"
            />
            <StatusRow
              label="Low"
              count={severityCounts.low}
              total={stats.total}
              color="bg-gray-400"
            />
          </div>
        </div>
      </div>

      {/* Recent Incidents */}
      <div className="card overflow-hidden rounded-lg border border-gray-200 shadow">
        <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Recent Incidents
          </h2>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="px-6 py-3 font-medium">Title</th>
              <th className="px-6 py-3 font-medium">Status</th>
              <th className="px-6 py-3 font-medium">Severity</th>
              <th className="px-6 py-3 font-medium">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {stats.recent.map((incident) => (
              <tr key={incident.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <Link
                    href={`/projects/${projectId}/incidents/${incident.id}`}
                    className="font-medium text-gray-900 hover:text-blue-600"
                  >
                    {incident.title}
                  </Link>
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={incident.status} />
                </td>
                <td className="px-6 py-4">
                  <SeverityBadge severity={incident.severity} />
                </td>
                <td className="px-6 py-4 text-gray-500">
                  {new Date(incident.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
            {stats.recent.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                  No incidents yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={`rounded-lg p-6 ${color}`}>
      <p className="text-sm font-medium opacity-80">{label}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
    </div>
  );
}

function StatusRow({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const percentage = total > 0 ? (count / total) * 100 : 0;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="font-medium text-gray-700">{label}</span>
        <span className="text-gray-500">{count}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className={`h-full ${color} transition-all`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}