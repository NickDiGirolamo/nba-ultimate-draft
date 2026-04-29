import clsx from "clsx";
import { Shield } from "lucide-react";
import { getNbaTeamByName } from "../data/nbaTeams";
import { PlayerTier } from "../types";
import { CardHoloOverlay, type CardHoloVariant } from "./CardHoloOverlay";

const BASE_CARD_WIDTH = 380;
const BASE_CARD_HEIGHT = 920;
export const COACH_CARD_BACKGROUND_IMAGE_URL =
  "https://www.shutterstock.com/image-photo/hand-draw-strategy-game-plan-600nw-2711322611.jpg";

export const coachImageOverrides: Record<string, string> = {
  "billy-cunningham": "https://www.the-sun.com/wp-content/uploads/sites/6/2023/09/philadelphia-76ers-head-coach-billy-844774340.jpg?quality=80&strip=all&w=673",
  "byron-scott-pelicans": "https://a.espncdn.com/media/motion/2014/0725/dm_140725_nba_byron_scott_lakers/dm_140725_nba_byron_scott_lakers.jpg",
  "chuck-daly": "https://assets.fiba.basketball/image/upload/f_auto/q_auto/v1726740663/xpihyqlg2jnireymcnjy.jpg",
  "doc-rivers": "https://nbacoaches.com/wp-content/uploads/2019/02/rivers-site.jpg",
  "doug-collins": "https://cdn.nba.com/teams/legacy/www.nba.com/bulls/sites/bulls/files/210710_samsmith_dougcollins_coaching_16x9.jpg",
  "don-nelson": "https://pbs.twimg.com/media/C_4czk_UMAAzBMu.jpg",
  "erik-spoelstra": "https://images.wsj.net/im-784088?width=1280&size=1",
  "flip-saunders": "https://nbacoaches.com/wp-content/uploads/2016/10/Flip_SaundersWEB.jpg",
  "gregg-popovich": "https://www.usatoday.com/gcdn/media/USATODAY/USATODAY/2012/12/01/2012-12-01-gregg-popovich-3_4.jpg",
  "jack-ramsay": "https://blogs.columbian.com/blazer-banter/wp-content/uploads/sites/5/2014/04/jack-ramsey.jpg",
  "jerry-sloan": "https://imengine.public.prod.dur.navigacloud.com/?uuid=299F8647-B889-41EE-8F10-308400954988&function=original&type=preview",
  "larry-bird": "https://cdn.bleacherreport.net/images_root/slides/photos/000/690/782/72548801_original.jpg?1296706282",
  "lawrence-frank": "https://cdnph.upi.com/svc/sv/upi/90011241027637/2009/1/9b59cbd34f9e9443fe5aa1607a6ca72f/Nets-retain-Coach-Lawrence-Frank.jpg",
  "lionel-hollins": "https://external-preview.redd.it/lionel-hollins-left-hand-has-broken-fingers-that-never-v0-mMf-nZkBK58C6skFhG49K_qQPZJ1txG1-QpTNa3q_rg.jpg?auto=webp&s=e8eb043338c1174fa137f8b44293d943e729b297",
  "mark-daigneault": "https://cdn.nba.com/manage/2025/11/GettyImages-22459259082.jpg",
  "michael-malone": "https://gsp-image-cdn.wmsports.io/cms/prod/bleacher-report/getty_images/2208935722_large_cropped_2.jpg",
  "mike-budenholzer": "https://www.nydailynews.com/wp-content/uploads/migration/2015/04/21/SF6XQZTRZKF6SB7MT7KKXJ47U4.jpg?w=535",
  "mike-dantoni": "https://media.npr.org/assets/img/2019/01/11/ap_18332096199625_custom-9c3009cd25fa97632b02884629fdaa858fa6e1e4.jpg",
  "nick-nurse": "https://www.sportsnet.ca/wp-content/uploads/2018/10/nick-nurse-1st-win.jpg",
  "red-auerbach": "https://s.yimg.com/ny/api/res/1.2/2DpUMuXiI38ZG0Rtd5yIjw--/YXBwaWQ9aGlnaGxhbmRlcjt3PTY0MDtoPTc5MztjZj13ZWJw/https://media.zenfs.com/en/celtics_wire_usa_today_sports_articles_699/fb230aa67e7583cc84235e5e5bb0cc7a",
  "red-holzman": "https://inkwellmanagement.com/images/authors/holzman_william.jpg",
  "paul-silas": "https://gray-wbtv-prod.gtv-cdn.com/resizer/v2/IOTKMTEQWZBUBBVNF6PTPKVQLE.jpg?auth=eff13d9f3510619421f43aa6dda0d16760b5a5eb7f37a3080bf5c36be3b647d7&width=1200&height=600&smart=true",
  "phil-jackson-bulls": "https://www.orlandosentinel.com/wp-content/uploads/migration/2015/02/03/5XNSUJJLJFAMPFRXQK6XYF3Y6Q.jpg",
  "phil-jackson-lakers": "https://legacymedia.sportsplatform.io/images_root/slides/photos/000/406/031/102051053_original.jpg?1285100751",
  "rick-adelman": "https://cdn.nba.com/teams/legacy/www.nba.com/timberwolves/sites/timberwolves/files/adelmania1_140421_756.jpg",
  "rick-carlisle": "https://arc-anglerfish-arc2-prod-bostonglobe.s3.amazonaws.com/public/MOOJNWXXYFHRLI4XZFWCEYWYQM.jpg",
  "rudy-tomjanovich": "https://images.foxtv.com/static.fox26houston.com/www.fox26houston.com/content/uploads/2020/04/764/432/GettyImages-1028414890.jpg?ve=1&tl=1",
  "stan-van-gundy": "https://static01.nyt.com/images/2020/10/21/sports/21nba-vangundy/21nba-vangundy-mediumSquareAt3X.jpg",
  "steve-kerr": "https://nbacoaches.com/wp-content/uploads/2015/01/Steve-Kerr-Western-Conference-All-Star-Coach.jpg",
  "tyronn-lue": "https://i.insider.com/5aafd7cecc50291c008b4c3b?width=700",
};

export const getCardLabCoachImageUrl = (coachId: string) => coachImageOverrides[coachId] ?? null;

interface CardLabCoachCardProps {
  coach: {
    id: string;
    label: string;
    teamName: string;
    conference: "east" | "west";
  };
  rarity?: PlayerTier;
  holoOverlay?: boolean;
  holoVariant?: CardHoloVariant;
}

export const CardLabCoachCard = ({
  coach,
  rarity: _rarity = "Galaxy",
  holoOverlay = false,
  holoVariant = "prism",
}: CardLabCoachCardProps) => {
  const team = getNbaTeamByName(coach.teamName);
  const coachImageUrl = getCardLabCoachImageUrl(coach.id);
  const initials = coach.label
    .split(" ")
    .map((segment) => segment.replace(/[^A-Za-z]/g, "").charAt(0))
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="relative mx-auto overflow-hidden" style={{ width: `${BASE_CARD_WIDTH}px`, height: `${BASE_CARD_HEIGHT}px` }}>
      <div
        className={clsx(
          "relative min-h-[920px] overflow-hidden rounded-[30px] border border-white/18 bg-[linear-gradient(180deg,rgba(11,18,31,0.98),rgba(3,7,18,0.98))] p-5 text-white shadow-[0_24px_56px_rgba(0,0,0,0.34)]",
        )}
        style={{
          width: `${BASE_CARD_WIDTH}px`,
          minHeight: `${BASE_CARD_HEIGHT}px`,
        }}
      >
        <img
          src={COACH_CARD_BACKGROUND_IMAGE_URL}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover opacity-[0.82] saturate-[0.86] contrast-[1.08]"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,7,18,0.18),rgba(3,7,18,0.34)_48%,rgba(3,7,18,0.72))]" />
        <div className="absolute inset-[1px] rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),transparent_24%,rgba(2,6,23,0.2)_100%)]" />

        <div className="relative flex h-full flex-col">
          <div className="grid grid-cols-[auto_1fr_auto] items-start gap-3">
            <div className="rounded-full border border-white/12 bg-black/45 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-200 whitespace-nowrap">
              Coach
            </div>

            <div className="flex justify-center pt-1">
              {team?.logo ? (
                <div className="flex h-24 w-24 items-center justify-center rounded-[22px] border border-white/12 bg-black/45 p-4 shadow-[0_12px_28px_rgba(0,0,0,0.16)]">
                  <img
                    src={team.logo}
                    alt={`${team.name} logo`}
                    className="h-full w-full object-contain"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                </div>
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-[22px] border border-white/12 bg-black/45 text-xl font-semibold text-white/80 shadow-[0_12px_28px_rgba(0,0,0,0.16)]">
                  {initials}
                </div>
              )}
            </div>

            <div className="h-[32px] w-[76px]" />
          </div>

          <div className="relative mt-4 h-[360px] overflow-hidden rounded-[30px] border border-white/12 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.14),transparent_26%),linear-gradient(180deg,rgba(15,23,42,0.72),rgba(2,6,23,0.94))]">
            {coachImageUrl ? (
              <img
                src={coachImageUrl}
                alt={coach.label}
                className="absolute inset-0 h-full w-full object-cover object-top"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            ) : null}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_16%,rgba(255,255,255,0.16),transparent_16%),radial-gradient(circle_at_80%_22%,rgba(255,255,255,0.12),transparent_14%),linear-gradient(135deg,rgba(255,255,255,0.06),transparent_36%,rgba(255,255,255,0.03)_74%,rgba(2,6,23,0.35))]" />
            {team?.logo && !coachImageUrl ? (
              <div className="absolute inset-0 flex items-center justify-center opacity-[0.14]">
                <img
                  src={team.logo}
                  alt=""
                  aria-hidden="true"
                  className="h-[68%] w-[68%] object-contain saturate-150"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              </div>
            ) : null}
            {coachImageUrl ? null : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                <div className="flex h-24 w-24 items-center justify-center rounded-full border border-white/14 bg-black/28 shadow-[0_18px_36px_rgba(0,0,0,0.26)] backdrop-blur-[2px]">
                  <Shield size={42} className="text-white/88" />
                </div>
                <div className="text-center">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-200/84">
                    {coach.conference === "east" ? "Eastern Conference" : "Western Conference"}
                  </div>
                  <div className="mt-2 text-lg font-semibold text-white">{coach.teamName}</div>
                </div>
              </div>
            )}
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.08),transparent_36%,rgba(2,6,23,0.56)_84%)]" />
            <div className="absolute inset-x-0 bottom-0 z-10 px-4 pb-4 text-center">
              <div className="pointer-events-none absolute left-4 right-4 top-[-24px] bottom-[-12px] rounded-[28px] bg-[linear-gradient(180deg,rgba(0,0,0,0)_0%,rgba(0,0,0,0.18)_24%,rgba(0,0,0,0.5)_56%,rgba(0,0,0,0.82)_100%)]" />
              <div className="relative inline-flex items-center justify-center px-5 py-2.5">
                <div className="relative text-center font-display text-[1.62rem] font-semibold leading-[1.02] tracking-tight text-white drop-shadow-[0_10px_22px_rgba(0,0,0,0.92)]">
                  {coach.label}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 px-2 py-2">
            <div className="w-full rounded-[24px] border border-white/12 bg-[linear-gradient(180deg,rgba(4,8,18,0.72),rgba(4,8,18,0.9))] px-4 py-4 shadow-[0_16px_32px_rgba(0,0,0,0.28)] backdrop-blur-[5px]">
              <div className="text-center text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                Team Boost
              </div>
              <div className="mt-3 flex min-h-[74px] flex-col items-center justify-center gap-3">
                <div className="rounded-full border border-white/12 bg-black/34 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/88">
                  {coach.teamName}
                </div>
                <div className="rounded-full border border-emerald-300/22 bg-emerald-300/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-100">
                  +1 OVR to matching players
                </div>
              </div>
            </div>
          </div>
        </div>

        <CardHoloOverlay enabled={holoOverlay} variant={holoVariant} />
      </div>
    </div>
  );
};
