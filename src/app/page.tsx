import Link from "next/link";
import { getSession } from "@/lib/auth";
import { getProjects } from "@/actions/projects";
import { redirect } from "next/navigation";

export default async function Home() {
  const user = await getSession();
  if (!user) redirect("/login");

  const projects = await getProjects();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your incidents and projects
          </p>
        </div>
        <Link href="/projects/new" className="btn btn-primary">
          New Project
        </Link>
      </div>

      {projects.length === 0 ? (
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
              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            No projects yet
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            Get started by creating your first project.
          </p>
          <Link href="/projects/new" className="mt-4 inline-block btn btn-primary">
            Create Project
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map(({ project, memberRole }) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="card group rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600">
                    {project.name}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-sm text-gray-500">
                    {project.description || "No description"}
                  </p>
                </div>
                <span className="badge bg-gray-100 text-gray-700">
                  {memberRole}
                </span>
              </div>
              <div className="mt-4 flex items-center text-sm text-gray-500">
                <svg
                  className="mr-1 h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {new Date(project.createdAt).toLocaleDateString()}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}