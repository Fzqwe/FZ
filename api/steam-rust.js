const RUST_APP_ID = 252490;
const VANITY_NAME = 'Fazzyqwerty';

function json(body, status = 200) {
  return {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 's-maxage=60, stale-while-revalidate=300',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify(body),
  };
}

module.exports = async function handler(request, response) {
  if (request.method !== 'GET') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.STEAM_API_KEY;
  if (!apiKey) {
    return response.status(503).json({
      error: 'Steam API is not configured',
      code: 'missing_api_key',
    });
  }

  try {
    const vanityUrl = new URL('https://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/');
    vanityUrl.searchParams.set('key', apiKey);
    vanityUrl.searchParams.set('vanityurl', VANITY_NAME);
    const vanityResponse = await fetch(vanityUrl);
    if (!vanityResponse.ok) throw new Error(`Vanity API responded with ${vanityResponse.status}`);

    const vanityData = await vanityResponse.json();
    const steamId = vanityData.response?.success === 1 ? vanityData.response.steamid : null;
    if (!steamId) {
      return response.status(404).json({ error: 'Steam profile was not found', code: 'profile_not_found' });
    }

    const gamesUrl = new URL('https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/');
    gamesUrl.searchParams.set('key', apiKey);
    gamesUrl.searchParams.set('steamid', steamId);
    gamesUrl.searchParams.set('include_appinfo', '1');
    gamesUrl.searchParams.set('format', 'json');
    const gamesResponse = await fetch(gamesUrl);
    if (!gamesResponse.ok) throw new Error(`Games API responded with ${gamesResponse.status}`);

    const gamesData = await gamesResponse.json();
    const rust = gamesData.response?.games?.find((game) => game.appid === RUST_APP_ID);
    const rustHours = rust ? rust.playtime_forever / 60 : 0;

    return response.status(200).json({
      steamId,
      game: 'Rust',
      appId: RUST_APP_ID,
      rustHours,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Steam Rust API error:', error);
    return response.status(502).json({
      error: 'Steam data is temporarily unavailable',
      code: 'steam_upstream_error',
    });
  }
};
