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
  "hakeem-olajuwon":
    "https://preview.redd.it/i-asked-gemini-to-argue-why-hakeem-olajuwon-is-the-greatest-v0-098c1wd77ege1.jpeg?width=640&crop=smart&auto=webp&s=ba0ec03f9f7f9a70bdb2f5d9d9737c66f624f8bd",
  "julius-erving":
    "https://cdn.nba.com/manage/2020/10/julius-erving-nets-392x588.jpg",
  "kareem-abdul-jabbar":
    "https://www.jsonline.com/gcdn/presto/2021/04/12/PMJS/22f3502c-f3ef-4f9c-8875-bf7a5b6c9e46-1970_MJS_Milwaukee_Bucks_Kareem_Abdul-Jabbar_Historical_Archive-1.jpg?width=660&height=1036&fit=crop&format=pjpg&auto=webp",
  "karl-malone":
    "https://i.pinimg.com/736x/73/d9/68/73d968077baa340b28ac64d2e9054b84.jpg",
  "kobe-bryant":
    "https://andscape.com/wp-content/uploads/2020/10/Kobe-Bryant-Game-5-2008-Finals-e1603379029250.jpg?w=800",
  "kyrie-irving":
    "https://www.usatoday.com/gcdn/-mm-/daafdabb5e49ae55569e2dbfe59cf6ee99818eef/c=87-0-2373-3048/local/-/media/2017/05/24/USATODAY/USATODAY/636311815863708051-USP-NBA-PLAYOFFS-BOSTON-CELTICS-AT-CLEVELAND-CAVA-91150919-1-.JPG?width=660&height=881&fit=crop&format=pjpg&auto=webp",
  "larry-bird":
    "https://www.usatoday.com/gcdn/-mm-/6d4245ebf464808df4dc3cdaddd9036c915be31f/c=0-300-3139-4486/local/-/media/2016/12/07/USATODAY/USATODAY/636167048457676560-XXX-LARRY-BIRD-PUTS-UP-A-JUMPSHOT-1706669AB-DNA007-20214831.JPG?width=458&height=610&fit=crop&format=pjpg&auto=webp",
  "magic-johnson":
    "https://cdn.artphotolimited.com/images/65802cc8bd40b870df716a6a/1000x1000/magic-johnson-leads-the-game-1992.jpg",
  "michael-jordan":
    "https://static.wikia.nocookie.net/nbastreet/images/9/97/FDB1BF72-3F75-446F-B4F2-000331AE638B.jpeg/revision/latest?cb=20210419024456",
  "oscar-robertson":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Oscar_Robertson1971.jpg/250px-Oscar_Robertson1971.jpg",
  "penny-hardaway":
    "https://cdn.nba.com/teams/legacy/www.nba.com/magic/sites/magic/files/9_penny-20170112.jpg",
  "ray-allen":
    "https://www.sportsnet.ca/wp-content/uploads/2013/07/allen_ray640.jpg",
  "shawn-kemp":
    "https://i.ebayimg.com/images/g/K9IAAOSwH-9emMX0/s-l1200.jpg",
  "shai-gilgeous-alexander":
    "https://cdn.prod.website-files.com/64da5279f1559b26fb07550e/6834c822e2ddaf129383c171_Best%20Shai%20Gilgeous-Alexander%20Pick%20for%20Timberwolves%20vs.%20Thunder%20Game%204.jpg",
  "steph-curry":
    "https://compote.slate.com/images/24605cda-82b1-4342-9af9-4b86f684174b.jpg",
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
