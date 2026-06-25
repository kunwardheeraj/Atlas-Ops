# Atlas Ops - Intelligent Field Service Management

Atlas Ops is an offline-first mobile and web platform powered by artificial intelligence, designed to streamline and automate field technician workflows and dispatcher reporting. By bridging the gap between dynamic field environments and centralized operations, the platform ensures robust data synchronization, intelligent report generation, and highly responsive operational tracking.

## System Architecture

Atlas Ops is structured as a modern monorepo, separating concerns across specialized stacks to ensure scalability, offline reliability, and a premium user experience:

*   **Frontend (Web Dashboard):** Next.js 14, Tailwind CSS, Shadcn UI, and Framer Motion. Features a highly interactive, 3D "iOS Liquid Glass" glassmorphic UI.
*   **Backend (API & Core Logic):** Node.js, Express, PostgreSQL, and Prisma ORM for type-safe, relational data management.
*   **Mobile (Field Client):** Flutter and SQLite. Engineered with a robust offline-first architecture to support technicians in low-connectivity environments.
*   **AI Integration:** Google Gemini API. Seamlessly processes field data to provide asynchronous, automated inspection report generation.

## Core Features

*   **Real-time Dispatch Dashboard with Live Map Tracking:** A premium command center providing dispatchers with real-time geographic insights into active jobs and technician locations.
*   **Automated AI Inspection Reports via Gemini:** Automatically analyzes job completion data to synthesize professional, context-aware inspection reports.
*   **Offline-First Mobile App with Conflict-Free Syncing:** Ensures technicians can complete workflows, capture data, and change statuses entirely offline, with background queue-based synchronization.
*   **3D Interactive Authentication Gateway:** A high-performance, physics-based fluid login gateway utilizing Framer Motion for a stunning first impression.

## Local Setup & Installation

Follow these steps to deploy and run the Atlas Ops platform locally for evaluation.

### Prerequisites
*   [Node.js](https://nodejs.org/) (v18 or higher)
*   [Flutter SDK](https://flutter.dev/) (v3.0 or higher)
*   [PostgreSQL](https://www.postgresql.org/) (v14 or higher)

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/atlas-platform.git
cd atlas-platform
npm install
```

### 2. Environment Variables
Create a `.env` file in the `apps/backend` directory. Ensure the following critical variables are provided:

**Backend (`apps/backend/.env`)**
```env
DATABASE_URL="postgresql://user:password@localhost:5432/atlas_db?schema=public"
GEMINI_API_KEY="your_google_gemini_api_key_here"
PORT=3001
```

### 3. Database Initialization
Navigate to the backend and initialize the PostgreSQL database schema:
```bash
cd apps/backend
npx prisma generate
npx prisma db push
```

### 4. Running the Platform

**Start the Backend API:**
```bash
cd apps/backend
npm run dev
```

**Start the Web Dashboard:**
Open a new terminal window:
```bash
cd apps/web
npm run dev
```
*The web dashboard will be available at http://localhost:3000.*

**Start the Mobile Application:**
Ensure you have a mobile emulator running or a physical device connected. Open a new terminal window:
```bash
cd apps/mobile
flutter run
```
