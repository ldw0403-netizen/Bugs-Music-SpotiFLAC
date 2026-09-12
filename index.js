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
    /href=["'][^"']*\/track\/(\d+)[^"']*["']/i,
    /data-track-id\s*=\s*["'](\d+)["']/i,
    /data-trackid\s*=\s*["'](\d+)["']/i,
    /trackId\s*=\s*["']?(\d+)/i,
    /trackid\s*=\s*["']?(\d+)/i,
    /trackNo\s*=\s*["']?(\d+)/i
  ]);
}

function getTrackName(row) {
  return firstMatch(row, [
    /<p[^>]*class=["'][^"']*\btitle\b[^"']*["'][^>]*>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/i,
    /<a[^>]*class=["'][^"']*\btitle\b[^"']*["'][^>]*>([\s\S]*?)<\/a>/i,
    /class=["'][^"']*trackTitle[^"']*["'][^>]*>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/i,
    /class=["'][^"']*title[^"']*["'][^>]*>([\s\S]*?)<\/span>/i,
    /title\s*=\s*["']([^"']+)["']/i
  ]);
}

function getArtistName(row) {
  return firstMatch(row, [
    /<p[^>]*class=["'][^"']*\bartist\b[^"']*["'][^>]*>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/i,
    /<p[^>]*class=["'][^"']*artistName[^"']*["'][^>]*>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/i,
    /class=["'][^"']*artist[^"']*["'][^>]*>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/i,
    /class=["'][^"']*artist[^"']*["'][^>]*>([\s\S]*?)<\/span>/i
  ]);
}

function getAlbumName(row) {
  return firstMatch(row, [
    /<a[^>]*class=["'][^"']*\balbum\b[^"']*["'][^>]*>([\s\S]*?)<\/a>/i,
    /class=["'][^"']*albumName[^"']*["'][^>]*>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/i,
    /class=["'][^"']*album[^"']*["'][^>]*>([\s\S]*?)<\/span>/i
  ]);
}

function getCoverUrl(row) {
  var patterns = [
    /<a[^>]*class=["'][^"']*thumbnail[^"']*["'][^>]*>[\s\S]*?<img[^>]*src=["']([^"']+)["']/i,
    /<a[^>]*class=["'][^"']*thumbnail[^"']*["'][^>]*>[\s\S]*?<img[^>]*data-original=["']([^"']+)["']/i,
    /<img[^>]*data-original=["']([^"']+)["']/i,
    /<img[^>]*data-src=["']([^"']+)["']/i,
    /<img[^>]*src=["']([^"']+)["']/i,
    /background-image\s*:\s*url\(["']?([^"')]+)["']?\)/i
  ];

  for (var i = 0; i < patterns.length; i++) {
    var match = row.match(patterns[i]);

    if (!match || !match[1]) {
      continue;
    }

    var url = match[1]
      .replace(/&amp;/gi, "&")
      .split(",")[0]
      .trim()
      .split(" ")[0];

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

  var rows = html.match(
    /<tr[^>]*>[\s\S]*?<\/tr>/gi
  ) || [];

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
    var listItems = html.match(
      /<li[^>]*>[\s\S]*?<\/li>/gi
    ) || [];

    for (var j = 0; j < listItems.length; j++) {
      var listTrack = parseTrackRow(listItems[j]);

      if (!listTrack || !listTrack.id) {
        continue;
      }

      if (seen[listTrack.id]) {
        continue;
      }

      seen[listTrack.id] = true;
      tracks.push(listTrack);
    }
  }

  if (tracks.length === 0) {
    var divBlocks = html.match(
      /<div[^>]*>[\s\S]*?<\/div>/gi
    ) || [];

    for (var k = 0; k < divBlocks.length; k++) {
      var divTrack = parseTrackRow(divBlocks[k]);

      if (!divTrack || !divTrack.id) {
        continue;
      }

      if (seen[divTrack.id]) {
        continue;
      }

      seen[divTrack.id] = true;
      tracks.push(divTrack);
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

function makeSection(uri, title, tracks) {
  return {
    uri: uri,
    title: title,
    items: (tracks || []).map(makeTrackResult)
  };
}

function fetchHtml(url) {
  return fetch(url).then(function(response) {
    if (!response || !response.ok) {
      throw new Error("Bugs HTTP error: " + url);
    }

    return response.text();
  });
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

  return fetchHtml(url)
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

  return fetchHtml(url)
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

  return fetchHtml(url).then(function(html) {
    var tracks = parseTracks(html);

    if (!tracks.length) {
      throw new Error("Bugs chart returned zero tracks");
    }

    return tracks;
  });
}

function getLatestTracks() {
  var url = BASE_URL + "/newest/track";

  return fetchHtml(url).then(function(html) {
    return parseTracks(html);
  });
}

function getHomeFeed() {
  return Promise.all([
    getChartTracks(),
    getLatestTracks()
  ])
    .then(function(results) {
      var chartTracks = results[0] || [];
      var latestTracks = results[1] || [];

      var sections = [];

      if (chartTracks.length > 0) {
        sections.push(
          makeSection(
            "bugs:chart:realtime",
            "벅스 실시간 차트",
            chartTracks
          )
        );
      }

      if (latestTracks.length > 0) {
        sections.push(
          makeSection(
            "bugs:latest",
            "벅스 최신음악",
            latestTracks
          )
        );
      }

      return {
        success: true,
        greeting: "Bugs Music",
        sections: sections
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