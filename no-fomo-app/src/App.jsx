import { useState } from "react";
import FullCalendar from "@fullcalendar/react";
import themePlugin from "@fullcalendar/react/themes/monarch";
import dayGridPlugin from "@fullcalendar/react/daygrid";
import "@fullcalendar/react/skeleton.css";
import "@fullcalendar/react/themes/monarch/theme.css";
import "./App.css";
import data from "./data/data.json";

function App() {
  const [page, setPage] = useState("home");
  const [authMessage, setAuthMessage] = useState("");
  const calendarEvents = data.events.map((event) => ({
    id: event.id,
    title: event.title,
    start: event.startsAt,
    end: event.endsAt,
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
            <button className="primary-button home-continue" onClick={() => setPage("access")}>Continue <span aria-hidden="true">→</span></button>
          </section>
          <footer className="welcome-footer">A little less scrolling. A lot more showing up.</footer>
        </div>
        <div className="welcome-art" aria-hidden="true"><div className="art-orbit orbit-one" /><div className="art-orbit orbit-two" /><div className="art-center">n<span>o</span>mo<span className="art-dot">.</span></div><div className="art-note note-top">find your next thing</div><div className="art-note note-bottom">see you there ↗</div></div>
      </main>
    );
  }

  if (page === "access") {
    return (
      <main className="access-page">
        <section className="access-card">
          <button className="logo-home-button" onClick={() => { setPage("home"); setAuthMessage(""); }} aria-label="Go to home page">
            <img className="brand-logo" src="/nomo-logo.svg" alt="nomo." />
          </button>
          <p className="eyebrow">WELCOME TO NOMO</p>
          <h1>Find your people.<br />Show up to something.</h1>
          <p className="access-description">Sign in to get started, or explore the UBC calendar as a guest.</p>
          <div className="login-options">
            <button className="login-button" onClick={() => setAuthMessage("Google sign-in isn’t connected yet. Continue as a guest to explore the calendar.")}><span className="google-mark" aria-hidden="true">G</span>Continue with Google</button>
            <button className="login-button" onClick={() => setAuthMessage("Apple sign-in isn’t connected yet. Continue as a guest to explore the calendar.")}><span className="apple-mark" aria-hidden="true">●</span>Continue with Apple</button>
            <div className="option-divider"><span>OR</span></div>
            <button className="primary-button guest-button" onClick={() => setPage("calendar")}>Continue as guest <span aria-hidden="true">→</span></button>
          </div>
          {authMessage && <p className="auth-message" role="status">{authMessage}</p>}
          <button className="back-button" onClick={() => { setPage("home"); setAuthMessage(""); }}>← Back</button>
        </section>
      </main>
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
        <div className="calendar-card">
          <FullCalendar
            plugins={[themePlugin, dayGridPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{ left: "title", center: "", right: "prev,next today" }}
            height="auto"
            fixedWeekCount={false}
            dayMaxEvents={2}
            events={calendarEvents}
          />
        </div>
        <button className="back-button calendar-back" onClick={() => setPage("access")}>← Back</button>
      </section>
    </main>
  );
}

export default App;
