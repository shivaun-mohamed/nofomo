import { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import themePlugin from "@fullcalendar/react/themes/monarch";
import dayGridPlugin from "@fullcalendar/react/daygrid";
import "@fullcalendar/react/skeleton.css";
import "@fullcalendar/react/themes/monarch/theme.css";
import "./App.css";
import fallbackData from "./data/data.json";
import EventModal from "./components2/EventModal";
import ClubView from "./pages/ClubView";

const CATEGORIES = [
  "Academic",
  "Athletic or Recreation",
  "Cultural or Identity",
  "Grassroots or Political",
  "Leisure or Hobby",
  "Media or Performance",
  "Other",
];

async function fetchBackendData() {
  const [clubsResponse, eventsResponse] = await Promise.all([
    fetch("/api/clubs"),
    fetch("/api/events"),
  ]);

  if (!clubsResponse.ok || !eventsResponse.ok) {
    throw new Error("Could not load clubs and events from the backend.");
  }

  const [clubs, calendarEvents] = await Promise.all([
    clubsResponse.json(),
    eventsResponse.json(),
  ]);
  const events = calendarEvents.map(({ id, title, start, end, extendedProps = {} }) => ({
    ...extendedProps,
    id,
    title,
    startsAt: start,
    endsAt: end,
  }));

  return { clubs, events };
}

function getMaxEventCost(events) {
  return Math.ceil(Math.max(0, ...events.map((event) => event.priceCents || 0)) / 100);
}

function FilterChoices({ title, group, options, filters, toggleFilter }) {
  return (
    <fieldset className="filter-group">
      <legend>{title}</legend>
      {options.map((option) => (
        <label className="filter-option" key={option.value}>
          <input type="checkbox" checked={filters[group].includes(option.value)} onChange={() => toggleFilter(group, option.value)} />
          <span>{option.label}</span>
        </label>
      ))}
    </fieldset>
  );
}

function App() {
  const [page, setPage] = useState("home");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [data, setData] = useState({ clubs: [], events: [] });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ categories: [], maxCost: 0, hasDeadline: false, foodSnacksOnly: false, recurrence: "all" });

  useEffect(() => {
    let cancelled = false;
    let loadedFromBackend = false;

    async function loadData() {
      try {
        const nextData = await fetchBackendData();

        if (cancelled) return;

        loadedFromBackend = true;
        setData(nextData);
        const maxCost = getMaxEventCost(nextData.events);
        setFilters((current) => ({ ...current, maxCost }));
      } catch (error) {
        if (!cancelled) {
          if (!loadedFromBackend) {
            setData(fallbackData);
            setFilters((current) => ({ ...current, maxCost: getMaxEventCost(fallbackData.events) }));
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadData();
    const intervalId = window.setInterval(loadData, 10000);
    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  async function createEvent(event) {
    const response = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || "Could not save the event.");
    }

    const nextData = await fetchBackendData();
    setData(nextData);
    setFilters((current) => ({ ...current, maxCost: getMaxEventCost(nextData.events) }));
  }

  async function removeEvent(eventId) {
    const response = await fetch(`/api/events/${encodeURIComponent(eventId)}`, { method: "DELETE" });
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      throw new Error("The backend returned an unexpected response. Make sure the Flask server is running and restart it after backend changes.");
    }
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || "Could not remove the event.");
    }

    const nextData = await fetchBackendData();
    setData(nextData);
    setFilters((current) => ({ ...current, maxCost: getMaxEventCost(nextData.events) }));
  }

  const maxEventCost = Math.ceil(
    Math.max(0, ...data.events.map((event) => event.priceCents || 0)) / 100
  );
  const clubs = data.clubs;
  const clubById = Object.fromEntries(clubs.map((club) => [club.id, club]));
  const calendarEvents = data.events.map((event) => {
    const club = clubById[event.clubId];
    return {
    id: event.id,
    title: event.title,
    start: event.startsAt,
    end: event.endsAt,
    extendedProps: { ...event, clubName: club?.name || "Unknown club", category: club?.category || "Other" },
  };
  });
  const normalizedSearch = searchTerm.trim().toLocaleLowerCase();
  const visibleEvents = calendarEvents.filter((event) => {
    const details = event.extendedProps;
    const searchableText = [
      event.title,
      details.description,
      details.location,
      details.clubName,
      ...(details.requirements || []),
      ...(details.deadlines || []).map((deadline) => deadline.label),
    ].filter(Boolean).join(" ").toLocaleLowerCase();

    return (!normalizedSearch || searchableText.includes(normalizedSearch))
      && (!filters.categories.length || filters.categories.includes(details.category))
      && ((details.priceCents || 0) <= filters.maxCost * 100)
      && (!filters.hasDeadline || (details.deadlines || []).length > 0)
      && (!filters.foodSnacksOnly || details.foodSnacksIncluded === true)
      && (filters.recurrence === "all" || (filters.recurrence === "recurring" ? details.isRecurring : !details.isRecurring));
  });
  const toggleFilter = (group, value) => setFilters((current) => ({
    ...current,
    [group]: current[group].includes(value) ? current[group].filter((item) => item !== value) : [...current[group], value],
  }));
  if (page === "home") {
    return (
      <main className="welcome-page">
        <div className="welcome-shell">
          <header className="welcome-header">
            <button className="logo-home-button" onClick={() => setPage("home")} aria-label="Go to home page">
              <img className="brand-logo" src="/nomo-logo.svg" alt="nomo." />
            </button>
            <span className="campus-label"><span /> MADE FOR UBC</span>
          </header>
          <section className="welcome-content">
            <p className="eyebrow">YOUR CAMPUS, IN ONE PLACE</p>
            <h1>Tired of getting FOMO?<br />That’s not going to happen <span>NOMO.</span></h1>
            <p className="welcome-description">
              Discover what’s happening at UBC. NOMO brings club events together in one easy-to-browse calendar, so you can find your people and make plans.
            </p>
            <div className="home-options">
  <button
    className="primary-button home-continue"
    onClick={() => setPage("calendar")}
  >
    Continue as student <span aria-hidden="true">→</span>
  </button>

  <button
    className="primary-button home-continue"
    onClick={() => setPage("club")}
  >
    Continue as club <span aria-hidden="true">→</span>
  </button>
</div>
          </section>
          <footer className="welcome-footer">A little less scrolling. A lot more showing up.</footer>
        </div>
        <div className="welcome-art" aria-hidden="true"><div className="art-orbit orbit-one" /><div className="art-orbit orbit-two" /><div className="art-center">n<span>o</span>mo<span className="art-dot">.</span></div><div className="art-note note-top">find your next thing</div><div className="art-note note-bottom">see you there ↗</div></div>
      </main>
    );
  }

  if (page === "club") {
    return (
      <ClubView
        clubs={clubs}
        events={data.events}
        onAddEvent={createEvent}
        onRemoveEvent={removeEvent}
        onGoHome={() => setPage("home")}
      />
    );
}

  return (
    <main className="calendar-page">
      <section className="calendar-shell" aria-label="Calendar">
        <header className="calendar-intro">
          <button className="logo-home-button" onClick={() => setPage("home")} aria-label="Go to home page">
            <img className="brand-logo" src="/nomo-logo.svg" alt="nomo." />
          </button>
          <p className="eyebrow">YOUR SCHEDULE</p>
          <h1>Calendar</h1>
          <p className="calendar-description">A clear view of what’s ahead.</p>
        </header>
        <div className="calendar-layout">
          <aside className="filter-sidebar" aria-label="Filter events">
            <div className="filter-heading">
              <div><p className="eyebrow">MAKE IT YOURS</p><h2>Filters</h2></div>
              <button className="clear-filters" onClick={() => setFilters({ categories: [], maxCost: maxEventCost, hasDeadline: false, foodSnacksOnly: false, recurrence: "all" })}>Clear</button>
            </div>
            <p className="filter-count">{visibleEvents.length} of {calendarEvents.length} events</p>
            <label className="event-search">
              <span>Search events and clubs</span>
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Title, club, location..."
              />
            </label>
            <FilterChoices title="Categories" group="categories" options={CATEGORIES.map((category) => ({ value: category, label: category }))} filters={filters} toggleFilter={toggleFilter} />
            <fieldset className="filter-group">
              <legend>Entry price</legend>
              <label className="price-filter-label" htmlFor="max-entry-price">Up to <strong>${filters.maxCost}</strong></label>
              <input id="max-entry-price" className="price-slider" type="range" min="0" max={maxEventCost} step="1" value={filters.maxCost} onChange={(event) => setFilters((current) => ({ ...current, maxCost: Number(event.target.value) }))} />
              <div className="price-slider-labels"><span>Free</span><span>${maxEventCost}</span></div>
            </fieldset>
            <fieldset className="filter-group">
              <legend>Event type</legend>
              <label className="filter-option"><input type="checkbox" checked={filters.hasDeadline} onChange={(event) => setFilters((current) => ({ ...current, hasDeadline: event.target.checked }))} /><span>Has a deadline</span></label>
              <label className="filter-option"><input type="checkbox" checked={filters.foodSnacksOnly} onChange={(event) => setFilters((current) => ({ ...current, foodSnacksOnly: event.target.checked }))} /><span>Food/Snacks included</span></label>
              <label className="filter-option"><input type="radio" name="recurrence" checked={filters.recurrence === "all"} onChange={() => setFilters((current) => ({ ...current, recurrence: "all" }))} /><span>Any schedule</span></label>
              <label className="filter-option"><input type="radio" name="recurrence" checked={filters.recurrence === "recurring"} onChange={() => setFilters((current) => ({ ...current, recurrence: "recurring" }))} /><span>Recurring</span></label>
              <label className="filter-option"><input type="radio" name="recurrence" checked={filters.recurrence === "one-time"} onChange={() => setFilters((current) => ({ ...current, recurrence: "one-time" }))} /><span>One-time</span></label>
            </fieldset>
          </aside>
          <div className="calendar-card">
            {loading && <p role="status">Loading clubs and events...</p>}
            {!loading && visibleEvents.length === 0 && (
              <p className="no-events-message" role="status">
                No events match your search and filters.
              </p>
            )}
            <FullCalendar
              plugins={[themePlugin, dayGridPlugin]}
              initialView="dayGridMonth"
              headerToolbar={{ left: "title", center: "", right: "prev,next today" }}
              height="auto"
              fixedWeekCount={false}
              dayMaxEvents={2}
              events={visibleEvents}
              eventClick={(info) => {
                const clickedEvent = data.events.find((event) => event.id === info.event.id);
                setSelectedEvent(clickedEvent);
              }}
            />
          </div>
        </div>
        {selectedEvent && (
          <EventModal
            event={selectedEvent}
            clubs={clubs}
            onClose={() => setSelectedEvent(null)}
          />
        )}
      </section>
    </main>
  );
}

export default App;
