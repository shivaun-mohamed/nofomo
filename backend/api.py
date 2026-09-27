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