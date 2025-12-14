# Application Documentation

## Getting Started for New Developers

Welcome to the project! Here's some vital information to help you get started:

1.  **Run the application:**
    ```bash
    npm install
    npm run dev
    ```
2.  **Core Technologies:** This is a [Next.js](https://nextjs.org/) application using [React](https://react.dev/) and [TypeScript](https://www.typescriptlang.org/). Styling is done with [Tailwind CSS](https://tailwindcss.com/).
3.  **Project Structure:** The main logic is in the `app/` directory, following the Next.js App Router conventions. API routes are in `app/api/`, and UI pages are defined by `page.tsx` files.
4.  **Data Persistence:** The application uses a custom data persistence layer. Look at `lib/db.ts` and `models/Moment.ts` to understand how data is stored and accessed.
5.  **Image Processing:** Image manipulation is a key feature. See `lib/imageProcessing.ts` for details on how images are processed.

## Authentication and Authorization

The application does not have a traditional user authentication system (no logins or passwords). Instead, it uses a **token-based system for accessing "moments"**.

### Token Acquisition

A unique token is generated when a new "moment" is created. This happens in the `POST /api/moments` endpoint.

-   **How it works:** When a user submits their information and a photo, the server processes the image, creates a new "moment" record, and generates a random 16-byte token.
-   **API Response:** The `POST /api/moments` endpoint returns the generated token in the response body.

### Using the Token

The token is used to access a specific "moment" and its associated resources. It is passed as part of the URL.

-   **Example:** To view the result page for a moment, you would use the URL: `/result/{token}`
-   **Example:** To fetch the data for a moment, you would use the API endpoint: `GET /api/moments/{token}`

**Important:** These tokens are public but unguessable. Anyone with the token can access the corresponding moment's data. All API endpoints are rate-limited to prevent abuse.

## UI Pages

-   `/`: The main landing page of the application.
-   `/admin`: The main dashboard for administrative tasks.
-   `/admin/sections`: A page for managing sections (add, rename, delete).
-   `/admin/themes`: A page for managing themes within the admin panel.
-   `/result/[token]`: A page to display a specific result, identified by a token.
-   `/scan`: A page that provides a QR code scanning interface with section selection.
-   `/tree`: A page for displaying a tree-like structure with fireflies. Supports `?section=X` to filter by section.

## API Endpoints

-   `POST /api/moments`: Creates a new "moment". This involves processing an uploaded image, generating a unique token, and saving the moment's data. Returns the token and other data.
-   `GET /api/moments/[token]`: Retrieves the data for a specific moment. The `{token}` is the unique identifier returned by the `POST /api/moments` endpoint.
-   `POST /api/moments/[token]/email`: Sends an email related to a specific moment.
-   `GET /api/admin/backgrounds`: Retrieves a list of admin-configurable backgrounds.
-   `POST /api/admin/backgrounds`: Adds a new background.
-   `GET /api/admin/moments`: Retrieves a list of all moments for administrative purposes.

## Sections Feature

The application supports multiple "sections" for organizing check-ins. Each section has its own tree view with fireflies. This allows the same user to check in to multiple sections and release their firefly in each section's tree.

### Section Management (Admin)
- `/admin/sections`: Manage sections (add, rename, delete)
- Default section "Section 1" is created automatically on first run
- Sections can be customized with any name (e.g., "Morning Session", "Hall A", etc.)
- Cannot delete the last remaining section

### Section Check-in Flow
1. User scans QR code at `/scan`
2. User selects a section from the dropdown menu
3. User clicks "Check In & Go to Tree" to register for that section
4. User is redirected to `/tree?section=X&name=Y&token=Z`
5. User clicks the release button to release their firefly for that section
6. The same user can scan again, select a different section, and release another firefly there

### Section API Endpoints
- `GET /api/sections`: List all sections (public)
- `POST /api/sections`: Create a new section (admin only, requires `x-admin-key` header)
- `PUT /api/sections/[id]`: Update section name (admin only)
- `DELETE /api/sections/[id]`: Delete a section (admin only, cannot delete last section)
- `POST /api/moments/[token]/checkin`: Check-in to a section `{sectionId: X}`
- `PUT /api/moments/[token]/checkin`: Mark firefly as released for a section `{sectionId: X}`
- `GET /api/moments/[token]/checkin?sectionId=X`: Get check-in status for a section
- `GET /api/moments?section=X`: Get fireflies released in a specific section

### Database Schema (Sections)
- `sections` table: id, name, displayOrder, createdAt
- `section_checkins` table: id, momentId, sectionId, isFireflyRelease, checkedInAt

## Real-time Updates (SSE)

The tree page uses Server-Sent Events (SSE) for real-time firefly updates instead of polling.

### How it Works
1. **Chokidar File Watcher**: Monitors the SQLite database file (`data/moments.db`) for changes
2. **SSE Endpoint**: `/api/sse/fireflies?section=X` maintains persistent connections with tree clients
3. **Event Types**:
   - `sync`: Initial full list of fireflies when connection opens
   - `add`: New firefly released (name added)
   - `remove`: Firefly removed (admin removed section from user)

### Benefits
- **Real-time**: Changes appear instantly (no 6-second polling delay)
- **Bi-directional**: Supports both adding AND removing fireflies
- **Efficient**: Only sends changes, not full list on every update
- **Admin Control**: When admin removes a section chip, firefly disappears from tree immediately

### Technical Details
- SSE manager: `lib/sseManager.ts`
- SSE endpoint: `app/api/sse/fireflies/route.ts`
- Debounce: 150ms to avoid duplicate events from WAL mode
- Heartbeat: Every 30 seconds to keep connections alive

## File Structure

| Path                  | Description                                                                  |
| --------------------- | ---------------------------------------------------------------------------- |
| `app/`                | Contains the core application logic, including UI pages and API routes.      |
| `public/`             | Stores static assets like images, fonts, and other files.                    |
| `lib/`                | Holds utility functions and libraries used across the application.           |
| `models/`             | Defines data models or schemas, for "Moment" and "Section".                  |
| `data/`               | Likely used for storing data files, such as JSON or CSVs.                    |
| `certificates/`       | Possibly for storing SSL certificates or other security-related files.       |
| `server.js`           | A custom server file, which might be used for a custom backend setup.        |
| `next.config.mjs`     | Configuration file for the Next.js framework.                                |
| `package.json`        | Lists project dependencies and scripts.                                      |
| `tailwind.config.ts`  | Configuration file for the Tailwind CSS framework.                           |
| `tsconfig.json`       | TypeScript configuration for the project.                                    |

### `app/` Directory Structure

| Path                             | Description                                                              |
| -------------------------------- | ------------------------------------------------------------------------ |
| `app/globals.css`                | Global CSS styles for the application.                                   |
| `app/layout.tsx`                 | The main layout component for the entire application.                    |
| `app/page.tsx`                   | The entry point for the UI, corresponding to the `/` route.              |
| `app/admin/`                     | Contains pages and components for the admin section.                     |
| `app/api/`                       | Defines the API endpoints for the application.                           |
| `app/result/[token]/page.tsx`    | Dynamic page to display a result based on a token.                       |
| `app/scan/`                      | UI and logic for the scanning feature.                                   |
| `app/tree/`                      | UI and logic for the tree visualization.                                 |
