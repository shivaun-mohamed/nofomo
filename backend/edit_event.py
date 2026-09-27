import json
from datetime import datetime
from pathlib import Path
from uuid import uuid4


DATA_FILE = Path(__file__).with_name('data_event.json')
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


def _read_events(data_file):
	with Path(data_file).open('r', encoding='utf-8') as file:
		events = json.load(file)
	if not isinstance(events, list):
		raise ValueError('Event data must be a JSON list')
	return events


def _write_events(data_file, events):
	with Path(data_file).open('w', encoding='utf-8') as file:
		json.dump(events, file, indent=2, ensure_ascii=False)
		file.write('\n')


def _prepare_event(event, event_id=None):
	if not isinstance(event, dict):
		raise ValueError('Event must be a dictionary')

	missing_fields = REQUIRED_EVENT_FIELDS - event.keys()
	if missing_fields:
		missing = ', '.join(sorted(missing_fields))
		raise ValueError(f'Missing required event fields: {missing}')

	new_event = dict(event)
	new_event.setdefault('foodSnacksIncluded', False)
	if event_id is None:
		new_event.setdefault('id', str(uuid4()))
	elif new_event.get('id', event_id) != event_id:
		raise ValueError('Event id must match the id in the URL')
	else:
		new_event['id'] = event_id
	if not isinstance(new_event['id'], str) or not new_event['id'].strip():
		raise ValueError('Event id must be a non-empty string')

	for field in ('title', 'clubId', 'location', 'description'):
		if not isinstance(new_event[field], str) or not new_event[field].strip():
			raise ValueError(f'Event {field} must be a non-empty string')
	if not isinstance(new_event['requirements'], list) or any(
		not isinstance(requirement, str) for requirement in new_event['requirements']
	):
		raise ValueError('Event requirements must be a list of strings')
	if not isinstance(new_event['deadlines'], list) or not all(
		isinstance(deadline, dict)
		and isinstance(deadline.get('label'), str)
		and isinstance(deadline.get('dateTime'), str)
		for deadline in new_event['deadlines']
	):
		raise ValueError('Event deadlines must be a list of objects with label and dateTime')
	if isinstance(new_event['priceCents'], bool) or not isinstance(new_event['priceCents'], int) or new_event['priceCents'] < 0:
		raise ValueError('Event priceCents must be a non-negative integer')
	if not isinstance(new_event['isRecurring'], bool):
		raise ValueError('Event isRecurring must be a boolean')
	if not isinstance(new_event['foodSnacksIncluded'], bool):
		raise ValueError('Event foodSnacksIncluded must be a boolean')

	try:
		starts_at = datetime.fromisoformat(new_event['startsAt'].replace('Z', '+00:00'))
		ends_at = datetime.fromisoformat(new_event['endsAt'].replace('Z', '+00:00'))
	except (AttributeError, TypeError, ValueError) as error:
		raise ValueError('Event startsAt and endsAt must be ISO date/time strings') from error

	if starts_at.tzinfo is None or ends_at.tzinfo is None or ends_at <= starts_at:
		raise ValueError('Event times must include a timezone and endsAt must be later than startsAt')
	return new_event


def add_event(event, data_file=DATA_FILE):
	"""Validate and save an event, generating an ID when one is not supplied."""
	new_event = _prepare_event(event)

	events = _read_events(data_file)
	if any(existing.get('id') == new_event['id'] for existing in events):
		raise ValueError(f"An event with id '{new_event['id']}' already exists")

	events.append(new_event)
	_write_events(data_file, events)
	return new_event


def update_event(event_id, event, data_file=DATA_FILE):
	"""Replace a saved event by ID, returning None if it does not exist."""
	events = _read_events(data_file)
	index = next(
		(index for index, existing in enumerate(events) if existing.get('id') == event_id),
		None,
	)
	if index is None:
		return None

	updated_event = _prepare_event(event, event_id)
	events[index] = updated_event
	_write_events(data_file, events)
	return updated_event


def remove_event(event_id, data_file=DATA_FILE):
	"""Remove and return a saved event by ID, or return None if it is not found."""
	events = _read_events(data_file)
	event = next((event for event in events if event.get('id') == event_id), None)
	if event is None:
		return None

	events.remove(event)
	_write_events(data_file, events)
	return event


