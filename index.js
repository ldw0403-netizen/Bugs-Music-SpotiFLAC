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

  var items = tracks.map(function(track) {
    return {
      id: track.id,
      uri: "bugs:track:" + track.id,
      type: "track",
      name: track.name,
      artists: track.artists || "",
      album_name: track.album_name || "",
      provider_id: "bugs-music"
    };
  });

  return {
    success: true,
    greeting: "Bugs TOP100",
    sections: [
      {
        uri: "bugs:top100",
        title: "Bugs TOP100",
        items: items
      }
    ]
  };
}
