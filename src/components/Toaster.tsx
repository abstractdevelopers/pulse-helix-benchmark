"use client";

import { useEffect, useState } from "react";

export function Toaster() {
  const [toasts, setToasts] = useState<{ id: number; message: string; type: "success" | "error" }[]>([]);

  useEffect(() => {
    // Listen for custom toast events
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { message, type = "success" } = customEvent.detail;
      const id = Date.now();
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    };
    window.addEventListener("toast", handler);
    return () => window.removeEventListener("toast", handler);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`rounded-lg px-4 py-3 text-sm font-medium text-white shadow-lg ${
            toast.type === "error" ? "bg-red-600" : "bg-green-600"
          }`}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}