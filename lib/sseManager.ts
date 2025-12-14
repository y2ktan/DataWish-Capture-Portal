import * as chokidar from "chokidar";
import path from "path";
import { Section } from "@/models/Section";

// Store active SSE connections per section
const sectionConnections = new Map<number, Set<ReadableStreamDefaultController>>();
const sectionFireflies = new Map<number, Set<string>>();

let watcher: ReturnType<typeof chokidar.watch> | null = null;
let debounceTimer: NodeJS.Timeout | null = null;

// Initialize the file watcher (singleton)
export function initWatcher() {
  if (watcher) return;

  const dbPath = process.env.SQLITE_DB_PATH || path.join(process.cwd(), "data", "moments.db");
  
  watcher = chokidar.watch([dbPath, `${dbPath}-wal`, `${dbPath}-shm`], {
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 100,
      pollInterval: 50
    }
  });

  watcher.on("change", () => {
    // Debounce to avoid multiple events for single DB operation
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      broadcastChanges();
    }, 150);
  });

  console.log("[SSE] Chokidar watcher initialized for database changes");
}

// Broadcast changes to all connected clients
function broadcastChanges() {
  sectionConnections.forEach((controllers, sectionId) => {
    if (controllers.size === 0) return;

    try {
      const currentFireflies = Section.getReleasedFirefliesBySection(sectionId);
      const currentNames = new Set(currentFireflies.map(f => f.englishName));
      const previousNames = sectionFireflies.get(sectionId) || new Set();

      // Find added fireflies
      const added: string[] = [];
      currentNames.forEach(name => {
        if (!previousNames.has(name)) {
          added.push(name);
        }
      });

      // Find removed fireflies
      const removed: string[] = [];
      previousNames.forEach(name => {
        if (!currentNames.has(name)) {
          removed.push(name);
        }
      });

      // Update cached state
      sectionFireflies.set(sectionId, currentNames);

      // Send events to all controllers for this section
      controllers.forEach(controller => {
        try {
          if (added.length > 0) {
            added.forEach(name => {
              controller.enqueue(`event: add\ndata: ${JSON.stringify(name)}\n\n`);
            });
          }
          if (removed.length > 0) {
            removed.forEach(name => {
              controller.enqueue(`event: remove\ndata: ${JSON.stringify(name)}\n\n`);
            });
          }
        } catch (err) {
          // Controller might be closed, remove it
          controllers.delete(controller);
        }
      });

      if (added.length > 0 || removed.length > 0) {
        console.log(`[SSE] Section ${sectionId}: +${added.length} added, -${removed.length} removed`);
      }
    } catch (err) {
      console.error(`[SSE] Error broadcasting to section ${sectionId}:`, err);
    }
  });
}

// Register a new SSE connection for a section
export function registerConnection(sectionId: number, controller: ReadableStreamDefaultController) {
  initWatcher();

  if (!sectionConnections.has(sectionId)) {
    sectionConnections.set(sectionId, new Set());
  }
  sectionConnections.get(sectionId)!.add(controller);

  // Initialize firefly cache for this section if not exists
  if (!sectionFireflies.has(sectionId)) {
    const fireflies = Section.getReleasedFirefliesBySection(sectionId);
    sectionFireflies.set(sectionId, new Set(fireflies.map(f => f.englishName)));
  }

  console.log(`[SSE] New connection for section ${sectionId}. Total: ${sectionConnections.get(sectionId)!.size}`);
}

// Unregister an SSE connection
export function unregisterConnection(sectionId: number, controller: ReadableStreamDefaultController) {
  const controllers = sectionConnections.get(sectionId);
  if (controllers) {
    controllers.delete(controller);
    console.log(`[SSE] Connection closed for section ${sectionId}. Remaining: ${controllers.size}`);
  }
}

// Get initial fireflies for a section
export function getInitialFireflies(sectionId: number): string[] {
  const fireflies = Section.getReleasedFirefliesBySection(sectionId);
  const names = fireflies.map(f => f.englishName);
  
  // Update cache
  sectionFireflies.set(sectionId, new Set(names));
  
  return names;
}
