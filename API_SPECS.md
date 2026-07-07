## Event API

### GET /events

Returns all upcoming events.

**Query Parameters**

| Parameter  | Type    | Description                 |
| ---------- | ------- | --------------------------- |
| `city`     | string  | Filter by city              |
| `category` | string  | AI, Cloud, DevOps, Security |
| `date`     | string  | Event date (YYYY-MM-DD)     |
| `limit`    | integer | Number of events to return  |

**Sample Response**

```json
[
  {
    "id": "evt-001",
    "name": "Microsoft Build Localhost Manila",
    "category": "AI",
    "date": "2026-08-15",
    "venueId": "ven-001",
    "availableSlots": 35
  }
]
```

---

## Session API

### GET /sessions

Returns all sessions for an event.

**Query Parameters**

| Parameter   | Type   | Description               |
| ----------- | ------ | ------------------------- |
| `eventId`   | string | Event ID                  |
| `speakerId` | string | Filter by speaker         |
| `track`     | string | AI, Cloud, Data, Security |

**Sample Response**

```json
[
  {
    "id": "ses-001",
    "title": "Turn REST APIs into MCP Servers",
    "speakerId": "spk-001",
    "startTime": "09:00",
    "endTime": "09:45",
    "room": "Main Hall",
    "remainingSeats": 18
  }
]
```

---

## Speaker API

### GET /speakers

Returns speakers.

**Query Parameters**

| Parameter   | Type    | Description               |
| ----------- | ------- | ------------------------- |
| `name`      | string  | Search by name            |
| `expertise` | string  | AI, Azure, GitHub, DevOps |
| `mvp`       | boolean | Microsoft MVP only        |

**Sample Response**

```json
[
  {
    "id": "spk-001",
    "name": "Mark Anthony Estopace",
    "title": "Senior Software Engineer",
    "company": "Cambridge University Press & Assessment",
    "expertise": [
      "Azure",
      "AI",
      "GitHub"
    ],
    "mvp": true
  }
]
```

---

## Venue API

### GET /venues

Returns venue information.

**Query Parameters**

| Parameter  | Type    | Description      |
| ---------- | ------- | ---------------- |
| `city`     | string  | City name        |
| `capacity` | integer | Minimum capacity |

**Sample Response**

```json
[
  {
    "id": "ven-001",
    "name": "Microsoft Philippines",
    "city": "Makati",
    "address": "6750 Ayala Ave",
    "capacity": 150,
    "parkingAvailable": true
  }
]
```

---

## Registration API

### POST /register

Registers a participant for a session.

**Request Body**

```json
{
  "eventId": "evt-001",
  "sessionId": "ses-001",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "company": "Contoso",
  "jobTitle": "Software Engineer"
}
```

**Success Response**

```json
{
  "registrationId": "REG-100245",
  "status": "Confirmed",
  "eventName": "Microsoft Build Localhost Manila",
  "sessionName": "Turn REST APIs into MCP Servers",
  "seatNumber": 42,
  "checkInCode": "AZMCP2026"
}
```