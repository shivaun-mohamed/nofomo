import json
from pathlib import Path
from uuid import uuid4


DATA_FILE = Path(__file__).with_name('data_club.json')
REQUIRED_CLUB_FIELDS = {'name', 'category', 'socials'}

# opens data_club.json, checks its a club list, and returns data
def _read_clubs(data_file):
	with Path(data_file).open('r', encoding='utf-8') as file:
		data = json.load(file)
	if not isinstance(data, dict) or not isinstance(data.get('clubs'), list):
		raise ValueError("Club data must be a JSON object with a 'clubs' list")
	return data

# saves updated json data to data_club.json
def _write_clubs(data_file, data):
	with Path(data_file).open('w', encoding='utf-8') as file:
		json.dump(data, file, indent=2, ensure_ascii=False)
		file.write('\n')


# allows user to add club to data.json, validation check for club data
def add_club(club, data_file=DATA_FILE):
	"""Validate and save a club; generate an ID if the club does not have one."""
	if not isinstance(club, dict):
		raise ValueError('Club must be a dictionary') # only takes in dictionaries

	missing_fields = REQUIRED_CLUB_FIELDS - club.keys()
	if missing_fields:
		missing = ', '.join(sorted(missing_fields))
		raise ValueError(f'Missing required club fields: {missing}')

	new_club = dict(club)
	new_club.setdefault('id', str(uuid4()))
	for field in ('id', 'name', 'category'):
		if not isinstance(new_club[field], str) or not new_club[field].strip():
			raise ValueError(f'Club {field} must be a non-empty string')
	if not isinstance(new_club['socials'], list) or not all(
		isinstance(social, dict)
		and isinstance(social.get('platform'), str)
		and isinstance(social.get('url'), str)
		for social in new_club['socials']
	):
		raise ValueError('Club socials must be a list of objects with platform and url strings')

	data = _read_clubs(data_file)
	if any(existing.get('id') == new_club['id'] for existing in data['clubs']):
		raise ValueError(f"A club with id '{new_club['id']}' already exists")

	data['clubs'].append(new_club)
	_write_clubs(data_file, data)
	return new_club

# allows user to remove club from data.json
def remove_club(club_id, data_file=DATA_FILE):
	"""Remove and return a club by ID, or return None when it is not found."""
	data = _read_clubs(data_file)
	for index, club in enumerate(data['clubs']):
		if club.get('id') == club_id:
			removed_club = data['clubs'].pop(index)
			_write_clubs(data_file, data)
			return removed_club
	return None
