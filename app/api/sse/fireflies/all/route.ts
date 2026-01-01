import { NextRequest } from "next/server";
import { registerGlobalConnection, unregisterGlobalConnection, getInitialFirefliesAll } from "@/lib/sseManager";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();
  let controllerRef: ReadableStreamDefaultController | null = null;

  const stream = new ReadableStream({
    start(controller) {
      controllerRef = controller;
      
      // Register this global connection
      registerGlobalConnection(controller);
      
      // Send initial sync event with all current fireflies
      const initialFireflies = getInitialFirefliesAll();
      const syncEvent = `event: sync\ndata: ${JSON.stringify(initialFireflies)}\n\n`;
      controller.enqueue(encoder.encode(syncEvent));
      
      // Send heartbeat every 30 seconds to keep connection alive
      const heartbeatInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: heartbeat\n\n`));
        } catch {
          clearInterval(heartbeatInterval);
        }
      }, 30000);
      
      // Store interval for cleanup
      (controller as any)._heartbeatInterval = heartbeatInterval;
    },
    cancel() {
      if (controllerRef) {
        const interval = (controllerRef as any)._heartbeatInterval;
        if (interval) clearInterval(interval);
        unregisterGlobalConnection(controllerRef);
      }
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no", // Disable nginx buffering
    },
  });
}
