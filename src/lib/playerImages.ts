import { Player } from "../types";

const STORAGE_KEY = "legends-draft-player-images-v1";

const wikiTitleOverrides: Record<string, string> = {
  "julius-erving": "Julius_Erving",
  "shaquille-o-neal": "Shaquille_O%27Neal",
  "isiah-thomas": "Isiah_Thomas",
  "nikola-jokic": "Nikola_Joki%C4%87",
  "luka-doncic": "Luka_Don%C4%8Di%C4%87",
  "giannis-antetokounmpo": "Giannis_Antetokounmpo",
  "dikembe-mutombo": "Dikembe_Mutombo",
  "yao-ming": "Yao_Ming",
  "penny-hardaway": "Anfernee_Hardaway",
  "amar-e-stoudemire": "Amar%27e_Stoudemire",
  "kyrie-irving": "Kyrie_Irving",
  "chauncey-billups": "Chauncey_Billups",
  "walt-frazier": "Walt_Frazier",
};

const directImageOverrides: Record<string, string> = {
  "dennis-rodman":
    "https://legacymedia.sportsplatform.io/images_root/slides/photos/000/537/881/245838_original.jpg?1291222858",
  "david-robinson":
    "https://image.tmdb.org/t/p/w500/iFhzUGajalDsdS7AkfK4F6LpnwL.jpg",
  "hakeem-olajuwon":
    "https://preview.redd.it/i-asked-gemini-to-argue-why-hakeem-olajuwon-is-the-greatest-v0-098c1wd77ege1.jpeg?width=640&crop=smart&auto=webp&s=ba0ec03f9f7f9a70bdb2f5d9d9737c66f624f8bd",
  "dominique-wilkins":
    "https://i.namu.wiki/i/_p4r0n_sWZahVy6vsCWg4dK1KcNNx2vBCbSJjwbjB0B365GupjEiopY2yTuP-jncxj9LCC3gJA60vmcfXrebCg.webp",
  "isiah-thomas":
    "https://www.detroitnews.com/gcdn/presto/2023/04/08/PDTN/683e207e-aa13-4650-8b14-be9707cdc8bd-dtncent02-7a8uqlzs9eesbdjuq08_original.jpg?width=527&height=610&fit=crop&format=pjpg&auto=webp",
  "julius-erving":
    "https://cdn.nba.com/manage/2020/10/julius-erving-nets-392x588.jpg",
  "kareem-abdul-jabbar":
    "https://www.jsonline.com/gcdn/presto/2021/04/12/PMJS/22f3502c-f3ef-4f9c-8875-bf7a5b6c9e46-1970_MJS_Milwaukee_Bucks_Kareem_Abdul-Jabbar_Historical_Archive-1.jpg?width=660&height=1036&fit=crop&format=pjpg&auto=webp",
  "karl-malone":
    "https://i.pinimg.com/736x/73/d9/68/73d968077baa340b28ac64d2e9054b84.jpg",
  "john-stockton":
    "https://static.wikia.nocookie.net/nba/images/9/99/John_Stockton.jpg/revision/latest?cb=20110427165243",
  "kawhi-leonard":
    "https://www.uticaod.com/gcdn/authoring/2019/06/13/NOBD/ghows-NY-b55ce3d7-0e3c-4aa1-a1ea-a6c5cb5c94c2-1f669383.jpeg?width=1200&disable=upscale&format=pjpg&auto=webp",
  "kobe-bryant":
    "https://andscape.com/wp-content/uploads/2020/10/Kobe-Bryant-Game-5-2008-Finals-e1603379029250.jpg?w=800",
  "kevin-durant":
    "https://s.hdnux.com/photos/67/02/03/14426363/11/1920x0.jpg",
  "kyrie-irving":
    "https://www.usatoday.com/gcdn/-mm-/daafdabb5e49ae55569e2dbfe59cf6ee99818eef/c=87-0-2373-3048/local/-/media/2017/05/24/USATODAY/USATODAY/636311815863708051-USP-NBA-PLAYOFFS-BOSTON-CELTICS-AT-CLEVELAND-CAVA-91150919-1-.JPG?width=660&height=881&fit=crop&format=pjpg&auto=webp",
  "lebron-james":
    "https://videos.usatoday.net/Brightcove2/29906170001/2015/06/29906170001_4282564439001_USATSI-8601943.jpg?pubId=29906170001",
  "larry-bird":
    "https://www.usatoday.com/gcdn/-mm-/6d4245ebf464808df4dc3cdaddd9036c915be31f/c=0-300-3139-4486/local/-/media/2016/12/07/USATODAY/USATODAY/636167048457676560-XXX-LARRY-BIRD-PUTS-UP-A-JUMPSHOT-1706669AB-DNA007-20214831.JPG?width=458&height=610&fit=crop&format=pjpg&auto=webp",
  "magic-johnson":
    "https://cdn.artphotolimited.com/images/65802cc8bd40b870df716a6a/1000x1000/magic-johnson-leads-the-game-1992.jpg",
  "manu-ginobili":
    "https://cdn.nba.com/manage/2022/09/ginobili-emotion.jpg",
  "michael-jordan":
    "https://static.wikia.nocookie.net/nbastreet/images/9/97/FDB1BF72-3F75-446F-B4F2-000331AE638B.jpeg/revision/latest?cb=20210419024456",
  "vince-carter":
    "https://slamonline.com/wp-content/uploads/2014/07/vince_1.jpg",
  "oscar-robertson":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Oscar_Robertson1971.jpg/250px-Oscar_Robertson1971.jpg",
  "pau-gasol":
    "https://static.wikia.nocookie.net/nbasports/images/9/91/San_Antonio_Spurs_v_Los_Angeles_Lakers_Game_0_MoFFLaWuhl.jpg/revision/latest/scale-to-width-down/323?cb=20130705212405",
  "patrick-ewing":
    "https://blacknewsandviews.com/wp-content/uploads/2025/02/PatrickEwing-Knicks-SHIB-AP-BNV-scaled.jpg",
  "penny-hardaway":
    "https://cdn.nba.com/teams/legacy/www.nba.com/magic/sites/magic/files/9_penny-20170112.jpg",
  "reggie-miller":
    "https://www.tuscaloosanews.com/gcdn/authoring/2007/08/09/NTTN/ghows-DA-956c6365-614f-4280-8405-f5e1f84e025e-1569fd9a.jpeg?width=1200&disable=upscale&format=pjpg&auto=webp",
  "ray-allen":
    "https://www.sportsnet.ca/wp-content/uploads/2013/07/allen_ray640.jpg",
  "ben-wallace":
    "https://michigansportshof.org/mshof/wp-content/uploads/2019/01/ben-wallace.jpg",
  "chris-paul":
    "https://legacymedia.sportsplatform.io/images_root/slides/photos/000/538/714/106958476_original.jpg?1291243979",
  "anthony-davis":
    "https://www.usatoday.com/gcdn/presto/2019/01/25/USAT/8face4bf-fda9-4585-8fce-19d456e2fe5d-2019-01-24_Anthony_Davis1.jpg?crop=1744,2326,x365,y211",
  "shaquille-o-neal":
    "https://preview.redd.it/who-would-you-rather-have-prime-shaq-or-prime-giannis-v0-d0ogt1n4r6pe1.jpg?width=640&crop=smart&auto=webp&s=d72c0c9849e683ce07b4bfbe0ed627556c0247c5",
  "shawn-kemp":
    "https://i.ebayimg.com/images/g/K9IAAOSwH-9emMX0/s-l1200.jpg",
  "shai-gilgeous-alexander":
    "https://cdn.prod.website-files.com/64da5279f1559b26fb07550e/6834c822e2ddaf129383c171_Best%20Shai%20Gilgeous-Alexander%20Pick%20for%20Timberwolves%20vs.%20Thunder%20Game%204.jpg",
  "shawn-marion":
    "https://cdn.nba.com/teams/legacy/www.nba.com/suns/sites/suns/files/shawn_marion_retires_35.jpg",
  "steph-curry":
    "https://compote.slate.com/images/24605cda-82b1-4342-9af9-4b86f684174b.jpg",
  "yao-ming":
    "https://content.api.news/v3/images/bin/306b97c2277466d4e3ab4e23efb38ce6",
};

const runtimeCache = new Map<string, string | null>();

const getStorageCache = () => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string | null>) : {};
  } catch {
    return {};
  }
};

const saveStorageCache = (cache: Record<string, string | null>) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch {
    // Ignore storage write issues and continue with in-memory cache.
  }
};

const getWikiTitle = (player: Player) =>
  wikiTitleOverrides[player.id] ?? encodeURIComponent(player.name.replace(/\./g, ""));

export const getCachedPlayerImage = (player: Player) => {
  const directOverride = directImageOverrides[player.id];
  if (directOverride) {
    runtimeCache.set(player.id, directOverride);
    const storageCache = getStorageCache();
    if (storageCache[player.id] !== directOverride) {
      storageCache[player.id] = directOverride;
      saveStorageCache(storageCache);
    }
    return directOverride;
  }

  if (runtimeCache.has(player.id)) return runtimeCache.get(player.id) ?? null;
  const storageCache = getStorageCache();
  if (player.id in storageCache) {
    runtimeCache.set(player.id, storageCache[player.id]);
    return storageCache[player.id];
  }
  return null;
};

export const fetchPlayerImage = async (player: Player) => {
  const directOverride = directImageOverrides[player.id];
  if (directOverride) {
    runtimeCache.set(player.id, directOverride);
    const storageCache = getStorageCache();
    storageCache[player.id] = directOverride;
    saveStorageCache(storageCache);
    return directOverride;
  }

  const cached = getCachedPlayerImage(player);
  if (cached !== null) return cached;

  const title = getWikiTitle(player);

  try {
    const response = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${title}`,
    );
    if (!response.ok) throw new Error("Image lookup failed");

    const data = (await response.json()) as {
      thumbnail?: { source?: string };
      originalimage?: { source?: string };
    };

    const image =
      data.thumbnail?.source ??
      data.originalimage?.source ??
      null;

    runtimeCache.set(player.id, image);
    const storageCache = getStorageCache();
    storageCache[player.id] = image;
    saveStorageCache(storageCache);

    return image;
  } catch {
    runtimeCache.set(player.id, null);
    const storageCache = getStorageCache();
    storageCache[player.id] = null;
    saveStorageCache(storageCache);
    return null;
  }
};
