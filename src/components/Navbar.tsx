"use client";

import Link from "next/link";
import { logoutAction } from "@/actions/auth";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export function Navbar({ user }: { user: User | null }) {
  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <svg
              className="h-8 w-8 text-blue-600"
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
            <span className="text-xl font-bold text-gray-900">Pulse</span>
          </Link>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Link
                  href="/"
                  className="text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  Dashboard
                </Link>
                <span className="text-sm text-gray-500">{user.name}</span>
                <form action={logoutAction}>
                  <button type="submit" className="btn btn-ghost text-sm">
                    Sign out
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link href="/login" className="btn btn-ghost text-sm">
                  Sign in
                </Link>
                <Link href="/signup" className="btn btn-primary text-sm">
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}