from datetime import date, datetime, time


def filter_clubs(clubs, category=None):
	"""Return clubs matching a category, or all clubs when category is omitted."""
	if category is None:
		return list(clubs)

	requested_category = category.strip().casefold()
	return [
		club
		for club in clubs
		if club.get('category', '').strip().casefold() == requested_category
	]


def _parse_datetime(value):
	if isinstance(value, datetime):
		return value
	return datetime.fromisoformat(value.replace('Z', '+00:00'))


def _parse_date(value):
	if isinstance(value, datetime):
		return value.date()
	if isinstance(value, date):
		return value
	return date.fromisoformat(value)


def _parse_time(value):
	if isinstance(value, time):
		return value.replace(tzinfo=None)
	return time.fromisoformat(value).replace(tzinfo=None)


def _same_timezone(value, reference):
	"""Align naive filter bounds with an event timestamp before comparing."""
	if value.tzinfo is None and reference.tzinfo is not None:
		return value.replace(tzinfo=reference.tzinfo)
	if value.tzinfo is not None and reference.tzinfo is None:
		return value.replace(tzinfo=None)
	return value


def _event_is_on_campus(event, on_campus_locations, off_campus_locations):
	explicit_value = event.get('isOnCampus')
	if isinstance(explicit_value, bool):
		return explicit_value

	location_type = event.get('locationType')
	if isinstance(location_type, str):
		normalized = location_type.strip().casefold().replace('-', '_').replace(' ', '_')
		if normalized in {'on_campus', 'campus'}:
			return True
		if normalized in {'off_campus', 'offcampus'}:
			return False

	location = event.get('location', '').strip().casefold()
	known_locations = {item.strip().casefold() for item in on_campus_locations}
	if location in known_locations:
		return True
	known_off_campus_locations = {
		item.strip().casefold() for item in off_campus_locations
	}
	if location in known_off_campus_locations:
		return False
	return None


def filter_events(
	events,
	clubs=None,
	*,
	category=None,
	recurring=None,
	requirement=None,
	min_price_cents=None,
	max_price_cents=None,
	has_deadline=None,
	deadline_from=None,
	deadline_to=None,
	date_from=None,
	date_to=None,
	time_from=None,
	time_to=None,
	location_type=None,
	on_campus_locations=(),
	off_campus_locations=(),
):
	"""Filter events by their linked club and event attributes.

	Date bounds are inclusive and apply to the event start date. Time bounds
	match events overlapping that daily time window. Price bounds are cents.
	For location filtering, events need an isOnCampus/locationType field or
	their exact location must be included in on_campus_locations or
	off_campus_locations.
	"""
	club_categories = {}
	if clubs is not None:
		club_categories = {club.get('id'): club.get('category') for club in clubs}
	if category is not None and clubs is None:
		raise ValueError('clubs must be provided when filtering events by category')

	requested_category = category.strip().casefold() if category is not None else None
	requested_requirement = requirement.strip().casefold() if requirement else None
	start_date = _parse_date(date_from) if date_from is not None else None
	end_date = _parse_date(date_to) if date_to is not None else None
	start_time = _parse_time(time_from) if time_from is not None else None
	end_time = _parse_time(time_to) if time_to is not None else None
	deadline_start = _parse_datetime(deadline_from) if deadline_from is not None else None
	deadline_end = _parse_datetime(deadline_to) if deadline_to is not None else None

	if location_type is not None:
		normalized_location_type = location_type.strip().casefold().replace('-', '_').replace(' ', '_')
		if normalized_location_type not in {'on_campus', 'off_campus'}:
			raise ValueError("location_type must be 'on_campus' or 'off_campus'")
		wants_on_campus = normalized_location_type == 'on_campus'
	else:
		wants_on_campus = None

	matching_events = []
	for event in events:
		if requested_category is not None:
			event_category = club_categories.get(event.get('clubId'))
			if not isinstance(event_category, str) or event_category.strip().casefold() != requested_category:
				continue

		if recurring is not None and event.get('isRecurring') is not recurring:
			continue

		requirements = event.get('requirements', [])
		if requested_requirement and not any(
			requested_requirement in str(item).casefold() for item in requirements
		):
			continue

		price = event.get('priceCents')
		if min_price_cents is not None and (price is None or price < min_price_cents):
			continue
		if max_price_cents is not None and (price is None or price > max_price_cents):
			continue

		deadlines = event.get('deadlines', [])
		if has_deadline is not None and bool(deadlines) is not has_deadline:
			continue
		if deadline_start is not None or deadline_end is not None:
			deadline_matches = False
			for deadline in deadlines:
				deadline_value = _parse_datetime(deadline['dateTime'])
				lower_bound = (
					_same_timezone(deadline_start, deadline_value)
					if deadline_start is not None else None
				)
				upper_bound = (
					_same_timezone(deadline_end, deadline_value)
					if deadline_end is not None else None
				)
				if lower_bound is not None and deadline_value < lower_bound:
					continue
				if upper_bound is not None and deadline_value > upper_bound:
					continue
				deadline_matches = True
				break
			if not deadline_matches:
				continue

		event_start = _parse_datetime(event['startsAt'])
		event_end = _parse_datetime(event.get('endsAt', event['startsAt']))
		if start_date is not None and event_start.date() < start_date:
			continue
		if end_date is not None and event_start.date() > end_date:
			continue

		event_start_time = event_start.timetz().replace(tzinfo=None)
		event_end_time = event_end.timetz().replace(tzinfo=None)
		if start_time is not None or end_time is not None:
			lower_time = start_time or time.min
			upper_time = end_time or time.max
			if lower_time <= upper_time:
				if event_start_time > upper_time or event_end_time < lower_time:
					continue
			elif event_start_time > upper_time and event_end_time < lower_time:
				continue

		if wants_on_campus is not None:
			is_on_campus = _event_is_on_campus(
				event, on_campus_locations, off_campus_locations
			)
			if is_on_campus is None or is_on_campus is not wants_on_campus:
				continue

		matching_events.append(event)

	return matching_events
