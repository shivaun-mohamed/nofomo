import json
from pathlib import Path

from flask import Flask, jsonify, request

from edit_event import add_event, update_event


BACKEND_DIR = Path(__file__).resolve().parent
CLUBS_FILE = BACKEND_DIR / 'data_club.json'
EVENTS_FILE = BACKEND_DIR / 'data_event.json'
ALLOWED_ORIGINS = {'http://localhost:5173', 'http://127.0.0.1:5173'}

app = Flask(__name__)


def _read_json(file_path):
	try:
		with file_path.open('r', encoding='utf-8') as file:
			return json.load(file)
	except (OSError, json.JSONDecodeError) as error:
		app.logger.exception('Could not load %s', file_path.name)
		return None


@app.after_request
def add_cors_headers(response):
	origin = request.headers.get('Origin')
	if origin in ALLOWED_ORIGINS:
		response.headers['Access-Control-Allow-Origin'] = origin
		response.headers['Vary'] = 'Origin'
	return response


@app.route('/api/clubs', methods=['GET'])
def get_clubs():
	data = _read_json(CLUBS_FILE)
	clubs = data.get('clubs') if isinstance(data, dict) else None
	if not isinstance(clubs, list):
		return jsonify(error='Club data must contain a clubs list'), 500
	return jsonify(clubs)


@app.route('/api/events', methods=['GET'])
def get_events():
	events = _read_json(EVENTS_FILE)
	if not isinstance(events, list):
		return jsonify(error='Event data must be a JSON list'), 500

	return jsonify([_to_calendar_event(event) for event in events])


@app.route('/api/search', methods=['GET'])
def search():
	query = request.args.get('q', '').strip().casefold()
	if not query:
		return jsonify(error="A non-empty 'q' search term is required"), 400

	club_data = _read_json(CLUBS_FILE)
	clubs = club_data.get('clubs') if isinstance(club_data, dict) else None
	events = _read_json(EVENTS_FILE)
	if not isinstance(clubs, list) or not isinstance(events, list):
		return jsonify(error='Could not load clubs or events'), 500

	clubs_by_id = {club.get('id'): club for club in clubs}
	matching_clubs = [club for club in clubs if _club_matches(club, query)]
	matching_events = [
		_to_calendar_event(event)
		for event in events
		if _event_matches(event, query, clubs_by_id.get(event.get('clubId')))
	]
	return jsonify(clubs=matching_clubs, events=matching_events)


def _club_matches(club, query):
	social_details = ' '.join(
		f"{social.get('platform', '')} {social.get('url', '')}"
		for social in club.get('socials', [])
		if isinstance(social, dict)
	)
	return _contains_query(query, club.get('name'), club.get('category'), social_details)


def _event_matches(event, query, club):
	requirements = ' '.join(event.get('requirements', []))
	deadline_labels = ' '.join(
		deadline.get('label', '')
		for deadline in event.get('deadlines', [])
		if isinstance(deadline, dict)
	)
	club_name = club.get('name') if isinstance(club, dict) else None
	return _contains_query(
		query,
		event.get('title'),
		event.get('description'),
		event.get('location'),
		requirements,
		deadline_labels,
		club_name,
	)


def _contains_query(query, *values):
	return any(query in value.casefold() for value in values if isinstance(value, str))


def _to_calendar_event(event):
	return {
		'id': event['id'],
		'title': event['title'],
		'start': event['startsAt'],
		'end': event['endsAt'],
		'extendedProps': {
			key: value
			for key, value in event.items()
			if key not in {'id', 'title', 'startsAt', 'endsAt'}
		},
	}


def _club_exists(club_id):
	data = _read_json(CLUBS_FILE)
	clubs = data.get('clubs') if isinstance(data, dict) else None
	return isinstance(clubs, list) and any(club.get('id') == club_id for club in clubs)


@app.route('/api/events', methods=['POST'])
def create_event():
	event = request.get_json(silent=True)
	if not isinstance(event, dict):
		return jsonify(error='Request body must be a JSON object'), 400
	if not _club_exists(event.get('clubId')):
		return jsonify(error='clubId must match an existing club'), 400

	try:
		created_event = add_event(event, EVENTS_FILE)
	except ValueError as error:
		return jsonify(error=str(error)), 400
	return jsonify(_to_calendar_event(created_event)), 201


@app.route('/api/events/<event_id>', methods=['PUT'])
def replace_event(event_id):
	event = request.get_json(silent=True)
	if not isinstance(event, dict):
		return jsonify(error='Request body must be a JSON object'), 400
	if not _club_exists(event.get('clubId')):
		return jsonify(error='clubId must match an existing club'), 400

	try:
		updated_event = update_event(event_id, event, EVENTS_FILE)
	except ValueError as error:
		return jsonify(error=str(error)), 400
	if updated_event is None:
		return jsonify(error='Event not found'), 404
	return jsonify(_to_calendar_event(updated_event))


if __name__ == '__main__':
	app.run(debug=True, port=5000)