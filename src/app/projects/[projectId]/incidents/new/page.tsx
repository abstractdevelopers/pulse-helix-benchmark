import { getSession } from "@/lib/auth";
import { getProjectWithMembers, createIncidentAction } from "@/actions/projects";
import { getProjectMembers } from "@/actions/projects";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function NewIncidentPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const user = await getSession();
  if (!user) redirect("/login");

  const { projectId } = await params;
  const projectData = await getProjectWithMembers(projectId);
  const members = await getProjectMembers(projectId);

  if (!projectData) redirect("/");

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <Link
          href={`/projects/${projectId}`}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Back to {projectData.project.name}
        </Link>
        <h1 className="mt-4 text-3xl font-bold text-gray-900">
          Create new incident
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Report a new incident and assign it to a team member.
        </p>
      </div>

      <form
        action={createIncidentAction.bind(null, projectId)}
        className="card space-y-6 rounded-lg p-8 shadow"
      >
        <div>
          <label htmlFor="title" className="label mb-1.5 block">
            Title
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            className="input"
            placeholder="Brief description of the incident"
          />
        </div>

        <div>
          <label htmlFor="description" className="label mb-1.5 block">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={6}
            required
            className="input resize-none"
            placeholder="Provide detailed information about the incident..."
          />
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="severity" className="label mb-1.5 block">
              Severity
            </label>
            <select id="severity" name="severity" className="input">
              <option value="low">Low</option>
              <option value="medium" selected>
                Medium
              </option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          <div>
            <label htmlFor="assigneeId" className="label mb-1.5 block">
              Assignee
            </label>
            <select id="assigneeId" name="assigneeId" className="input">
              <option value="">Unassigned</option>
              {members.map((member) => (
                <option key={member.userId} value={member.userId}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Link
            href={`/projects/${projectId}`}
            className="btn btn-secondary"
          >
            Cancel
          </Link>
          <button type="submit" className="btn btn-primary">
            Create incident
          </button>
        </div>
      </form>
    </div>
  );
}