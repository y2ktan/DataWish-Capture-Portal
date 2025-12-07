# AI-Powered Memorable Moment Capture (MVP)

A Next.js web application that captures user photos at events, processes them with AI background replacement and Jing Si aphorisms, and provides QR code downloads.

## Features

### Core Features
- **User Registration & Photo Capture**: Mobile-friendly form with camera access
  - Capture photos using front or back camera
  - Switch between cameras with a single tap
  - Real-time camera preview
  - Photo review before submission
- **AI Processing**: Background replacement with themed assets and Jing Si aphorism overlay
- **QR Code Generation**: Unique download links via QR codes
- **Email Delivery**: Send QR code and photo link directly to user's email address
- **QR Scanner**: Scan QR codes to view moments and navigate to the Spirit Tree
- **Spirit Tree Visualization**: Interactive 3D tree with firefly animations
  - Each firefly represents a captured moment
  - Real-time data from database displayed as floating fireflies
  - "Release" button for new moments to join the tree
- **Admin Panel**: Password-protected management interface at `/admin`
  - Search moments by name or phone number
  - Edit user information
  - Delete records

### Technical Features
- **SQLite Database**: Lightweight, file-based database (no external database server required)
- **Rate Limiting**: All API endpoints are rate-limited to prevent abuse
- **Mobile-First Design**: Responsive UI optimized for mobile devices
- **Secure Tokens**: Non-guessable download tokens for photo access

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# SQLite Database (optional - defaults to data/moments.db)
SQLITE_DB_PATH=./data/moments.db

# Admin Key for accessing the admin panel
# Set a strong, random password here
ADMIN_KEY=your-secure-admin-key-here

# Public admin key (same as ADMIN_KEY for MVP)
# This is used by the frontend to verify admin access
NEXT_PUBLIC_ADMIN_KEY=your-secure-admin-key-here

# Email Configuration (for sending QR codes via email)
# SMTP settings for sending emails
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=your-email@gmail.com

# Base URL for email links (optional - defaults to request origin)
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

**Note:** 
- The SQLite database will be automatically created in the `data/` directory if it doesn't exist
- For Gmail, you'll need to use an [App Password](https://support.google.com/accounts/answer/185833) instead of your regular password
- Email functionality is optional - the app works without it, but users won't be able to receive emails

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## User Flow

1. **Registration**: User fills out form with:
   - English Name (required)
   - Phone Number (required)
   - Chinese Name (optional)
   - Email (optional, but required for email delivery feature)

2. **Photo Capture**: 
   - User accesses camera
   - Can switch between front and back camera
   - Captures photo
   - Reviews photo and can recapture if needed

3. **Processing**: 
   - Photo is processed with AI (background replacement + aphorism)
   - Unique download token is generated
   - Photo is saved to database

4. **Result Page**:
   - Displays processed photo with Jing Si aphorism
   - Shows QR code for easy download
   - Option to send QR code via email (if email was provided)

## API Endpoints

All API endpoints are rate-limited to prevent abuse.

### Public Endpoints
- `POST /api/moments` - Create a new moment (registration + photo)
- `GET /api/moments/[token]` - Retrieve a moment by download token
- `POST /api/moments/[token]/email` - Send QR code to user's email

### Admin Endpoints (Protected)
- `GET /api/admin/moments?q=search` - Search moments (admin only)
- `PUT /api/admin/moments` - Update a moment (admin only)
- `DELETE /api/admin/moments?id=...` - Delete a moment (admin only)

## Database Schema

The SQLite database uses the following schema:

```sql
CREATE TABLE moments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  englishName TEXT NOT NULL,
  chineseName TEXT,
  phoneNumber TEXT NOT NULL,
  email TEXT,
  rawImageDataUrl TEXT NOT NULL,
  photoAssetUrl TEXT NOT NULL,
  aphorism TEXT NOT NULL,
  downloadToken TEXT NOT NULL UNIQUE,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## Security

- Rate limiting on all API endpoints (30 requests per minute per IP)
- Non-guessable download tokens (32-character hex strings)
- Admin routes protected by API key
- Environment variables for sensitive configuration
- SQLite database file should be kept secure (not committed to version control)

## Troubleshooting

### Build/Webpack Errors

- **"Cannot find module './948.js'" or similar webpack errors**: This is a stale build cache issue. Fix it by:
  ```bash
  # Option 1: Clear cache and restart dev server
  npm run dev:clean
  
  # Option 2: Manual cleanup
  rm -rf .next
  npm run dev
  
  # Option 3: Full clean (if above doesn't work)
  rm -rf .next node_modules
  npm install
  npm run dev
  ```

### Database Issues

- **Database file not found**: The `data/` directory and database file will be created automatically on first run
- **Permission errors**: Ensure the app has write permissions to create the `data/` directory

### Email Issues

- **"Email service not configured"**: Make sure `SMTP_USER` and `SMTP_PASS` are set in `.env.local`
- **Gmail authentication fails**: Use an App Password instead of your regular Gmail password
- **Email not sending**: Check SMTP settings and ensure your email provider allows SMTP access

### Camera Issues

- **Camera not working**: Ensure you're accessing the app over HTTPS or localhost (required for camera access)
- **Can't switch cameras**: Some devices only have one camera - the switch button will still work but may not change the view

### General Issues

- **500 Internal Server Error**: Check server console logs for specific error messages
- **Admin page not loading**: Make sure `NEXT_PUBLIC_ADMIN_KEY` is set in `.env.local`

## Next Steps

The image processing pipeline in `lib/imageProcessing.ts` is currently a stub. Replace it with:
1. Real AI background removal/segmentation
2. Themed background compositing
3. Cloud storage upload
4. Image optimization

## Technology Stack

- **Framework**: Next.js 14 (App Router) or later
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **3D Graphics**: Three.js (Spirit Tree visualization)
- **QR Code Scanning**: html5-qrcode
- **QR Code Generation**: qrcode
- **Database**: SQLite (better-sqlite3)
- **Email**: Nodemailer


---
1. QR scanning page
http://localhost:3000/scan

2. Spirit Tree page FOR Projection (All Fireflies from database)
http://localhost:3000/tree

3. Spirit Tree page from QR scanning page (New Firefly from QR code)
http://localhost:3000/tree?name=Ray