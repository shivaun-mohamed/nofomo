import { useState } from "react";
import "./AddEventForm.css";

const categories = [
  "Academic",
  "Athletic or Recreation",
  "Cultural or Identity",
  "Leisure or Hobby",
  "Media or Performance",
  "Other",
];

function toIsoDateTime(value) {
  return new Date(value).toISOString();
}

function AddEventForm({ onAddEvent }) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(submitEvent) {
    submitEvent.preventDefault();
    setMessage("");
    setError("");

    const form = submitEvent.currentTarget;
    const formData = new FormData(form);
    const startsAt = formData.get("startsAt");
    const endsAt = formData.get("endsAt");

    if (new Date(endsAt) <= new Date(startsAt)) {
      setError("End date and time must be after the start.");
      return;
    }

    const deadline = formData.get("registrationDeadline");
    const title = formData.get("title").trim();
    const event = {
      id: globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      title,
      category: formData.get("category"),
      startsAt: toIsoDateTime(startsAt),
      endsAt: toIsoDateTime(endsAt),
      location: formData.get("location").trim(),
      description: formData.get("description").trim(),
      requirements: formData.get("requirements")
        .split("\n")
        .map((requirement) => requirement.trim())
        .filter(Boolean),
      deadlines: deadline
        ? [{ label: "Registration closes", dateTime: toIsoDateTime(deadline) }]
        : [],
      priceCents: Math.round(Number(formData.get("price")) * 100),
      isRecurring: formData.has("isRecurring"),
    };

    onAddEvent(event);
    form.reset();
    setMessage(`“${title}” was added to the calendar.`);
  }

  return (
    <section className="add-event-form">
      <h2>Add an event</h2>
      <p className="add-event-form__intro">Share the details students need to plan their visit.</p>

      <form className="add-event-form__fields" onSubmit={handleSubmit}>
        <label className="add-event-form__field">
          Event title
          <input name="title" type="text" maxLength="100" placeholder="e.g. Welcome week social" required />
        </label>

        <label className="add-event-form__field">
          Category
          <select name="category" defaultValue="Academic" required>
            {categories.map((category) => <option key={category} value={category}>{category}</option>)}
          </select>
        </label>

        <div className="add-event-form__field-grid">
          <label className="add-event-form__field">
            Starts
            <input name="startsAt" type="datetime-local" required />
          </label>
          <label className="add-event-form__field">
            Ends
            <input name="endsAt" type="datetime-local" required />
          </label>
        </div>

        <label className="add-event-form__field">
          Location
          <input name="location" type="text" maxLength="120" placeholder="Building, room, or meeting point" required />
        </label>

        <label className="add-event-form__field">
          Event description
          <textarea name="description" rows="3" maxLength="1000" placeholder="What will students do at this event?" required />
        </label>

        <label className="add-event-form__field">
          Requirements <span className="add-event-form__optional">Optional, one per line</span>
          <textarea name="requirements" rows="2" maxLength="600" placeholder="What should attendees bring or know?" />
        </label>

        <div className="add-event-form__field-grid">
          <label className="add-event-form__field">
            Registration deadline <span className="add-event-form__optional">Optional</span>
            <input name="registrationDeadline" type="datetime-local" />
          </label>
          <label className="add-event-form__field">
            Price (CAD)
            <input name="price" type="number" min="0" step="0.01" defaultValue="0" required />
          </label>
        </div>

        <label className="add-event-form__checkbox">
          <input name="isRecurring" type="checkbox" />
          <span>Recurring event</span>
        </label>

        {error && <p className="add-event-form__error" role="alert">{error}</p>}
        {message && <p className="add-event-form__message" role="status">{message}</p>}
        <button className="add-event-form__submit" type="submit">Add event</button>
      </form>
    </section>
  );
}

export default AddEventForm;