import { getSession } from "@/lib/auth";
import { getIncidentWithDetails, updateIncidentAction, addCommentAction } from "@/actions/projects";
import { getProjectMembers } from "@/actions/projects";
import { redirect } from "next/navigation";
import Link from "next/link";
import { StatusBadge, SeverityBadge } from "@/components/Badges";

export default async function IncidentDetailPage({
  params,
}: {
  params: Promise<{ projectId: string; incidentId: string }>;
}) {
  const user = await getSession();
  if (!user) redirect("/login");

  const { projectId, incidentId } = await params;
  const incident = await getIncidentWithDetails(incidentId);
  const members = await getProjectMembers(projectId);

  if (!incident) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">Incident not found</h1>
        <Link href={`/projects/${projectId}`} className="mt-4 inline-block btn btn-primary">
          Back to Project
        </Link>
      </div>
    );
  }

  async function handleUpdate(formData: FormData) {
    "use server";
    await updateIncidentAction(incidentId, formData);
  }

  async function handleComment(formData: FormData) {
    "use server";
    await addCommentAction(incidentId, formData);
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/projects/${projectId}`}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Back to Project
        </Link>
      </div>

      {/* Incident Header */}
      <div className="card rounded-lg p-6 shadow">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{incident.title}</h1>
            <div className="mt-2 flex items-center gap-3">
              <StatusBadge status={incident.status} />
              <SeverityBadge severity={incident.severity} />
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <div>
            <span className="text-gray-500">Created</span>
            <p className="font-medium">{new Date(incident.createdAt).toLocaleString()}</p>
          </div>
          <div>
            <span className="text-gray-500">Creator</span>
            <p className="font-medium">{incident.creatorName || "Unknown"}</p>
          </div>
          <div>
            <span className="text-gray-500">Assignee</span>
            <p className="font-medium">{incident.assigneeName || "Unassigned"}</p>
          </div>
          <div>
            <span className="text-gray-500">Resolved</span>
            <p className="font-medium">
              {incident.resolvedAt ? new Date(incident.resolvedAt).toLocaleString() : "—"}
            </p>
          </div>
        </div>

        {incident.description && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-500">Description</h3>
            <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">
              {incident.description}
            </p>
          </div>
        )}
      </div>

      {/* Update Form */}
      <div className="card rounded-lg p-6 shadow">
        <h2 className="text-lg font-semibold text-gray-900">Update Incident</h2>
        <form
          action={handleUpdate}
          className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2"
        >
          <div>
            <label htmlFor="status" className="label mb-1.5 block">
              Status
            </label>
            <select id="status" name="status" className="input">
              <option value="investigating" selected={incident.status === "investigating"}>
                Investigating
              </option>
              <option value="identified" selected={incident.status === "identified"}>
                Identified
              </option>
              <option value="monitoring" selected={incident.status === "monitoring"}>
                Monitoring
              </option>
              <option value="resolved" selected={incident.status === "resolved"}>
                Resolved
              </option>
            </select>
          </div>
          <div>
            <label htmlFor="severity" className="label mb-1.5 block">
              Severity
            </label>
            <select id="severity" name="severity" className="input">
              <option value="low" selected={incident.severity === "low"}>Low</option>
              <option value="medium" selected={incident.severity === "medium"}>Medium</option>
              <option value="high" selected={incident.severity === "high"}>High</option>
              <option value="critical" selected={incident.severity === "critical"}>Critical</option>
            </select>
          </div>
          <div>
            <label htmlFor="assigneeId" className="label mb-1.5 block">
              Assignee
            </label>
            <select id="assigneeId" name="assigneeId" className="input">
              <option value="">Unassigned</option>
              {members.map((member) => (
                <option key={member.userId} value={member.userId} selected={incident.assigneeId === member.userId}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button type="submit" className="btn btn-primary w-full">
              Update
            </button>
          </div>
        </form>
      </div>

      {/* Comments */}
      <div className="card rounded-lg p-6 shadow">
        <h2 className="text-lg font-semibold text-gray-900">
          Comments ({incident.comments?.length ?? 0})
        </h2>
        <div className="mt-4 space-y-4">
          {incident.comments?.map((comment) => (
            <div key={comment.id} className="border-b border-gray-100 pb-4 last:border-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900">
                  {comment.userName || "Unknown"}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(comment.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-700">{comment.content}</p>
            </div>
          ))}
        </div>

        <form
          action={handleComment}
          className="mt-6 space-y-3"
        >
          <div>
            <label htmlFor="content" className="label mb-1.5 block">
              Add a comment
            </label>
            <textarea
              id="content"
              name="content"
              rows={3}
              required
              className="input resize-none"
              placeholder="Write a comment..."
            />
          </div>
          <button type="submit" className="btn btn-primary">
            Post comment
          </button>
        </form>
      </div>

      {/* Timeline */}
      <div className="card rounded-lg p-6 shadow">
        <h2 className="text-lg font-semibold text-gray-900">Timeline</h2>
        <div className="mt-4 space-y-0">
          {incident.timeline?.map((event, index) => (
            <div key={event.id} className="relative flex gap-4">
              {index < (incident.timeline?.length ?? 0) - 1 && (
                <div className="absolute left-4 top-10 h-full w-0.5 -translate-x-1/2 bg-gray-200" />
              )}
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100">
                <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="pb-6">
                <p className="text-sm font-medium text-gray-900 capitalize">{event.type.replace(/_/g, " ")}</p>
                <p className="text-xs text-gray-500">
                  {new Date(event.createdAt).toLocaleString()}
                </p>
                {event.data && (
                  <pre className="mt-1 max-w-xs overflow-x-auto rounded bg-gray-50 p-2 text-xs text-gray-600">
                    {typeof event.data === "string" ? event.data : JSON.stringify(event.data, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
