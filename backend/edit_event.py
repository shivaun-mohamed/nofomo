from datetime import datetime
from uuid import uuid4


REQUIRED_EVENT_FIELDS = {
	'clubId',
	'title',
	'startsAt',
	'endsAt',
	'location',
	'description',
	'requirements',
	'deadlines',
	'priceCents',
	'isRecurring',
}


def add_event(events, event):
	"""Validate and append an event, generating an ID when one is not supplied."""
	missing_fields = REQUIRED_EVENT_FIELDS - event.keys()
	if missing_fields:
		missing = ', '.join(sorted(missing_fields))
		raise ValueError(f'Missing required event fields: {missing}')

	new_event = dict(event)
	new_event.setdefault('id', str(uuid4()))
	if any(existing.get('id') == new_event['id'] for existing in events):
		raise ValueError(f"An event with id '{new_event['id']}' already exists")

	if not isinstance(new_event['title'], str) or not new_event['title'].strip():
		raise ValueError('Event title must be a non-empty string')
	if not isinstance(new_event['clubId'], str) or not new_event['clubId'].strip():
		raise ValueError('Event clubId must be a non-empty string')
	if not isinstance(new_event['requirements'], list) or not all(
		isinstance(requirement, str) for requirement in new_event['requirements']
	):
		raise ValueError('Event requirements must be a list of strings')
	if not isinstance(new_event['deadlines'], list) or not all(
		isinstance(deadline, dict)
		and isinstance(deadline.get('label'), str)
		and isinstance(deadline.get('dateTime'), str)
		for deadline in new_event['deadlines']
	):
		raise ValueError('Event deadlines must be a list of objects with label and dateTime')
	if (
		isinstance(new_event['priceCents'], bool)
		or not isinstance(new_event['priceCents'], int)
		or new_event['priceCents'] < 0
	):
		raise ValueError('Event priceCents must be a non-negative integer')
	if not isinstance(new_event['isRecurring'], bool):
		raise ValueError('Event isRecurring must be a boolean')

	try:
		starts_at = datetime.fromisoformat(new_event['startsAt'].replace('Z', '+00:00'))
		ends_at = datetime.fromisoformat(new_event['endsAt'].replace('Z', '+00:00'))
	except (AttributeError, TypeError, ValueError) as error:
		raise ValueError('Event startsAt and endsAt must be ISO date/time strings') from error

	if starts_at.tzinfo is None or ends_at.tzinfo is None:
		raise ValueError('Event startsAt and endsAt must include a timezone')
	if ends_at <= starts_at:
		raise ValueError('Event endsAt must be later than startsAt')

	for field in ('location', 'description'):
		if not isinstance(new_event[field], str) or not new_event[field].strip():
			raise ValueError(f'Event {field} must be a non-empty string')

	events.append(new_event)
	return new_event


def remove_event(events, event_id):
	"""Remove and return an event by ID, or return None if it does not exist."""
	for index, event in enumerate(events):
		if event.get('id') == event_id:
			return events.pop(index)
	return None

