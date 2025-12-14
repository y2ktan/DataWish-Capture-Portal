"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Section {
  id: number;
  name: string;
  displayOrder: number;
  createdAt: string;
}

export default function AdminSectionsPage() {
  const [passwordInput, setPasswordInput] = useState("");
  const [authorized, setAuthorized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(false);
  const [newSectionName, setNewSectionName] = useState("");
  const [editingSection, setEditingSection] = useState<Section | null>(null);

  useEffect(() => {
    if (authorized) {
      fetchSections();
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

  const fetchSections = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/sections");
      if (!res.ok) throw new Error("Failed to fetch sections");
      const data = await res.json();
      setSections(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load sections");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSection = async () => {
    if (!newSectionName.trim()) return;
    try {
      const res = await fetch("/api/sections", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": passwordInput,
        },
        body: JSON.stringify({ name: newSectionName.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create section");
      }
      setNewSectionName("");
      fetchSections();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create section");
    }
  };

  const handleUpdateSection = async () => {
    if (!editingSection || !editingSection.name.trim()) return;
    try {
      const res = await fetch(`/api/sections/${editingSection.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": passwordInput,
        },
        body: JSON.stringify({ name: editingSection.name.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update section");
      }
      setEditingSection(null);
      fetchSections();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update section");
    }
  };

  const handleDeleteSection = async (id: number) => {
    if (!confirm("Delete this section? All check-ins for this section will be removed.")) return;
    try {
      const res = await fetch(`/api/sections/${id}`, {
        method: "DELETE",
        headers: {
          "x-admin-key": passwordInput,
        },
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete section");
      }
      fetchSections();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete section");
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
            Enter the admin key to manage sections.
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
        <div className="flex items-center justify-between">
          <Link href="/admin" className="text-sm text-tzuchiBlue hover:underline">
            ← Back to Admin
          </Link>
        </div>
        <h1 className="mt-2 text-center text-2xl font-semibold text-tzuchiBlue">
          Manage Sections
        </h1>
        <p className="mt-1 text-center text-sm text-slate-600">
          Configure sections for check-in and firefly release.
        </p>
      </header>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
          <button onClick={() => setError(null)} className="ml-2 text-red-500 hover:text-red-700">×</button>
        </div>
      )}

      {/* Add New Section */}
      <section className="rounded-xl bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Add New Section</h2>
        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-tzuchiBlue focus:outline-none focus:ring-1 focus:ring-tzuchiBlue"
            placeholder="Section name (e.g., Section 2)"
            value={newSectionName}
            onChange={(e) => setNewSectionName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreateSection()}
          />
          <button
            type="button"
            onClick={handleCreateSection}
            disabled={!newSectionName.trim()}
            className="inline-flex items-center justify-center rounded-md bg-tzuchiBlue px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add
          </button>
        </div>
      </section>

      {/* Sections List */}
      <section className="flex-1 rounded-xl bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Existing Sections</h2>
        {loading ? (
          <p className="text-center text-xs text-slate-500">Loading sections...</p>
        ) : sections.length === 0 ? (
          <p className="text-center text-xs text-slate-500">No sections found.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {sections.map((section) => (
              <li key={section.id} className="py-3 flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium text-slate-800">{section.name}</p>
                  <p className="text-xs text-slate-500">Order: {section.displayOrder}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingSection(section)}
                    className="rounded-md border border-tzuchiBlue/50 bg-tzuchiBlue/5 px-3 py-1.5 text-xs text-tzuchiBlue hover:bg-tzuchiBlue/10"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteSection(section.id)}
                    disabled={sections.length <= 1}
                    className="rounded-md border border-red-200 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    title={sections.length <= 1 ? "Cannot delete the last section" : "Delete section"}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Edit Modal */}
      {editingSection && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-4 shadow-lg">
            <h2 className="text-sm font-semibold text-tzuchiBlue">Edit Section</h2>
            <div className="mt-3">
              <input
                type="text"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-tzuchiBlue focus:outline-none focus:ring-1 focus:ring-tzuchiBlue"
                value={editingSection.name}
                onChange={(e) => setEditingSection({ ...editingSection, name: e.target.value })}
                placeholder="Section name"
              />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingSection(null)}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdateSection}
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
