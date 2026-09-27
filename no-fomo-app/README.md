# NOMO

**A little less scrolling. A lot more showing up.**

NOMO brings UBC club events together in one calendar. Students can browse and filter events, while clubs can share upcoming events through a simple dashboard.

## The problem

Campus events are often scattered across club social media accounts. Students can miss events they would enjoy because they have to find and follow many separate accounts.

## What NOMO does

- Shows club events in a monthly calendar.
- Lets students search events and filter by club, category, price, deadlines, food, and recurrence.
- Opens event details, including time, location, cost, requirements, deadlines, and club information.
- Provides an **Add to Google Calendar** link that opens Google Calendar with an event pre-filled for the user to review and save.
- Gives clubs a dashboard to view their calendar and submit events.

## How it works

The frontend is built with React and Vite. FullCalendar displays events in the browser. The Flask backend provides API routes for clubs, events, search, and event creation or deletion. In the current local setup, the API reads and writes JSON files in `backend/`.

When a club submits an event, the frontend sends its details to Flask. The backend validates the event and verifies its club, then saves it. The frontend reloads the data so the event appears in the calendar.

The Google Calendar action is a pre-filled link generated in the browser. NOMO does not sign in to Google or automatically sync calendars.

## Run locally

You need Python and Node.js/npm installed. Start the backend and frontend in separate terminals.

### 1. Start the Flask API

From the repository root:

```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
py api.py
```

The API runs at `http://127.0.0.1:5000`.

### 2. Start the frontend

In a second terminal, from the repository root:

```powershell
cd no-fomo-app
npm install
npm run dev
```

Open the local URL printed by Vite (usually `http://localhost:5173`). Vite forwards `/api` requests to the Flask server.

## API overview

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/clubs` | List clubs |
| `GET` | `/api/events` | List events in calendar format |
| `GET` | `/api/search?q=term` | Search clubs and events |
| `POST` | `/api/events` | Validate and create an event |
| `PUT` | `/api/events/<event_id>` | Update an event |
| `DELETE` | `/api/events/<event_id>` | Delete an event |

## Project structure

```text
backend/
  api.py                 Flask API routes
  edit_event.py          Event validation and JSON-file updates
  data_club.json         Local club data
  data_event.json        Local event data
no-fomo-app/
  src/App.jsx            Main page flow and student calendar
  src/pages/ClubView.jsx Club dashboard
  src/components/        Event submission form
  src/components2/       Event details modal and Google Calendar link
```

## Useful commands

From `no-fomo-app/`:

```bash
npm run build  # Create a production frontend build in dist/
npm run lint   # Check frontend code with ESLint
```

## Data and deployment notes

The local Flask API uses `backend/data_club.json` and `backend/data_event.json`. The repository also contains database and deployment setup files; check `backend/DEPLOYMENT.md` before deploying, and verify that its deployment instructions match the API version being deployed.
