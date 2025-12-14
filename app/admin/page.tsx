"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface SectionCheckin {
  id: number;
  sectionId: number;
  sectionName: string;
  isFireflyRelease: number;
}

interface AdminMomentRow {
  id: string;
  englishName: string;
  chineseName?: string;
  phoneNumber: string;
  email?: string;
  createdAt: string;
  downloadToken: string;
  postUrl: string;
  sections: SectionCheckin[];
}

export default function AdminPage() {
  const [passwordInput, setPasswordInput] = useState("");
  const [authorized, setAuthorized] = useState(false);

  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<AdminMomentRow[]>([]);

  const [editing, setEditing] = useState<AdminMomentRow | null>(null);

  useEffect(() => {
    if (authorized) {
      handleSearch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authorized]);

  const handleAuth = () => {
    // For MVP, simple in-browser key comparison via NEXT_PUBLIC_ADMIN_KEY.
    const key = process.env.NEXT_PUBLIC_ADMIN_KEY;
    if (passwordInput && key && passwordInput === key) {
      setAuthorized(true);
      setError(null);
    } else {
      setError("Invalid admin key.");
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/moments?q=${encodeURIComponent(query)}`, {
        headers: {
          "x-admin-key": passwordInput
        }
      });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.error || "Failed to load records.");
      }
      // The API is confirmed to return `postUrl`
      const json = (await res.json()) as AdminMomentRow[]; 
      setRows(json);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unexpected error occurred.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this record and associated photo asset?")) return;
    try {
      const res = await fetch(`/api/admin/moments?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: {
          "x-admin-key": passwordInput
        }
      });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.error || "Failed to delete record.");
      }
      setRows((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unexpected error occurred.";
      setError(message);
    }
  };

  const handleRemoveSection = async (momentId: string, sectionId: number) => {
    try {
      const res = await fetch(`/api/admin/moments?id=${encodeURIComponent(momentId)}&sectionId=${sectionId}`, {
        method: "DELETE",
        headers: {
          "x-admin-key": passwordInput
        }
      });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.error || "Failed to remove section.");
      }
      // Update local state to remove the section chip
      setRows((prev) =>
        prev.map((r) =>
          r.id === momentId
            ? { ...r, sections: r.sections.filter((s) => s.sectionId !== sectionId) }
            : r
        )
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unexpected error occurred.";
      setError(message);
    }
  };

  const handleSaveEdit = async () => {
    if (!editing) return;
    try {
      const res = await fetch("/api/admin/moments", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": passwordInput
        },
        body: JSON.stringify({
          id: editing.id,
          englishName: editing.englishName,
          chineseName: editing.chineseName,
          phoneNumber: editing.phoneNumber,
          email: editing.email
        })
      });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.error || "Failed to update record.");
      }
      setRows((prev) =>
        // Ensure we preserve the postUrl when updating
        prev.map((r) => (r.id === editing.id ? { ...r, ...editing } : r))
      );
      setEditing(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unexpected error occurred.";
      setError(message);
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
            Enter the event staff key to manage records.
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
    <main className="flex flex-1 flex-col gap-4">
      <header className="pt-2">
        <div className="flex justify-center gap-4 mb-2 flex-wrap">
          <Link
            href="/admin/sections"
            className="rounded-md border border-tzuchiBlue/50 bg-tzuchiBlue/5 px-3 py-1.5 text-xs text-tzuchiBlue hover:bg-tzuchiBlue/10"
          >
            Manage Sections
          </Link>
          <Link
            href="/admin/aphorisms"
            className="rounded-md border border-tzuchiBlue/50 bg-tzuchiBlue/5 px-3 py-1.5 text-xs text-tzuchiBlue hover:bg-tzuchiBlue/10"
          >
            Aphorisms
          </Link>
          <Link
            href="/admin/themes"
            className="rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
          >
            Themes
          </Link>
        </div>
        <h1 className="text-center text-2xl font-semibold text-tzuchiBlue">
          Admin – Records
        </h1>
        <p className="mt-1 text-center text-sm text-slate-600">
          Search by English name or phone number. Tap a record to edit or
          delete.
        </p>
      </header>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="flex flex-col gap-2 rounded-xl bg-white p-3 shadow-sm">
        <div className="flex gap-2">
          <input
            className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-tzuchiBlue focus:outline-none focus:ring-1 focus:ring-tzuchiBlue"
            placeholder="Search name or phone"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            type="button"
            onClick={handleSearch}
            className="inline-flex items-center justify-center rounded-md bg-tzuchiBlue px-3 py-2 text-sm font-medium text-white hover:bg-blue-800"
          >
            Search
          </button>
        </div>
        {loading && (
          <p className="text-xs text-slate-500">Loading records…</p>
        )}
      </section>

      <section className="flex-1 overflow-auto rounded-xl bg-white p-3 shadow-sm">
        {rows.length === 0 && !loading && (
          <p className="text-center text-xs text-slate-500">
            No records found.
          </p>
        )}
        <ul className="divide-y divide-slate-100">
          {rows.map((row) => (
            <li key={row.id} className="py-3">
              <div className="flex items-start justify-between gap-2">
                {/* Clickable text area for editing */}
                <div
                  className="flex-1 cursor-pointer text-sm"
                  onClick={() => setEditing(row)}
                >
                  <p className="font-medium">
                    {row.englishName}
                    {row.chineseName ? ` (${row.chineseName})` : ""}
                  </p>
                  <p className="text-xs text-slate-500">{row.phoneNumber}</p>
                  {/* Section chips */}
                  {row.sections && row.sections.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {row.sections.map((sec) => (
                        <span
                          key={sec.sectionId}
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${
                            sec.isFireflyRelease
                              ? "bg-green-100 text-green-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {sec.sectionName}
                          {sec.isFireflyRelease ? " ✓" : ""}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveSection(row.id, sec.sectionId);
                            }}
                            className="ml-0.5 hover:text-red-600"
                            title="Remove section"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Button Group: View Photo & Delete */}
                <div className="flex gap-2 flex-shrink-0"> 
                    <a
                      href={row.postUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-md border border-tzuchiBlue/50 bg-tzuchiBlue/5 px-2 py-1 text-xs text-tzuchiBlue hover:bg-tzuchiBlue/10"
                    >
                      View Photo
                    </a>
                    <button
                      type="button"
                      onClick={() => handleDelete(row.id)}
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

      {editing && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-4 shadow-lg">
            <h2 className="text-sm font-semibold text-tzuchiBlue">
              Edit Record
            </h2>
            <div className="mt-3 flex flex-col gap-2">
              <input
                className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-tzuchiBlue focus:outline-none focus:ring-1 focus:ring-tzuchiBlue"
                value={editing.englishName}
                onChange={(e) =>
                  setEditing({ ...editing, englishName: e.target.value })
                }
                placeholder="English Name"
              />
              <input
                className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-tzuchiBlue focus:outline-none focus:ring-1 focus:ring-tzuchiBlue"
                value={editing.chineseName ?? ""}
                onChange={(e) =>
                  setEditing({ ...editing, chineseName: e.target.value })
                }
                placeholder="Chinese Name"
              />
              <input
                className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-tzuchiBlue focus:outline-none focus:ring-1 focus:ring-tzuchiBlue"
                value={editing.phoneNumber}
                onChange={(e) =>
                  setEditing({ ...editing, phoneNumber: e.target.value })
                }
                placeholder="Phone Number"
              />
              <input
                className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-tzuchiBlue focus:outline-none focus:ring-1 focus:ring-tzuchiBlue"
                value={editing.email ?? ""}
                onChange={(e) =>
                  setEditing({ ...editing, email: e.target.value })
                }
                placeholder="Email"
              />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
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
