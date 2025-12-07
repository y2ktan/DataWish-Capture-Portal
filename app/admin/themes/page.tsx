"use client";

import { useEffect, useState } from "react";

interface BackgroundAsset {
  filename: string;
  url: string;
  createdAt: string;
}

export default function ThemesPage() {
  const [passwordInput, setPasswordInput] = useState("");
  const [authorized, setAuthorized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [backgrounds, setBackgrounds] = useState<BackgroundAsset[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (authorized) {
      loadBackgrounds();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const loadBackgrounds = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/backgrounds", {
        headers: {
          "x-admin-key": passwordInput
        }
      });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.error || "Failed to load backgrounds.");
      }
      const json = await res.json();
      setBackgrounds(json);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unexpected error occurred.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side validation
    const allowedTypes = ["image/jpeg", "image/png"];
    if (!allowedTypes.includes(file.type)) {
      setError("Invalid file type. Only JPEG and PNG are allowed.");
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setError("File too large. Maximum size is 5MB.");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/backgrounds", {
        method: "POST",
        headers: {
          "x-admin-key": passwordInput
        },
        body: formData
      });

      const json = await res.json();
      
      if (!res.ok) {
        throw new Error(json?.error || "Failed to upload background.");
      }

      // Show warning if any
      if (json.warning) {
        setWarning(json.warning);
      } else {
        setWarning(null);
      }

      // Reload backgrounds list
      await loadBackgrounds();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unexpected error occurred.";
      setError(message);
    } finally {
      setUploading(false);
      // Reset file input
      e.target.value = "";
    }
  };

  const handleDelete = async (filename: string) => {
    if (!confirm("Are you sure you want to delete this background?")) return;

    try {
      const res = await fetch(`/api/admin/backgrounds?filename=${encodeURIComponent(filename)}`, {
        method: "DELETE",
        headers: {
          "x-admin-key": passwordInput
        }
      });

      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.error || "Failed to delete background.");
      }

      setBackgrounds((prev) => prev.filter((bg) => bg.filename !== filename));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unexpected error occurred.";
      setError(message);
    }
  };

  if (!authorized) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm rounded-xl bg-white p-4 shadow-sm">
          <h1 className="text-center text-lg font-semibold text-tzuchiBlue">
            Background Themes
          </h1>
          <p className="mt-1 text-center text-xs text-slate-500">
            Enter the admin key to manage background themes.
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
              onKeyDown={(e) => e.key === "Enter" && handleAuth()}
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
        <h1 className="text-center text-2xl font-semibold text-tzuchiBlue">
          Background Themes
        </h1>
        <p className="mt-1 text-center text-sm text-slate-600">
          Manage background images for photo processing.
        </p>
      </header>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {warning && (
        <div className="rounded-md border border-yellow-200 bg-yellow-50 px-3 py-2 text-sm text-yellow-700">
          ⚠️ {warning}
        </div>
      )}

      {/* Upload Section */}
      <section className="rounded-xl bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Upload New Background</h2>
        <div className="flex flex-col gap-2">
          <label className="relative cursor-pointer">
            <input
              type="file"
              accept="image/jpeg,image/png"
              onChange={handleUpload}
              disabled={uploading}
              className="hidden"
            />
            <div className={`flex items-center justify-center rounded-lg border-2 border-dashed border-slate-300 p-6 transition-colors ${uploading ? "bg-slate-100" : "hover:border-tzuchiBlue hover:bg-blue-50"}`}>
              {uploading ? (
                <span className="text-sm text-slate-500">Uploading...</span>
              ) : (
                <div className="text-center">
                  <span className="text-3xl">📷</span>
                  <p className="mt-2 text-sm text-slate-600">
                    Click to upload a background image
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    JPEG or PNG, max 5MB, recommended 1080×1080px
                  </p>
                </div>
              )}
            </div>
          </label>
        </div>
      </section>

      {/* Backgrounds Grid */}
      <section className="flex-1 rounded-xl bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-700">
            Available Backgrounds ({backgrounds.length})
          </h2>
          <button
            onClick={loadBackgrounds}
            disabled={loading}
            className="text-xs text-tzuchiBlue hover:underline"
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>

        {loading && backgrounds.length === 0 && (
          <p className="text-center text-xs text-slate-500 py-8">Loading backgrounds...</p>
        )}

        {!loading && backgrounds.length === 0 && (
          <div className="text-center py-8">
            <span className="text-4xl">🖼️</span>
            <p className="mt-2 text-sm text-slate-500">No backgrounds uploaded yet.</p>
            <p className="text-xs text-slate-400">Upload your first background above.</p>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {backgrounds.map((bg) => (
            <div
              key={bg.filename}
              className="group relative rounded-lg overflow-hidden border border-slate-200 aspect-square"
            >
              <img
                src={bg.url}
                alt={bg.filename}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button
                  onClick={() => handleDelete(bg.filename)}
                  className="rounded-md bg-red-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-600"
                >
                  Delete
                </button>
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1">
                <p className="text-xs text-white truncate">{bg.filename}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Back to Admin Link */}
      <div className="text-center">
        <a
          href="/admin"
          className="text-sm text-tzuchiBlue hover:underline"
        >
          ← Back to Admin Records
        </a>
      </div>
    </main>
  );
}
