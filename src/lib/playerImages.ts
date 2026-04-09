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
  "anfernee-hardaway": "Anfernee_Hardaway",
  "amar-e-stoudemire": "Amar%27e_Stoudemire",
  "kyrie-irving": "Kyrie_Irving",
  "chauncey-billups": "Chauncey_Billups",
  "walt-frazier": "Walt_Frazier",
};

const directImageOverrides: Record<string, string> = {
  "kareem-abdul-jabbar":
    "https://www.jsonline.com/gcdn/presto/2021/04/12/PMJS/22f3502c-f3ef-4f9c-8875-bf7a5b6c9e46-1970_MJS_Milwaukee_Bucks_Kareem_Abdul-Jabbar_Historical_Archive-1.jpg?width=660&height=1036&fit=crop&format=pjpg&auto=webp",
  "kobe-bryant":
    "https://andscape.com/wp-content/uploads/2020/10/Kobe-Bryant-Game-5-2008-Finals-e1603379029250.jpg?w=800",
  "larry-bird":
    "https://www.usatoday.com/gcdn/-mm-/6d4245ebf464808df4dc3cdaddd9036c915be31f/c=0-300-3139-4486/local/-/media/2016/12/07/USATODAY/USATODAY/636167048457676560-XXX-LARRY-BIRD-PUTS-UP-A-JUMPSHOT-1706669AB-DNA007-20214831.JPG?width=458&height=610&fit=crop&format=pjpg&auto=webp",
  "magic-johnson":
    "https://cdn.artphotolimited.com/images/65802cc8bd40b870df716a6a/1000x1000/magic-johnson-leads-the-game-1992.jpg",
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
