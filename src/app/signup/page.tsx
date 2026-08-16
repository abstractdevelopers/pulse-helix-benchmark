"use client";

import { useFormState } from "react-dom";
import { signupAction } from "@/actions/auth";
import Link from "next/link";

export default function SignupPage() {
  const [state, action] = useFormState(signupAction, null);

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <svg
              className="h-10 w-10 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </Link>
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Or{" "}
            <Link
              href="/login"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              sign in to an existing account
            </Link>
          </p>
        </div>

        <form action={action} className="card space-y-6 rounded-lg p-8 shadow">
          {state?.error && (
            <div className="rounded-md bg-red-50 p-4 text-sm text-red-800">
              {state.error}
            </div>
          )}

          <div>
            <label htmlFor="name" className="label mb-1.5 block">
              Full name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              className="input"
              placeholder="Jane Doe"
            />
          </div>

          <div>
            <label htmlFor="email" className="label mb-1.5 block">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="input"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="label mb-1.5 block">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              className="input"
              placeholder="••••••••"
            />
            <p className="mt-1 text-xs text-gray-500">
              Must be at least 8 characters
            </p>
          </div>

          <button type="submit" className="btn btn-primary w-full">
            Create account
          </button>
        </form>
      </div>
    </div>
  );
}