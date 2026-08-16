import Link from "next/link";
import { createProjectAction } from "@/actions/projects";

export default function NewProjectPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <Link
          href="/"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Back to Dashboard
        </Link>
        <h1 className="mt-4 text-3xl font-bold text-gray-900">
          Create a new project
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Projects help you organize incidents by service or team.
        </p>
      </div>

      <form action={createProjectAction} className="card space-y-6 rounded-lg p-8 shadow">
        <div>
          <label htmlFor="name" className="label mb-1.5 block">
            Project name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            className="input"
            placeholder="e.g. API Platform"
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
            className="input resize-none"
            placeholder="Describe what this project is for..."
          />
        </div>

        <div className="flex justify-end gap-3">
          <Link href="/" className="btn btn-secondary">
            Cancel
          </Link>
          <button type="submit" className="btn btn-primary">
            Create project
          </button>
        </div>
      </form>
    </div>
  );
}