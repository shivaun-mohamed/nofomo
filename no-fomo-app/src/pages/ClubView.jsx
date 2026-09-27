import { useState } from "react";
import FullCalendar from "@fullcalendar/react";
import themePlugin from "@fullcalendar/react/themes/monarch";
import dayGridPlugin from "@fullcalendar/react/daygrid";

import "@fullcalendar/react/skeleton.css";
import "@fullcalendar/react/themes/monarch/theme.css";

import AddEventForm from "../components/AddEventForm";
import "./ClubView.css";

function ClubView() {
  const [events, setEvents] = useState([]);
  const calendarEvents = events.map((event) => ({
    id: event.id,
    title: event.title,
    start: event.startsAt,
    end: event.endsAt,
  }));

  return (
    <main className="club-view">
      <header className="club-view__header">
        <h1>Club dashboard</h1>
        <p>View your club’s schedule and add upcoming events.</p>
      </header>

      <div className="club-view__layout">
        <section
          className="club-view__calendar"
          aria-label="Club event calendar"
        >
          <h2>Your club’s calendar</h2>

          <FullCalendar
            plugins={[themePlugin, dayGridPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: "prev,next",
              center: "title",
              right: "today",
            }}
            height="auto"
            fixedWeekCount={false}
            dayMaxEvents={2}
            events={calendarEvents}
          />
        </section>

        <div className="club-view__form">
          <AddEventForm onAddEvent={(event) => setEvents((currentEvents) => [...currentEvents, event])} />
        </div>
      </div>
    </main>
  );
}



export default ClubView;