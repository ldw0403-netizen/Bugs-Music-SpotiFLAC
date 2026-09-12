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

function getFirstMatch(text, patterns) {
  for (var i = 0; i < patterns.length; i++) {
    var match = text.match(patterns[i]);

    if (match && match[1]) {
      return cleanText(match[1]);
    }
  }

  return "";
}

function absoluteUrl(url) {
  if (!url) {
    return "";
  }

  url = String(url).trim();

  if (url.indexOf("//") === 0) {
    return "https:" + url;
  }

  if (url.indexOf("/") === 0) {
    return BASE_URL + url;
  }

  if (url.indexOf("http://") === 0 || url.indexOf("https://") === 0) {
    return url;
  }

  return BASE_URL + "/" + url;
}

function getCoverUrl(row) {
  var patterns = [
    /<img[^>]+(?:data-original|data-src|src)=["']([^"']+)["']/i,
    /(?:data-original|data-src|src)=["']([^"']+)["']/i
  ];

  for (var i = 0; i < patterns.length; i++) {
    var match = row.match(patterns[i]);

    if (match && match[1]) {
      var url = match[1]
        .replace(/&amp;/gi, "&")
        .trim();

      if (
        url.indexOf(".jpg") >= 0 ||
        url.indexOf(".jpeg") >= 0 ||
        url.indexOf(".png") >= 0 ||
        url.indexOf(".webp") >= 0 ||
        url.indexOf("image") >= 0 ||
        url.indexOf("album") >= 0
      ) {
        return absoluteUrl(url);
      }
    }
  }

  return "";
}

function getTrackId(row) {
  return getFirstMatch(row, [
    /trackId["'\s:=]+["']?(\d+)/i,
    /trackid["'\s:=]+["']?(\d+)/i,
    /data-track-id=["'](\d+)["']/i,
    /track\/(\d+)/i,
    /\/track\/(\d+)/i
  ]);
}

function getTrackName(row) {
  return getFirstMatch(row, [
    /class=["'][^"']*title[^"']*["'][^>]*>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/i,
    /class=["'][^"']*title[^"']*["'][^>]*>([\s\S]*?)<\/span>/i,
    /class=["'][^"']*title[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
    /class=["'][^"']*trackTitle[^"']*["'][^>]*>([\s\S]*?)<\/a>/i,
    /title=["']([^"']+)["']/i
  ]);
}

function getArtistName(row) {
  return getFirstMatch(row, [
    /class=["'][^"']*artist[^"']*["'][^>]*>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/i,
    /class=["'][^"']*artist[^"']*["'][^>]*>([\s\S]*?)<\/span>/i,
    /class=["'][^"']*artist[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
    /class=["'][^"']*artistName[^"']*["'][^>]*>([\s\S]*?)<\/a>/i
  ]);
}

function getAlbumName(row) {
  return getFirstMatch(row, [
    /class=["'][^"']*album[^"']*["'][^>]*>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/i,
    /class=["'][^"']*album[^"']*["'][^>]*>([\s\S]*?)<\/span>/i,
    /class=["'][^"']*album[^"']*["'][^>]*>([\s\S]*?)<\/div>/i
  ]);
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

    if (!track || !track.id || seen[track.id]) {
      continue;
    }

    seen[track.id] = true;
    tracks.push(track);
  }

  if (tracks.length === 0) {
    var fallbackBlocks = html.match(/<div[\s\S]*?(?:track|song)[\s\S]*?<\/div>/gi) || [];

    for (var j = 0; j < fallbackBlocks.length; j++) {
      var fallbackTrack = parseTrackRow(fallbackBlocks[j]);

      if (!fallbackTrack || !fallbackTrack.id || seen[fallbackTrack.id]) {
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
    id: track.id,
    uri: "bugs:track:" + track.id,
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

  var keyword = encodeURIComponent(String(query).trim());
  var url = BASE_URL + "/search/track?q=" + keyword;

  return fetch(url).then(function(response) {
    return response.text();
  }).then(function(html) {
    var tracks = parseTracks(html);

    return {
      success: true,
      tracks: tracks.map(makeTrackResult)
    };
  }).catch(function(error) {
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

  return fetch(url).then(function(response) {
    return response.text();
  }).then(function(html) {
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
  }).catch(function(error) {
    return {
      success: false,
      error: String(error)
    };
  });
}

function fetchChart(url) {
  return fetch(url).then(function(response) {
    return response.text();
  }).then(function(html) {
    return parseTracks(html);
  }).catch(function() {
    return [];
  });
}

function getChartTracks() {
  var urls = [
    BASE_URL + "/chart",
    BASE_URL + "/chart/track/realtime/total",
    BASE_URL + "/chart/track/total"
  ];

  return Promise.all([
    fetchChart(urls[0]),
    fetchChart(urls[1]),
    fetchChart(urls[2])
  ]).then(function(results) {
    return {
      top100: results[0],
      realtime: results[1],
      total: results[2]
    };
  });
}

function makeSection(uri, title, tracks) {
  return {
    uri: uri,
    title: title,
    items: (tracks || []).map(makeHomeFeedItem)
  };
}

function makeLinkItem(id, title, url) {
  return {
    id: id,
    uri: url,
    type: "playlist",
    name: title,
    artists: "Bugs Music",
    album_name: title,
    cover_url: "",
    provider_id: PROVIDER_ID
  };
}

function makeCategorySection(title, items) {
  return {
    uri: "bugs:category:" + encodeURIComponent(title),
    title: title,
    items: items
  };
}

function getHomeFeed() {
  return getChartTracks().then(function(chartData) {
    var sections = [];

    sections.push(
      makeSection(
        "bugs:chart:top100",
        "벅스 차트 TOP100",
        chartData.top100
      )
    );

    sections.push(
      makeSection(
        "bugs:chart:realtime",
        "벅스 실시간 차트",
        chartData.realtime
      )
    );

    sections.push(
      makeSection(
        "bugs:chart:total",
        "벅스 전체 차트",
        chartData.total
      )
    );

    sections.push(
      makeCategorySection("최신음악", [
        makeLinkItem(
          "latest-all",
          "최신음악 전체",
          BASE_URL + "/newest"
        ),
        makeLinkItem(
          "latest-domestic",
          "최신음악 국내",
          BASE_URL + "/newest/track/domestic"
        ),
        makeLinkItem(
          "latest-overseas",
          "최신음악 해외",
          BASE_URL + "/newest/track/overseas"
        ),
        makeLinkItem(
          "latest-other",
          "최신음악 기타",
          BASE_URL + "/newest/track/etc"
        )
      ])
    );

    sections.push(
      makeCategorySection("장르 선택", [
        makeLinkItem(
          "genre-all",
          "전체 장르",
          BASE_URL + "/genre"
        ),
        makeLinkItem(
          "genre-domestic",
          "국내 장르",
          BASE_URL + "/genre/domestic"
        ),
        makeLinkItem(
          "genre-overseas",
          "해외 장르",
          BASE_URL + "/genre/overseas"
        ),
        makeLinkItem(
          "genre-other",
          "기타 장르",
          BASE_URL + "/genre/etc"
        )
      ])
    );

    sections.push(
      makeCategorySection("Essential", [
        makeLinkItem(
          "essential",
          "Essential",
          BASE_URL + "/essential"
        )
      ])
    );

    sections.push(
      makeCategorySection("뮤직PD", [
        makeLinkItem(
          "music-pd",
          "뮤직PD",
          BASE_URL + "/musicpd"
        )
      ])
    );

    sections.push(
      makeCategorySection("연도별 음악", [
        makeLinkItem(
          "year-music",
          "연도별 음악",
          BASE_URL + "/year"
        )
      ])
    );

    sections.push(
      makeCategorySection("Favorite", [
        makeLinkItem(
          "favorite",
          "Favorite",
          BASE_URL + "/favorite"
        )
      ])
    );

    sections.push(
      makeCategorySection("투표", [
        makeLinkItem(
          "vote",
          "투표",
          BASE_URL + "/vote"
        )
      ])
    );

    sections.push(
      makeCategorySection("하트충전소", [
        makeLinkItem(
          "heart",
          "하트충전소",
          BASE_URL + "/heart"
        )
      ])
    );

    sections.push(
      makeCategorySection("라디오", [
        makeLinkItem(
          "radio",
          "라디오",
          BASE_URL + "/radio"
        )
      ])
    );

    sections.push(
      makeCategorySection("뮤직포스트", [
        makeLinkItem(
          "music-post",
          "뮤직포스트",
          BASE_URL + "/musicpost"
        )
      ])
    );

    sections.push(
      makeCategorySection("커넥트", [
        makeLinkItem(
          "connect",
          "커넥트",
          BASE_URL + "/connect"
        )
      ])
    );

    return {
      success: true,
      greeting: "Bugs Music",
      sections: sections
    };
  }).catch(function(error) {
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
