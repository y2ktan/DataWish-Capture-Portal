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
  postcode?: string;
  email?: string;
  createdAt: string;
  downloadToken: string;
  postUrl: string;
  sections: SectionCheckin[];
}

interface SectionOption {
  id: number;
  name: string;
}

export default function AdminPage() {
  const [passwordInput, setPasswordInput] = useState("");
  const [authorized, setAuthorized] = useState(false);

  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<AdminMomentRow[]>([]);

  const [editing, setEditing] = useState<AdminMomentRow | null>(null);
  const [checkinModal, setCheckinModal] = useState<AdminMomentRow | null>(null);
  const [sections, setSections] = useState<SectionOption[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<number | null>(null);
  const [releaseFirefly, setReleaseFirefly] = useState(true);
  const [checkinLoading, setCheckinLoading] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    if (authorized) {
      handleSearch();
      fetchSections();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authorized]);

  const fetchSections = async () => {
    try {
      const res = await fetch("/api/sections");
      if (res.ok) {
        const data = await res.json();
        setSections(data);
        if (data.length > 0) {
          setSelectedSectionId(data[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to fetch sections:", err);
    }
  };

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

  const handleSearch = async (page: number = 1) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/moments?q=${encodeURIComponent(query)}&page=${page}&limit=50`, {
        headers: {
          "x-admin-key": passwordInput
        }
      });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.error || "Failed to load records.");
      }
      const json = await res.json();
      setRows(json.data as AdminMomentRow[]);
      setCurrentPage(json.pagination.page);
      setTotalPages(json.pagination.totalPages);
      setTotalCount(json.pagination.totalCount);
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

  const handleDownloadPdf = async () => {
    try {
      const res = await fetch("/api/admin/export-pdf", {
        headers: {
          "x-admin-key": passwordInput
        }
      });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.error || "Failed to download PDF.");
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `registered-users-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
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
          postcode: editing.postcode,
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

  const handleManualCheckin = async () => {
    if (!checkinModal || !selectedSectionId) return;
    setCheckinLoading(true);
    try {
      const res = await fetch("/api/admin/moments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": passwordInput
        },
        body: JSON.stringify({
          momentId: checkinModal.id,
          sectionId: selectedSectionId,
          releaseFirefly
        })
      });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.error || "Failed to check in.");
      }
      // Update local state to add the new section
      const sectionName = sections.find(s => s.id === selectedSectionId)?.name || "Unknown";
      setRows((prev) =>
        prev.map((r) =>
          r.id === checkinModal.id
            ? {
                ...r,
                sections: [
                  ...r.sections.filter(s => s.sectionId !== selectedSectionId),
                  { id: 0, sectionId: selectedSectionId, sectionName, isFireflyRelease: releaseFirefly ? 1 : 0 }
                ]
              }
            : r
        )
      );
      setCheckinModal(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unexpected error occurred.";
      setError(message);
    } finally {
      setCheckinLoading(false);
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
          <button
            type="button"
            onClick={handleDownloadPdf}
            className="rounded-md border border-green-500 bg-green-50 px-3 py-1.5 text-xs text-green-700 hover:bg-green-100"
          >
            Download CSV
          </button>
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
            onClick={() => handleSearch(1)}
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
          {rows.map((row, index) => (
            <li key={row.id} className="py-3">
              <div className="flex items-start justify-between gap-2">
                {/* Row number - show global index based on pagination */}
                <span className="flex-shrink-0 w-8 text-sm font-medium text-slate-400">
                  {(currentPage - 1) * 50 + index + 1}.
                </span>
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
                  {row.postcode && (
                    <p className="text-xs text-slate-400">Postcode: {row.postcode}</p>
                  )}
                  {row.email && (
                    <p className="text-xs text-slate-400">Email: {row.email}</p>
                  )}
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
                
                {/* Button Group: Check In, View Photo & Delete */}
                <div className="flex gap-2 flex-shrink-0"> 
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCheckinModal(row);
                      }}
                      className="rounded-md border border-green-500 bg-green-50 px-2 py-1 text-xs text-green-700 hover:bg-green-100"
                    >
                      Check In
                    </button>
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

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
            <p className="text-xs text-slate-500">
              Showing {(currentPage - 1) * 50 + 1} - {Math.min(currentPage * 50, totalCount)} of {totalCount} records
            </p>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => handleSearch(1)}
                disabled={currentPage === 1}
                className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                First
              </button>
              <button
                type="button"
                onClick={() => handleSearch(currentPage - 1)}
                disabled={currentPage === 1}
                className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Prev
              </button>
              <span className="px-2 py-1 text-xs text-slate-600">
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => handleSearch(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
              <button
                type="button"
                onClick={() => handleSearch(totalPages)}
                disabled={currentPage === totalPages}
                className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Last
              </button>
            </div>
          </div>
        )}
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
                value={editing.postcode ?? ""}
                onChange={(e) =>
                  setEditing({ ...editing, postcode: e.target.value })
                }
                placeholder="Postcode"
              />
              <input
                className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-tzuchiBlue focus:outline-none focus:ring-1 focus:ring-tzuchiBlue"
                value={editing.email ?? ""}
                onChange={(e) =>
                  setEditing({ ...editing, email: e.target.value })
                }
                placeholder="Email"
                type="email"
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

      {/* Manual Check-in Modal */}
      {checkinModal && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-4 shadow-lg">
            <h2 className="text-sm font-semibold text-tzuchiBlue">
              Manual Check-in
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Check in <strong>{checkinModal.englishName}</strong> to a section
            </p>
            <div className="mt-3 flex flex-col gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Select Section
                </label>
                <select
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-tzuchiBlue focus:outline-none focus:ring-1 focus:ring-tzuchiBlue"
                  value={selectedSectionId ?? ""}
                  onChange={(e) => setSelectedSectionId(Number(e.target.value))}
                >
                  {sections.map((sec) => (
                    <option key={sec.id} value={sec.id}>
                      {sec.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="releaseFirefly"
                  checked={releaseFirefly}
                  onChange={(e) => setReleaseFirefly(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-tzuchiBlue focus:ring-tzuchiBlue"
                />
                <label htmlFor="releaseFirefly" className="text-xs text-slate-700">
                  Release firefly (show on tree)
                </label>
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCheckinModal(null)}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleManualCheckin}
                disabled={checkinLoading || !selectedSectionId}
                className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                {checkinLoading ? "Checking in..." : "Check In"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
