import json
import os
from pathlib import Path


BACKEND_DIR = Path(__file__).resolve().parent


def is_enabled():
	return bool(os.environ.get('DATABASE_URL'))


def connect():
	import psycopg
	from psycopg.rows import dict_row

	return psycopg.connect(os.environ['DATABASE_URL'], row_factory=dict_row)


def _jsonb(value):
	from psycopg.types.json import Jsonb

	return Jsonb(value)


def initialize_database():
	if not is_enabled():
		return

	schema = (BACKEND_DIR / 'schema.sql').read_text(encoding='utf-8')
	with connect() as connection:
		for statement in schema.split(';'):
			if statement.strip():
				connection.execute(statement)


def get_clubs():
	with connect() as connection:
		rows = connection.execute('SELECT data FROM clubs ORDER BY id').fetchall()
	return [row['data'] for row in rows]


def get_events():
	with connect() as connection:
		rows = connection.execute('SELECT data FROM events ORDER BY id').fetchall()
	return [row['data'] for row in rows]


def club_exists(club_id):
	with connect() as connection:
		row = connection.execute('SELECT 1 FROM clubs WHERE id = %s', (club_id,)).fetchone()
	return row is not None


def add_event(event):
	from edit_event import _prepare_event

	new_event = _prepare_event(event)
	with connect() as connection:
		if connection.execute(
			'SELECT 1 FROM events WHERE id = %s', (new_event['id'],)
		).fetchone():
			raise ValueError(f"An event with id '{new_event['id']}' already exists")
		connection.execute(
			'INSERT INTO events (id, club_id, data) VALUES (%s, %s, %s)',
			(new_event['id'], new_event['clubId'], _jsonb(new_event)),
		)
	return new_event


def update_event(event_id, event):
	from edit_event import _prepare_event

	updated_event = _prepare_event(event, event_id)
	with connect() as connection:
		result = connection.execute(
			'UPDATE events SET club_id = %s, data = %s WHERE id = %s RETURNING id',
			(updated_event['clubId'], _jsonb(updated_event), event_id),
		).fetchone()
	return updated_event if result else None


def seed_from_json():
	clubs_data = json.loads((BACKEND_DIR / 'data_club.json').read_text(encoding='utf-8'))
	events = json.loads((BACKEND_DIR / 'data_event.json').read_text(encoding='utf-8'))
	clubs = clubs_data['clubs']

	with connect() as connection:
		for club in clubs:
			connection.execute(
				'INSERT INTO clubs (id, data) VALUES (%s, %s) ON CONFLICT (id) DO NOTHING',
				(club['id'], _jsonb(club)),
			)
		for event in events:
			event = {**event, 'foodSnacksIncluded': event.get('foodSnacksIncluded', False)}
			connection.execute(
				'INSERT INTO events (id, club_id, data) VALUES (%s, %s, %s) ON CONFLICT (id) DO NOTHING',
				(event['id'], event['clubId'], _jsonb(event)),
			)
	return len(clubs), len(events)