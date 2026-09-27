import { useState } from "react";
import FullCalendar from "@fullcalendar/react";
import themePlugin from "@fullcalendar/react/themes/monarch";
import dayGridPlugin from "@fullcalendar/react/daygrid";

import "@fullcalendar/react/skeleton.css";
import "@fullcalendar/react/themes/monarch/theme.css";

import AddEventForm from "../components/AddEventForm";
import "./ClubView.css";

function ClubView({ clubs, events, onAddEvent, onGoHome }) {
  const [selectedClubId, setSelectedClubId] = useState("");
  const activeClubId = clubs.some((club) => club.id === selectedClubId)
    ? selectedClubId
    : clubs[0]?.id || "";
  const activeClub = clubs.find((club) => club.id === activeClubId);
  const calendarEvents = events
    .filter((event) => event.clubId === activeClubId)
    .map((event) => ({
    id: event.id,
    title: event.title,
    start: event.startsAt,
    end: event.endsAt,
  }));

  return (
    <main className="club-view">
      <header className="club-view__header">
        <button className="logo-home-button" onClick={onGoHome} aria-label="Go to home page">
          <img className="brand-logo" src="/nomo-logo.svg" alt="nomo." />
        </button>
        <div className="club-view__heading">
        <h1>Club dashboard</h1>
        <p>View your club’s schedule and add upcoming events.</p>
        </div>
      </header>

      <div className="club-view__layout">
        <section
          className="club-view__calendar"
          aria-label="Club event calendar"
        >
          <h2>{activeClub ? `${activeClub.name} calendar` : "Club calendar"}</h2>

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
          <AddEventForm
            clubs={clubs}
            selectedClubId={activeClubId}
            onClubChange={setSelectedClubId}
            onAddEvent={onAddEvent}
          />
        </div>
      </div>
    </main>
  );
}



export default ClubView;
