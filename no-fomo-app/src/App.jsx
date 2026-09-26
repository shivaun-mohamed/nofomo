import FullCalendar from "@fullcalendar/react";
import themePlugin from "@fullcalendar/react/themes/monarch"; // YOUR THEME
import dayGridPlugin from "@fullcalendar/react/daygrid";

import '@fullcalendar/react/skeleton.css'; // ALWAYS NEED SKELETON
import '@fullcalendar/react/themes/monarch/theme.css'; // YOUR THEME

import './App.css'
import data from "./data/data.json";
import { useState } from "react";
import EventModal from "./components2/EventModal";
// import AddEventForm from "./components/addEventForm";


function App() {
  const [selectedEvent, setSelectedEvent] = useState(null);
  const calendarEvents = data.events.map((event) => {
    return {
      id: event.id,
      title: event.title,
      start: event.startsAt,
      end: event.endsAt
    };
  });

  return (
    <main className="calendar-page">
      <section className="calendar-shell" aria-label="Calendar">
        <header className="calendar-intro">
          <p className="eyebrow">YOUR SCHEDULE</p>
          <h1>Calendar</h1>
          <p className="calendar-description">A clear view of what’s ahead.</p>
        </header>
        <div className="calendar-card">
          <FullCalendar
            plugins={[themePlugin, dayGridPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: 'title',
              center: '',
              right: 'prev,next today',
            }}
            height="auto"
            fixedWeekCount={false}
            dayMaxEvents={2}
            events={calendarEvents}
            eventClick={(info) => {
              const clickedEvent = data.events.find((event) =>
                event.id === info.event.id
              );

              setSelectedEvent(clickedEvent);
            }}
          />
        </div>
        {selectedEvent && <EventModal event={selectedEvent} />}
      </section>
      {/* <AddEventForm /> */}
    </main>
  )
}

export default App
