function initialize(config) {
  return true;
}

function cleanup() {
}

function cleanText(text) {
  return String(text || "")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/")
    .replace(/\s+/g, " ")
    .trim();
}

function getFirstMatch(text, patterns) {
  for (var i = 0; i < patterns.length; i++) {
    var match = text.match(patterns[i]);

    if (match && match[1]) {
      return cleanText(match[1]);
    }
  }

  return "";
}

function getTrackId(row) {
  var patterns = [
    /trackId["']?\s*[:=]\s*["']?(\d+)/i,
    /track_id["']?\s*[:=]\s*["']?(\d+)/i,
    /data-track-id=["'](\d+)["']/i,
    /data-trackid=["'](\d+)["']/i,
    /\/track\/(\d+)/i
  ];

  for (var i = 0; i < patterns.length; i++) {
    var match = row.match(patterns[i]);

    if (match && match[1]) {
      return String(match[1]);
    }
  }

  return "";
}

function parseTrackRow(row) {
  var trackId = getTrackId(row);

  var title = getFirstMatch(row, [
    /class=["'][^"']*title[^"']*["'][^>]*>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/i,
    /class=["'][^"']*trackTitle[^"']*["'][^>]*>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/i,
    /class=["'][^"']*title[^"']*["'][^>]*>([\s\S]*?)<\/[^>]+>/i,
    /title[^>]*>([\s\S]*?)<\/a>/i
  ]);

  var artist = getFirstMatch(row, [
    /class=["'][^"']*artist[^"']*["'][^>]*>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/i,
    /class=["'][^"']*artistName[^"']*["'][^>]*>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/i,
    /artist[^>]*>([\s\S]*?)<\/a>/i
  ]);

  var album = getFirstMatch(row, [
    /class=["'][^"']*album[^"']*["'][^>]*>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/i,
    /class=["'][^"']*albumName[^"']*["'][^>]*>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/i,
    /album[^>]*>([\s\S]*?)<\/a>/i
  ]);

  if (!trackId || !title) {
    return null;
  }

  return {
    id: trackId,
    name: title,
    artists: artist,
    album_name: album,
    provider_id: "bugs-music"
  };
}

function parseTracks(html, limit) {
  var tracks = [];
  var seen = {};

  var rows = html.match(/<tr[\s\S]*?<\/tr>/gi) || [];

  for (var i = 0; i < rows.length && tracks.length < limit; i++) {
    var track = parseTrackRow(rows[i]);

    if (!track) {
      continue;
    }

    if (seen[track.id]) {
      continue;
    }

    seen[track.id] = true;
    tracks.push(track);
  }

  return tracks;
}

function searchTracks(query, limit) {
  limit = limit || 20;

  var url =
    "https://music.bugs.co.kr/search/track?q=" +
    encodeURIComponent(query);

  var response = http.get(url, {
    "User-Agent": "Mozilla/5.0"
  });

  if (!response || !response.ok) {
    return [];
  }

  return parseTracks(response.body || "", limit);
}

function getTrack(trackId) {
  var url =
    "https://music.bugs.co.kr/track/" +
    encodeURIComponent(trackId);

  var response = http.get(url, {
    "User-Agent": "Mozilla/5.0"
  });

  if (!response || !response.ok) {
    return null;
  }

  var html = response.body || "";

  var title = getFirstMatch(html, [
    /class=["'][^"']*title[^"']*["'][^>]*>[\s\S]*?<h1[^>]*>([\s\S]*?)<\/h1>/i,
    /<h1[^>]*>([\s\S]*?)<\/h1>/i,
    /class=["'][^"']*trackTitle[^"']*["'][^>]*>([\s\S]*?)<\/[^>]+>/i
  ]);

  var artist = getFirstMatch(html, [
    /class=["'][^"']*artist[^"']*["'][^>]*>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/i,
    /class=["'][^"']*artistName[^"']*["'][^>]*>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/i
  ]);

  var album = getFirstMatch(html, [
    /class=["'][^"']*album[^"']*["'][^>]*>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/i,
    /class=["'][^"']*albumName[^"']*["'][^>]*>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/i
  ]);

  return {
    id: String(trackId),
    name: title,
    artists: artist,
    album_name: album,
    provider_id: "bugs-music",
    external_links: {
      bugs: url
    }
  };
}

function getHomeFeed() {
  var chartUrls = [
    "https://music.bugs.co.kr/chart",
    "https://music.bugs.co.kr/chart/track/realtime/total",
    "https://music.bugs.co.kr/chart/track/total"
  ];

  var tracks = [];

  for (var i = 0; i < chartUrls.length; i++) {
    var response = http.get(chartUrls[i], {
      "User-Agent": "Mozilla/5.0"
    });

    if (!response || !response.ok) {
      continue;
    }

    tracks = parseTracks(response.body || "", 100);

    if (tracks.length > 0) {
      break;
    }
  }

  return {
    success: true,
    greeting: "Bugs Music",
    sections: [
      {
        title: "Bugs TOP100",
        tracks: tracks
      }
    ]
  };
}

registerExtension({
  initialize: initialize,
  cleanup: cleanup,
  searchTracks: searchTracks,
  getTrack: getTrack,
  getHomeFeed: getHomeFeed
});
