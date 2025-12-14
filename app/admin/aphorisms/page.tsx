"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface AphorismRow {
  id: number;
  chinese: string;
  english: string;
  createdAt: string;
}

export default function AphorismsAdminPage() {
  const [passwordInput, setPasswordInput] = useState("");
  const [authorized, setAuthorized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aphorisms, setAphorisms] = useState<AphorismRow[]>([]);
  const [loading, setLoading] = useState(false);

  // Form state for new aphorism
  const [newChinese, setNewChinese] = useState("");
  const [newEnglish, setNewEnglish] = useState("");

  // Edit state
  const [editing, setEditing] = useState<AphorismRow | null>(null);

  useEffect(() => {
    if (authorized) {
      fetchAphorisms();
    }
  }, [authorized]);

  const handleAuth = () => {
    const key = process.env.NEXT_PUBLIC_ADMIN_KEY;
    if (passwordInput && key && passwordInput === key) {
      setAuthorized(true);
      setError(null);
    } else {
      setError("Invalid admin key.");
    }
  };

  const fetchAphorisms = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/aphorisms");
      if (!res.ok) throw new Error("Failed to fetch aphorisms");
      const data = await res.json();
      setAphorisms(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newChinese.trim() || !newEnglish.trim()) {
      setError("Both Chinese and English are required");
      return;
    }

    try {
      const res = await fetch("/api/aphorisms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": passwordInput
        },
        body: JSON.stringify({ chinese: newChinese, english: newEnglish })
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Failed to add");
      }

      setNewChinese("");
      setNewEnglish("");
      fetchAphorisms();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add");
    }
  };

  const handleUpdate = async () => {
    if (!editing) return;

    try {
      const res = await fetch(`/api/aphorisms/${editing.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": passwordInput
        },
        body: JSON.stringify({ chinese: editing.chinese, english: editing.english })
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Failed to update");
      }

      setEditing(null);
      fetchAphorisms();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this aphorism?")) return;

    try {
      const res = await fetch(`/api/aphorisms/${id}`, {
        method: "DELETE",
        headers: { "x-admin-key": passwordInput }
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Failed to delete");
      }

      fetchAphorisms();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  if (!authorized) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm rounded-xl bg-white p-4 shadow-sm">
          <h1 className="text-center text-lg font-semibold text-tzuchiBlue">
            Admin Access
          </h1>
          <p className="mt-1 text-center text-xs text-slate-500">
            Enter the admin key to manage aphorisms.
          </p>
          {error && (
            <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {error}
            </div>
          )}
          <div className="mt-4 flex flex-col gap-2">
            <input
              type="password"
              className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-tzuchiBlue focus:outline-none focus:ring-1 focus:ring-tzuchiBlue"
              placeholder="Admin key"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
            />
            <button
              type="button"
              onClick={handleAuth}
              className="inline-flex items-center justify-center rounded-md bg-tzuchiBlue px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
            >
              Enter
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col gap-4 p-4">
      <header className="pt-2">
        <Link
          href="/admin"
          className="text-sm text-tzuchiBlue hover:underline"
        >
          ← Back to Admin
        </Link>
        <h1 className="mt-2 text-center text-2xl font-semibold text-tzuchiBlue">
          Jing Si Aphorisms
        </h1>
        <p className="mt-1 text-center text-sm text-slate-600">
          Manage bilingual aphorisms displayed on generated images.
        </p>
      </header>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
          <button onClick={() => setError(null)} className="ml-2 text-red-500">×</button>
        </div>
      )}

      {/* Add New Aphorism */}
      <section className="rounded-xl bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Add New Aphorism</h2>
        <div className="flex flex-col gap-2">
          <input
            type="text"
            placeholder="Chinese (中文)"
            value={newChinese}
            onChange={(e) => setNewChinese(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-tzuchiBlue focus:outline-none focus:ring-1 focus:ring-tzuchiBlue"
          />
          <input
            type="text"
            placeholder="English"
            value={newEnglish}
            onChange={(e) => setNewEnglish(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-tzuchiBlue focus:outline-none focus:ring-1 focus:ring-tzuchiBlue"
          />
          <button
            onClick={handleAdd}
            className="rounded-md bg-tzuchiBlue px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
          >
            Add Aphorism
          </button>
        </div>
      </section>

      {/* Aphorisms List */}
      <section className="flex-1 rounded-xl bg-white p-4 shadow-sm overflow-auto">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">
          All Aphorisms ({aphorisms.length})
        </h2>
        {loading && <p className="text-xs text-slate-500">Loading...</p>}
        <ul className="divide-y divide-slate-100">
          {aphorisms.map((aphorism) => (
            <li key={aphorism.id} className="py-3">
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium text-slate-800">{aphorism.chinese}</p>
                <p className="text-xs text-slate-600 italic">{aphorism.english}</p>
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => setEditing(aphorism)}
                    className="rounded-md border border-tzuchiBlue/50 bg-tzuchiBlue/5 px-2 py-1 text-xs text-tzuchiBlue hover:bg-tzuchiBlue/10"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(aphorism.id)}
                    className="rounded-md border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-xl bg-white p-4 shadow-lg">
            <h2 className="text-sm font-semibold text-tzuchiBlue">Edit Aphorism</h2>
            <div className="mt-3 flex flex-col gap-2">
              <label className="text-xs text-slate-600">Chinese (中文)</label>
              <textarea
                value={editing.chinese}
                onChange={(e) => setEditing({ ...editing, chinese: e.target.value })}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-tzuchiBlue focus:outline-none focus:ring-1 focus:ring-tzuchiBlue"
                rows={2}
              />
              <label className="text-xs text-slate-600">English</label>
              <textarea
                value={editing.english}
                onChange={(e) => setEditing({ ...editing, english: e.target.value })}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-tzuchiBlue focus:outline-none focus:ring-1 focus:ring-tzuchiBlue"
                rows={2}
              />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setEditing(null)}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                className="rounded-md bg-tzuchiBlue px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-800"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
