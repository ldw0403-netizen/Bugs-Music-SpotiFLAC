function initialize(config) {
  return true;
}

function cleanup() {
}

function searchTracks(query, limit) {
  limit = limit || 20;

  var url =
    "https://music.bugs.co.kr/search/track?q=" +
    encodeURIComponent(query);

  var response = http.get(url, {
    "User-Agent": "Mozilla/5.0"
  });

  if (!response.ok) {
    return [];
  }

  var html = response.body;
  var results = [];

  var rowRegex =
    /<tr[^>]*tracklist[^>]*>[\s\S]*?<\/tr>/gi;

  var rows = html.match(rowRegex) || [];

  for (var i = 0; i < rows.length && results.length < limit; i++) {
    var row = rows[i];

    var idMatch =
      row.match(/trackId["']?\s*[:=]\s*["']?(\d+)/i) ||
      row.match(/track\/(\d+)/i);

    var titleMatch =
      row.match(/title[^>]*>([\s\S]*?)<\/a>/i);

    var artistMatch =
      row.match(/artist[^>]*>([\s\S]*?)<\/a>/i);

    var albumMatch =
      row.match(/album[^>]*>([\s\S]*?)<\/a>/i);

    if (!idMatch || !titleMatch) {
      continue;
    }

    function cleanText(text) {
      return text
        .replace(/<[^>]+>/g, "")
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/\s+/g, " ")
        .trim();
    }

    results.push({
      id: idMatch[1],
      name: cleanText(titleMatch[1]),
      artists: artistMatch ? cleanText(artistMatch[1]) : "",
      album_name: albumMatch ? cleanText(albumMatch[1]) : "",
      provider_id: "bugs-music"
    });
  }

  return results;
}

function getTrack(trackId) {
  var url = "https://music.bugs.co.kr/track/" + trackId;

  var response = http.get(url, {
    "User-Agent": "Mozilla/5.0"
  });

  if (!response.ok) {
    return null;
  }

  return {
    id: String(trackId),
    name: "",
    artists: "",
    album_name: "",
    provider_id: "bugs-music",
    external_links: {
      bugs: url
    }
  };
}

function getHomeFeed() {
  return [];
}

registerExtension({
  initialize: initialize,
  cleanup: cleanup,
  searchTracks: searchTracks,
  getTrack: getTrack,
  getHomeFeed: getHomeFeed
});
