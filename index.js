var BASE_URL = "https://music.bugs.co.kr";
var PROVIDER_ID = "bugs-music";
var MAX_HOME_TRACKS = 30;
var MAX_SEARCH_TRACKS = 50;

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
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, function(_, code) {
      return String.fromCharCode(Number(code));
    })
    .replace(/\s+/g, " ")
    .trim();
}

function absoluteUrl(url) {
  if (!url) {
    return "";
  }

  var value = String(url)
    .replace(/&amp;/gi, "&")
    .replace(/\\u002F/g, "/")
    .replace(/\\\//g, "/")
    .trim();

  if (
    value.indexOf("data:image") === 0 ||
    value.indexOf("javascript:") === 0 ||
    value.indexOf("#") === 0
  ) {
    return "";
  }

  if (value.indexOf("//") === 0) {
    return "https:" + value;
  }

  if (
    value.indexOf("http://") === 0 ||
    value.indexOf("https://") === 0
  ) {
    return value;
  }

  if (value.indexOf("/") === 0) {
    return BASE_URL + value;
  }

  return BASE_URL + "/" + value;
}

function firstMatch(text, patterns) {
  for (var i = 0; i < patterns.length; i++) {
    var match = String(text || "").match(patterns[i]);

    if (match && match[1]) {
      return cleanText(match[1]);
    }
  }

  return "";
}

function getTrackId(text) {
  return firstMatch(text, [
    /data-track-id\s*=\s*["']?(\d+)/i,
    /data-trackid\s*=\s*["']?(\d+)/i,
    /data-track-no\s*=\s*["']?(\d+)/i,
    /data-trackno\s*=\s*["']?(\d+)/i,
    /data-song-id\s*=\s*["']?(\d+)/i,
    /data-songid\s*=\s*["']?(\d+)/i,
    /data-content-id\s*=\s*["']?(\d+)/i,
    /trackId\s*[:=]\s*["']?(\d+)/i,
    /track_id\s*[:=]\s*["']?(\d+)/i,
    /trackid\s*[:=]\s*["']?(\d+)/i,
    /trackNo\s*[:=]\s*["']?(\d+)/i,
    /songId\s*[:=]\s*["']?(\d+)/i,
    /song_id\s*[:=]\s*["']?(\d+)/i,
    /\/track\/(\d+)/i,
    /track\/(\d+)/i,
    /trackNo=(\d+)/i,
    /trackId=(\d+)/i
  ]);
}

function getTrackName(block) {
  return firstMatch(block, [
    /class=["'][^"']*(?:trackTitle|track_title|title)[^"']*["'][^>]*>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/i,
    /class=["'][^"']*(?:trackTitle|track_title|title)[^"']*["'][^>]*>([\s\S]*?)<\/(?:span|div|p|strong)>/i,
    /class=["'][^"']*songname[^"']*["'][^>]*>([\s\S]*?)<\/(?:span|div|a)>/i,
    /class=["'][^"']*song_name[^"']*["'][^>]*>([\s\S]*?)<\/(?:span|div|a)>/i,
    /class=["'][^"']*name[^"']*["'][^>]*>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/i,
    /title=["']([^"']+)["']/i,
    /data-title=["']([^"']+)["']/i,
    /data-song-name=["']([^"']+)["']/i
  ]);
}

function getArtistName(block) {
  return firstMatch(block, [
    /class=["'][^"']*(?:artistName|artist_name|artist)[^"']*["'][^>]*>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/i,
    /class=["'][^"']*(?:artistName|artist_name|artist)[^"']*["'][^>]*>([\s\S]*?)<\/(?:span|div|p)>/i,
    /data-artist-name=["']([^"']+)["']/i,
    /data-artist=["']([^"']+)["']/i
  ]);
}

function getAlbumName(block) {
  return firstMatch(block, [
    /class=["'][^"']*(?:albumName|album_name|album)[^"']*["'][^>]*>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/i,
    /class=["'][^"']*(?:albumName|album_name|album)[^"']*["'][^>]*>([\s\S]*?)<\/(?:span|div|p)>/i,
    /data-album-name=["']([^"']+)["']/i,
    /data-album=["']([^"']+)["']/i
  ]);
}

function getCoverUrl(block) {
  var patterns = [
    /data-original\s*=\s*["']([^"']+)["']/i,
    /data-original-src\s*=\s*["']([^"']+)["']/i,
    /data-src\s*=\s*["']([^"']+)["']/i,
    /data-lazy-src\s*=\s*["']([^"']+)["']/i,
    /data-lazy\s*=\s*["']([^"']+)["']/i,
    /data-image\s*=\s*["']([^"']+)["']/i,
    /data-cover\s*=\s*["']([^"']+)["']/i,
    /data-album-img\s*=\s*["']([^"']+)["']/i,
    /data-album-image\s*=\s*["']([^"']+)["']/i,
    /data-thumbnail\s*=\s*["']([^"']+)["']/i,
    /srcset\s*=\s*["']([^"']+)["']/i,
    /src\s*=\s*["']([^"']+)["']/i,
    /background-image\s*:\s*url\(["']?([^"')]+)["']?\)/i,
    /"image"\s*:\s*"([^"]+)"/i,
    /"imageUrl"\s*:\s*"([^"]+)"/i,
    /"albumImage"\s*:\s*"([^"]+)"/i
  ];

  for (var i = 0; i < patterns.length; i++) {
    var match = String(block || "").match(patterns[i]);

    if (!match || !match[1]) {
      continue;
    }

    var value = match[1]
      .replace(/\\u002F/g, "/")
      .replace(/\\\//g, "/")
      .split(",")[0]
      .trim()
      .split(/\s+/)[0];

    if (
      !value ||
      value.indexOf("data:image") === 0 ||
      value.indexOf("blank.gif") >= 0 ||
      value.indexOf("transparent") >= 0 ||
      value.indexOf("spacer") >= 0
    ) {
      continue;
    }

    return absoluteUrl(value);
  }

  return "";
}

function parseTrackBlock(block, fallbackId) {
  var id = getTrackId(block) || fallbackId;

  if (!id) {
    return null;
  }

  var track = {
    id: String(id),
    name: getTrackName(block),
    artists: getArtistName(block),
    album_name: getAlbumName(block),
    cover_url: getCoverUrl(block)
  };

  if (!track.name) {
    track.name = "Bugs Track " + String(id);
  }

  return track;
}

function addTrack(tracks, seen, track, limit) {
  if (!track || !track.id) {
    return;
  }

  var id = String(track.id);

  if (seen[id]) {
    return;
  }

  if (tracks.length >= limit) {
    return;
  }

  seen[id] = true;
  tracks.push(track);
}

function parseTracks(html, limit) {
  var tracks = [];
  var seen = {};
  var source = String(html || "");

  if (!source) {
    return tracks;
  }

  var max = limit || MAX_SEARCH_TRACKS;
  var blocks = [];

  blocks = source.match(/<tr[\s\S]*?<\/tr>/gi) || [];

  for (var i = 0; i < blocks.length; i++) {
    addTrack(
      tracks,
      seen,
      parseTrackBlock(blocks[i]),
      max
    );
  }

  var itemBlocks = source.match(
    /<(?:li|article|div)[^>]*(?:track|song|album|music)[^>]*>[\s\S]*?<\/(?:li|article|div)>/gi
  ) || [];

  for (var j = 0; j < itemBlocks.length; j++) {
    addTrack(
      tracks,
      seen,
      parseTrackBlock(itemBlocks[j]),
      max
    );
  }

  var idMatches = [];
  var idPattern = /(?:data-track-id|data-trackid|trackId|trackid|trackNo|trackno|songId|songid|\/track\/)\s*["':=\/]?\s*(\d+)/gi;
  var match;

  while ((match = idPattern.exec(source)) !== null) {
    idMatches.push(match[1]);
  }

  for (var k = 0; k < idMatches.length; k++) {
    var trackId = idMatches[k];
    var position = source.indexOf(trackId);

    if (position < 0) {
      continue;
    }

    var start = Math.max(0, position - 1800);
    var end = Math.min(source.length, position + 1800);
    var nearby = source.substring(start, end);

    addTrack(
      tracks,
      seen,
      parseTrackBlock(nearby, trackId),
      max
    );
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

function fetchText(url) {
  return fetch(url)
    .then(function(response) {
      return response.text();
    });
}

function searchTracks(query) {
  var value = String(query || "").trim();

  if (!value) {
    return {
      success: true,
      tracks: []
    };
  }

  var url =
    BASE_URL +
    "/search/track?q=" +
    encodeURIComponent(value);

  return fetchText(url)
    .then(function(html) {
      var tracks = parseTracks(html, MAX_SEARCH_TRACKS);

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
    .replace(/^bugs:track:/i, "")
    .trim();

  if (!id) {
    return {
      success: false,
      error: "Track ID is missing"
    };
  }

  return fetchText(BASE_URL + "/track/" + id)
    .then(function(html) {
      var tracks = parseTracks(html, 5);
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
  var urls = [
    BASE_URL + "/chart/track/realtime/total",
    BASE_URL + "/chart",
    BASE_URL + "/newest"
  ];

  function tryNext(index) {
    if (index >= urls.length) {
      return Promise.resolve([]);
    }

    return fetchText(urls[index])
      .then(function(html) {
        var tracks = parseTracks(html, MAX_HOME_TRACKS);

        if (tracks.length > 0) {
          return tracks;
        }

        return tryNext(index + 1);
      })
      .catch(function() {
        return tryNext(index + 1);
      });
  }

  return tryNext(0);
}

function makeSection(uri, title, tracks) {
  var items = (tracks || []).map(makeTrackResult);

  return {
    uri: uri,
    title: title,
    items: items
  };
}

function getHomeFeed() {
  return getChartTracks()
    .then(function(tracks) {
      var sections = [];

      if (tracks && tracks.length > 0) {
        sections.push(
          makeSection(
            "bugs:chart:realtime",
            "벅스 실시간 차트",
            tracks
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
        success: true,
        greeting: "Bugs Music",
        sections: [],
        error: String(error)
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
