import Link from "next/link";
import { getSession } from "@/lib/auth";
import { getProjectWithMembers, searchIncidents } from "@/actions/projects";
import { redirect } from "next/navigation";
import { StatusBadge, SeverityBadge } from "@/components/Badges";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const user = await getSession();
  if (!user) redirect("/login");

  const { projectId } = await params;
  const projectData = await getProjectWithMembers(projectId);

  if (!projectData) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">Project not found</h1>
        <Link href="/" className="mt-4 inline-block btn btn-primary">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const { project } = projectData;
  const { incidents } = await searchIncidents(projectId, { limit: 50 });

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <Link
            href="/"
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="mt-2 text-3xl font-bold text-gray-900">
            {project.name}
          </h1>
          {project.description && (
            <p className="mt-1 text-sm text-gray-500">{project.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Link
            href={`/projects/${projectId}/search`}
            className="btn btn-secondary"
          >
            Search
          </Link>
          <Link
            href={`/projects/${projectId}/incidents/new`}
            className="btn btn-primary"
          >
            New Incident
          </Link>
        </div>
      </div>

      {incidents.length === 0 ? (
        <div className="card rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            No incidents yet
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            Create your first incident to start tracking.
          </p>
          <Link
            href={`/projects/${projectId}/incidents/new`}
            className="mt-4 inline-block btn btn-primary"
          >
            Create Incident
          </Link>
        </div>
      ) : (
        <div className="card overflow-hidden rounded-lg border border-gray-200">
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
              {incidents.map((incident) => (
                <tr
                  key={incident.id}
                  className="hover:bg-gray-50"
                >
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
        </div>
      )}
    </div>
  );
}