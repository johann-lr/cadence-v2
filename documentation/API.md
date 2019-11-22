# API

<img src="https://img.shields.io/badge/version-1.0-blue.svg">

Cadence RestAPI provides basic data about the bot and each guild. <br>
It can be accessed under the same domain as the homepage/dashboard (<https://musicbot.ga>).

- Method: `GET`
- URL: `/api`
- Sample Response:

```json
{
  "connections": ["509751546729463819"],
  "processMemoryMB": "32.36",
  "nodeV": "v10.14.2",
  "guildsCount": 3,
  "uptime_raw": 346546,
  "uptime": "1 day, 3 hours, 15 mins, 23 secs"
}
```

- Method: `GET`
- URL: `/api/:guildID`
- Sample Response:

```json
{
  "id": "509751546729463819",
  "existingConnection": true,
  "existingDispatcher": true,
  "volume": 1.6,
  "paused": false,
  "channel": "voicechannel",
  "queue": [
    {
      "title": "Die Buberts - Ski Ski Ski (Offizielles Musikvideo)",
      "link": "https://www.youtube.com/watch?v=xPKknlVuh1E",
      "req": "503196021447458827"
    }
  ],
  "stream_time": 5245, // milliseconds
  "length": 562 // seconds
}
```

```json
{
  "id": "509751546729463819",
  "existingConnection": false,
  "existingDispatcher": false,
  "channel": null,
  "queue": []
}
```
