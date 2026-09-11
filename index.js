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
    .replace(/\s+/g, " ")
    .trim();
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

  var html = response.body || "";
  var results = [];

  var rows =
    html.match(/<tr[\s\S]*?<\/tr>/gi) || [];

  for (var i = 0; i < rows.length && results.length < limit; i++) {
    var row = rows[i];

    var idMatch =
      row.match(/trackId["']?\s*[:=]\s*["']?(\d+)/i) ||
      row.match(/\/track\/(\d+)/i) ||
      row.match(/track\/(\d+)/i);

    var titleMatch =
      row.match(/class=["'][^"']*title[^"']*["'][^>]*>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/i) ||
      row.match(/title[^>]*>([\s\S]*?)<\/a>/i);

    var artistMatch =
      row.match(/class=["'][^"']*artist[^"']*["'][^>]*>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/i) ||
      row.match(/artist[^>]*>([\s\S]*?)<\/a>/i);

    var albumMatch =
      row.match(/class=["'][^"']*album[^"']*["'][^>]*>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/i) ||
      row.match(/album[^>]*>([\s\S]*?)<\/a>/i);

    if (!idMatch || !titleMatch) {
      continue;
    }

    var title = cleanText(titleMatch[1]);

    if (!title) {
      continue;
    }

    results.push({
      id: String(idMatch[1]),
      name: title,
      artists: artistMatch ? cleanText(artistMatch[1]) : "",
      album_name: albumMatch ? cleanText(albumMatch[1]) : "",
      provider_id: "bugs-music"
    });
  }

  return results;
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

  var titleMatch =
    html.match(/class=["'][^"']*title[^"']*["'][^>]*>[\s\S]*?<h1[^>]*>([\s\S]*?)<\/h1>/i) ||
    html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);

  var artistMatch =
    html.match(/class=["'][^"']*artist[^"']*["'][^>]*>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/i);

  var albumMatch =
    html.match(/class=["'][^"']*album[^"']*["'][^>]*>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/i);

  return {
    id: String(trackId),
    name: titleMatch ? cleanText(titleMatch[1]) : "",
    artists: artistMatch ? cleanText(artistMatch[1]) : "",
    album_name: albumMatch ? cleanText(albumMatch[1]) : "",
    provider_id: "bugs-music",
    external_links: {
      bugs: url
    }
  };
}

function getHomeFeed() {
  var response = http.get(
    "https://music.bugs.co.kr/",
    {
      "User-Agent": "Mozilla/5.0"
    }
  );

  if (!response || !response.ok) {
    return {
      success: true,
      greeting: "Bugs Music",
      sections: []
    };
  }

  return {
    success: true,
    greeting: "Bugs Music",
    sections: []
  };
}

registerExtension({
  initialize: initialize,
  cleanup: cleanup,
  searchTracks: searchTracks,
  getTrack: getTrack,
  getHomeFeed: getHomeFeed
});
