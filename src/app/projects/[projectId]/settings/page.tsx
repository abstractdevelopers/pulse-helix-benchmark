import { getSession } from "@/lib/auth";
import { getProjectWithMembers, updateProjectAction, deleteProjectAction } from "@/actions/projects";
import { getProjectMembers } from "@/actions/projects";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function SettingsPage({
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

  const { project } = projectData;

  async function handleUpdate(formData: FormData) {
    "use server";
    await updateProjectAction(projectId, formData);
  }

  async function handleDelete(formData: FormData) {
    "use server";
    await deleteProjectAction(projectId);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <Link
          href={`/projects/${projectId}`}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Back to {project.name}
        </Link>
        <h1 className="mt-2 text-3xl font-bold text-gray-900">
          Project Settings
        </h1>
      </div>

      {/* Edit Project */}
      <div className="card rounded-lg p-6 shadow">
        <h2 className="text-lg font-semibold text-gray-900">Edit Project</h2>
        <form
          action={handleUpdate}
          className="mt-4 space-y-4"
        >
          <div>
            <label htmlFor="name" className="label mb-1.5 block">
              Project name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              defaultValue={project.name}
              className="input"
            />
          </div>
          <div>
            <label htmlFor="description" className="label mb-1.5 block">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              defaultValue={project.description ?? ""}
              className="input resize-none"
            />
          </div>
          <button type="submit" className="btn btn-primary">
            Save changes
          </button>
        </form>
      </div>

      {/* Team Members */}
      <div className="card rounded-lg p-6 shadow">
        <h2 className="text-lg font-semibold text-gray-900">Team Members</h2>
        <div className="mt-4 space-y-3">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between rounded-lg border border-gray-200 p-4"
            >
              <div>
                <p className="font-medium text-gray-900">{member.name}</p>
                <p className="text-sm text-gray-500">{member.email}</p>
              </div>
              <span className="badge bg-gray-100 text-gray-700">
                {member.role}
              </span>
            </div>
          ))}
          {members.length === 0 && (
            <p className="text-sm text-gray-500">No team members yet.</p>
          )}
        </div>
      </div>

      {/* Danger Zone */}
      <div className="card rounded-lg border-red-200 p-6 shadow">
        <h2 className="text-lg font-semibold text-red-600">Danger Zone</h2>
        <p className="mt-2 text-sm text-gray-500">
          Deleting a project will permanently remove all incidents, comments, and
          timeline events. This action cannot be undone.
        </p>
        <form
          action={handleDelete}
          className="mt-4"
        >
          <button
            type="submit"
            className="btn btn-danger"
            onClick={(e) => {
              if (
                !confirm(
                  "Are you sure? This will permanently delete the project and all its data."
                )
              ) {
                e.preventDefault();
              }
            }}
          >
            Delete project
          </button>
        </form>
      </div>
    </div>
  );
}
