"use client";

import { useFormState } from "react-dom";
import { loginAction } from "@/actions/auth";
import Link from "next/link";

export default function LoginPage() {
  const [state, action] = useFormState(loginAction, null);

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
            Sign in to Pulse
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Or{" "}
            <Link
              href="/signup"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              create a new account
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
              className="input"
              placeholder="••••••••"
            />
          </div>

          <button type="submit" className="btn btn-primary w-full">
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}