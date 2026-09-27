import "./EventModal.css";
import data from "../data/data.json";

function formatDateTime(dateTime) {
  if (!dateTime) return "Not provided";

  return new Date(dateTime).toLocaleString("en-CA", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function toGoogleCalendarDate(dateTime) {
  return new Date(dateTime).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function EventModal({ event, onClose }) {
  const club = data.clubs.find((item) => event.clubId === item.id);
  const requirements = event.requirements || [];
  const deadlines = event.deadlines || [];
  const price = Number.isFinite(event.priceCents)
    ? new Intl.NumberFormat("en-CA", {
        style: "currency",
        currency: "CAD",
      }).format(event.priceCents / 100)
    : "Not provided";
  const eventDetails = [event.description || "No description provided.", `Hosted by: ${club?.name || "UBC club"}`];
  if (club?.socials?.[0]?.url) eventDetails.push(`Club: ${club.socials[0].url}`);
  const googleCalendarUrl = `https://calendar.google.com/calendar/render?${new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${toGoogleCalendarDate(event.startsAt)}/${toGoogleCalendarDate(event.endsAt)}`,
    details: eventDetails.join("\n\n"),
    location: event.location || "",
  }).toString()}`;

  return (
    <div className="modal-overlay">
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="event-title"
      >
        <h2 id="event-title">{event.title}</h2>
        <p>{event.description || "No description provided."}</p>

        <p><strong>When:</strong> {formatDateTime(event.startsAt)} – {formatDateTime(event.endsAt)}</p>
        <p><strong>Where:</strong> {event.location || "Not provided"}</p>
        <p><strong>Hosted by:</strong> {club?.name || "UBC club"}</p>
        <p><strong>Cost:</strong> {price}</p>
        <p><strong>Recurring:</strong> {event.isRecurring ? "Yes" : "No"}</p>

        <p><strong>What to bring or know:</strong></p>
        {requirements.length > 0 ? (
          <ul>
            {requirements.map((requirement, index) => (
              <li key={index}>{requirement}</li>
            ))}
          </ul>
        ) : (
          <p>No specific requirements.</p>
        )}

        <p><strong>Deadlines:</strong></p>
        {deadlines.length > 0 ? (
          <ul>
            {deadlines.map((deadline, index) => (
              <li key={index}>
                {deadline.label}: {formatDateTime(deadline.dateTime)}
              </li>
            ))}
          </ul>
        ) : (
          <p>No deadlines listed.</p>
        )}

        <div className="modal-actions">
          <a className="google-calendar-link" href={googleCalendarUrl} target="_blank" rel="noreferrer">
            Add to Google Calendar
          </a>
          {club?.socials?.[0]?.url && (
            <a className="club-link" href={club.socials[0].url} target="_blank" rel="noreferrer">
              Visit Club Page
            </a>
          )}
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

export default EventModal;
