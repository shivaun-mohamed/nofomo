import database


if __name__ == '__main__':
	if not database.is_enabled():
		raise SystemExit('Set DATABASE_URL before seeding the database.')

	database.initialize_database()
	club_count, event_count = database.seed_from_json()
	print(f'Seeded {club_count} clubs and {event_count} events (existing IDs were left unchanged).')