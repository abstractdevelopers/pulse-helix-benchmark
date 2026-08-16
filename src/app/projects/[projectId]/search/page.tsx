import { getSession } from "@/lib/auth";
import { getProjectWithMembers, searchIncidents } from "@/actions/projects";
import { getProjectMembers } from "@/actions/projects";
import { redirect } from "next/navigation";
import Link from "next/link";
import { StatusBadge, SeverityBadge } from "@/components/Badges";

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{
    q?: string;
    status?: string;
    severity?: string;
    assigneeId?: string;
    page?: string;
  }>;
}) {
  const user = await getSession();
  if (!user) redirect("/login");

  const { projectId } = await params;
  const sp = await searchParams;
  const projectData = await getProjectWithMembers(projectId);
  const members = await getProjectMembers(projectId);

  if (!projectData) redirect("/");

  const page = sp.page ? parseInt(sp.page, 10) : 1;
  const result = await searchIncidents(projectId, {
    q: sp.q,
    status: sp.status,
    severity: sp.severity,
    assigneeId: sp.assigneeId,
    page: isNaN(page) ? 1 : page,
    limit: 20,
  });

  const baseUrl = `/projects/${projectId}/search`;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/projects/${projectId}`}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Back to {projectData.project.name}
        </Link>
        <h1 className="mt-2 text-3xl font-bold text-gray-900">
          Search Incidents
        </h1>
      </div>

      {/* Filters */}
      <form className="card rounded-lg p-6 shadow">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <label htmlFor="q" className="label mb-1.5 block">
              Search
            </label>
            <input
              id="q"
              name="q"
              type="text"
              defaultValue={sp.q}
              className="input"
              placeholder="Search title or description..."
            />
          </div>
          <div>
            <label htmlFor="status" className="label mb-1.5 block">
              Status
            </label>
            <select id="status" name="status" className="input">
              <option value="">All</option>
              <option value="investigating" selected={sp.status === "investigating"}>
                Investigating
              </option>
              <option value="identified" selected={sp.status === "identified"}>
                Identified
              </option>
              <option value="monitoring" selected={sp.status === "monitoring"}>
                Monitoring
              </option>
              <option value="resolved" selected={sp.status === "resolved"}>
                Resolved
              </option>
            </select>
          </div>
          <div>
            <label htmlFor="severity" className="label mb-1.5 block">
              Severity
            </label>
            <select id="severity" name="severity" className="input">
              <option value="">All</option>
              <option value="low" selected={sp.severity === "low"}>Low</option>
              <option value="medium" selected={sp.severity === "medium"}>Medium</option>
              <option value="high" selected={sp.severity === "high"}>High</option>
              <option value="critical" selected={sp.severity === "critical"}>Critical</option>
            </select>
          </div>
          <div>
            <label htmlFor="assigneeId" className="label mb-1.5 block">
              Assignee
            </label>
            <select id="assigneeId" name="assigneeId" className="input">
              <option value="">All</option>
              {members.map((member) => (
                <option key={member.userId} value={member.userId} selected={sp.assigneeId === member.userId}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button type="submit" className="btn btn-primary w-full">
              Filter
            </button>
          </div>
        </div>
      </form>

      {/* Results */}
      <div className="card overflow-hidden rounded-lg border border-gray-200 shadow">
        <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
          <p className="text-sm text-gray-500">
            {result.total} result{result.total !== 1 ? "s" : ""} found
          </p>
        </div>
        {result.incidents.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500">No incidents match your filters.</p>
          </div>
        ) : (
          <>
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="px-6 py-3 font-medium">Title</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Severity</th>
                  <th className="px-6 py-3 font-medium">Assignee</th>
                  <th className="px-6 py-3 font-medium">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {result.incidents.map((incident) => (
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
                      {incident.assigneeName || "Unassigned"}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(incident.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {result.totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-6 py-4">
                <p className="text-sm text-gray-500">
                  Page {result.page} of {result.totalPages}
                </p>
                <div className="flex gap-2">
                  {result.page > 1 && (
                    <Link
                      href={`${baseUrl}?page=${result.page - 1}${sp.q ? `&q=${encodeURIComponent(sp.q)}` : ""}${sp.status ? `&status=${sp.status}` : ""}${sp.severity ? `&severity=${sp.severity}` : ""}${sp.assigneeId ? `&assigneeId=${sp.assigneeId}` : ""}`}
                      className="btn btn-secondary text-sm"
                    >
                      Previous
                    </Link>
                  )}
                  {result.page < result.totalPages && (
                    <Link
                      href={`${baseUrl}?page=${result.page + 1}${sp.q ? `&q=${encodeURIComponent(sp.q)}` : ""}${sp.status ? `&status=${sp.status}` : ""}${sp.severity ? `&severity=${sp.severity}` : ""}${sp.assigneeId ? `&assigneeId=${sp.assigneeId}` : ""}`}
                      className="btn btn-secondary text-sm"
                    >
                      Next
                    </Link>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}