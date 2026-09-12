var BASE_URL = "https://music.bugs.co.kr";
var PROVIDER_ID = "bugs-music";

function initialize() {
  return {
    success: true
  };
}

function cleanup() {
  return {
    success: true
  };
}

function cleanText(value) {
  if (!value) {
    return "";
  }

  return String(value)
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function absoluteUrl(url) {
  if (!url) {
    return "";
  }

  url = String(url)
    .replace(/&amp;/gi, "&")
    .trim();

  if (url.indexOf("//") === 0) {
    return "https:" + url;
  }

  if (
    url.indexOf("http://") === 0 ||
    url.indexOf("https://") === 0
  ) {
    return url;
  }

  if (url.indexOf("/") === 0) {
    return BASE_URL + url;
  }

  return BASE_URL + "/" + url;
}

function firstMatch(text, patterns) {
  for (var i = 0; i < patterns.length; i++) {
    var match = text.match(patterns[i]);

    if (match && match[1]) {
      return cleanText(match[1]);
    }
  }

  return "";
}

function getTrackId(row) {
  return firstMatch(row, [
    /data-track-id\s*=\s*["'](\d+)["']/i,
    /data-trackid\s*=\s*["'](\d+)["']/i,
    /trackId\s*=\s*["']?(\d+)/i,
    /trackid\s*=\s*["']?(\d+)/i,
    /track\/(\d+)/i,
    /trackNo\s*=\s*["']?(\d+)/i
  ]);
}

function getTrackName(row) {
  return firstMatch(row, [
    /class=["'][^"']*title[^"']*["'][^>]*>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/i,
    /class=["'][^"']*trackTitle[^"']*["'][^>]*>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/i,
    /class=["'][^"']*title[^"']*["'][^>]*>([\s\S]*?)<\/span>/i,
    /class=["'][^"']*title[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
    /class=["'][^"']*trackTitle[^"']*["'][^>]*>([\s\S]*?)<\/span>/i,
    /title\s*=\s*["']([^"']+)["']/i
  ]);
}

function getArtistName(row) {
  return firstMatch(row, [
    /class=["'][^"']*artist[^"']*["'][^>]*>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/i,
    /class=["'][^"']*artistName[^"']*["'][^>]*>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/i,
    /class=["'][^"']*artist[^"']*["'][^>]*>([\s\S]*?)<\/span>/i,
    /class=["'][^"']*artist[^"']*["'][^>]*>([\s\S]*?)<\/div>/i
  ]);
}

function getAlbumName(row) {
  return firstMatch(row, [
    /class=["'][^"']*album[^"']*["'][^>]*>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/i,
    /class=["'][^"']*albumName[^"']*["'][^>]*>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/i,
    /class=["'][^"']*album[^"']*["'][^>]*>([\s\S]*?)<\/span>/i,
    /class=["'][^"']*album[^"']*["'][^>]*>([\s\S]*?)<\/div>/i
  ]);
}

function getCoverUrl(row) {
  var patterns = [
    /data-original\s*=\s*["']([^"']+)["']/i,
    /data-src\s*=\s*["']([^"']+)["']/i,
    /data-lazy\s*=\s*["']([^"']+)["']/i,
    /data-image\s*=\s*["']([^"']+)["']/i,
    /data-cover\s*=\s*["']([^"']+)["']/i,
    /data-album-img\s*=\s*["']([^"']+)["']/i,
    /src\s*=\s*["']([^"']+)["']/i,
    /srcset\s*=\s*["']([^"']+)["']/i,
    /background-image\s*:\s*url\(["']?([^"')]+)["']?\)/i,
    /url\(["']?([^"')]+)["']?\)/i
  ];

  for (var i = 0; i < patterns.length; i++) {
    var match = row.match(patterns[i]);

    if (!match || !match[1]) {
      continue;
    }

    var url = match[1]
      .split(",")[0]
      .trim()
      .split(" ")[0]
      .replace(/&amp;/gi, "&");

    if (!url) {
      continue;
    }

    if (
      url.indexOf("data:image") === 0 ||
      url.indexOf("blank.gif") >= 0 ||
      url.indexOf("transparent") >= 0
    ) {
      continue;
    }

    return absoluteUrl(url);
  }

  return "";
}

function parseTrackRow(row) {
  var id = getTrackId(row);

  if (!id) {
    return null;
  }

  var name = getTrackName(row);
  var artists = getArtistName(row);
  var albumName = getAlbumName(row);
  var coverUrl = getCoverUrl(row);

  if (!name) {
    name = "Bugs Track " + id;
  }

  return {
    id: String(id),
    name: name,
    artists: artists,
    album_name: albumName,
    cover_url: coverUrl
  };
}

function parseTracks(html) {
  var tracks = [];
  var seen = {};

  if (!html) {
    return tracks;
  }

  var rows = html.match(/<tr[\s\S]*?<\/tr>/gi) || [];

  for (var i = 0; i < rows.length; i++) {
    var track = parseTrackRow(rows[i]);

    if (!track || !track.id) {
      continue;
    }

    if (seen[track.id]) {
      continue;
    }

    seen[track.id] = true;
    tracks.push(track);
  }

  if (tracks.length === 0) {
    var blocks = html.match(
      /<(?:li|div)[^>]*(?:track|song|album)[^>]*>[\s\S]*?<\/(?:li|div)>/gi
    ) || [];

    for (var j = 0; j < blocks.length; j++) {
      var fallbackTrack = parseTrackRow(blocks[j]);

      if (!fallbackTrack || !fallbackTrack.id) {
        continue;
      }

      if (seen[fallbackTrack.id]) {
        continue;
      }

      seen[fallbackTrack.id] = true;
      tracks.push(fallbackTrack);
    }
  }

  return tracks;
}

function makeTrackResult(track) {
  return {
    id: String(track.id),
    uri: "bugs:track:" + String(track.id),
    type: "track",
    name: track.name || "",
    artists: track.artists || "",
    album_name: track.album_name || "",
    cover_url: track.cover_url || "",
    provider_id: PROVIDER_ID
  };
}

function makeHomeFeedItem(track) {
  return makeTrackResult(track);
}

function searchTracks(query) {
  if (!query || !String(query).trim()) {
    return {
      success: true,
      tracks: []
    };
  }

  var url =
    BASE_URL +
    "/search/track?q=" +
    encodeURIComponent(String(query).trim());

  return fetch(url)
    .then(function(response) {
      return response.text();
    })
    .then(function(html) {
      var tracks = parseTracks(html);

      return {
        success: true,
        tracks: tracks.map(makeTrackResult)
      };
    })
    .catch(function(error) {
      return {
        success: false,
        error: String(error),
        tracks: []
      };
    });
}

function getTrack(trackId) {
  var id = String(trackId || "")
    .replace("bugs:track:", "")
    .trim();

  if (!id) {
    return {
      success: false,
      error: "Track ID is missing"
    };
  }

  var url = BASE_URL + "/track/" + id;

  return fetch(url)
    .then(function(response) {
      return response.text();
    })
    .then(function(html) {
      var tracks = parseTracks(html);
      var track = tracks.length > 0 ? tracks[0] : null;

      if (!track) {
        track = {
          id: id,
          name: "Bugs Track " + id,
          artists: "",
          album_name: "",
          cover_url: ""
        };
      }

      return {
        success: true,
        track: makeTrackResult(track)
      };
    })
    .catch(function(error) {
      return {
        success: false,
        error: String(error)
      };
    });
}

function getChartTracks() {
  var url = BASE_URL + "/chart/track/realtime/total";

  return fetch(url)
    .then(function(response) {
      return response.text();
    })
    .then(function(html) {
      return parseTracks(html);
    })
    .catch(function() {
      return [];
    });
}

function makeSection(uri, title, tracks) {
  return {
    uri: uri,
    title: title,
    items: (tracks || []).map(makeHomeFeedItem)
  };
}

function getHomeFeed() {
  return getChartTracks()
    .then(function(tracks) {
      return {
        success: true,
        greeting: "Bugs Music",
        sections: [
          makeSection(
            "bugs:chart:realtime",
            "벅스 실시간 차트",
            tracks
          )
        ]
      };
    })
    .catch(function(error) {
      return {
        success: false,
        error: String(error),
        greeting: "Bugs Music",
        sections: []
      };
    });
}

registerExtension({
  initialize: initialize,
  cleanup: cleanup,
  searchTracks: searchTracks,
  getTrack: getTrack,
  getHomeFeed: getHomeFeed
});
