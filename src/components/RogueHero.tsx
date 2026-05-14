interface RogueHeroProps {
  onEnterRogue: () => void;
  onOpenChallenges: () => void;
  onRestartTutorial: () => void;
}

const HERO_ASSETS = {
  // Replace these files in public/hero/ to update the hero art.
  reference: "/hero/hero-reference.png",
  curry: "/hero/steph-curry-player-card.png",
  horford: "/hero/al-horford-warriors-player-card.png",
  jordan: "/hero/michael-jordan-player-card.png",
};

export const RogueHero = ({
  onEnterRogue,
  onOpenChallenges,
  onRestartTutorial,
}: RogueHeroProps) => {
  return (
    <section
      className="rogue-hero relative h-full min-h-[460px] overflow-hidden rounded-[28px] border border-amber-100/28 shadow-card lg:rounded-[30px]"
      aria-labelledby="rogue-hero-title"
    >
      <img
        src={HERO_ASSETS.reference}
        alt=""
        className="rogue-hero__reference"
        draggable={false}
        aria-hidden="true"
      />

      <div className="rogue-hero__asset-preloads" aria-hidden="true">
        <img src={HERO_ASSETS.horford} alt="" draggable={false} />
        <img src={HERO_ASSETS.curry} alt="" draggable={false} />
        <img src={HERO_ASSETS.jordan} alt="" draggable={false} />
      </div>
      <div className="rogue-hero__card-mask" aria-hidden="true" />
      <img
        src={HERO_ASSETS.horford}
        alt="Al Horford Emerald player card"
        className="rogue-hero__reference-card rogue-hero__reference-card--horford"
        draggable={false}
      />
      <img
        src={HERO_ASSETS.curry}
        alt="Steph Curry Amethyst player card"
        className="rogue-hero__reference-card rogue-hero__reference-card--curry"
        draggable={false}
      />
      <img
        src={HERO_ASSETS.jordan}
        alt="Michael Jordan Galaxy player card"
        className="rogue-hero__reference-card rogue-hero__reference-card--jordan"
        draggable={false}
      />

      <div className="sr-only">
        <p>NBA Rogue Mode</p>
        <h1 id="rogue-hero-title">Build Your Dynasty</h1>
        <p>Floor by floor.</p>
        <p>
          Draft a starter core, survive boss gates, earn permanent cards, and
          turn every run into a cleaner path toward the next great roster.
        </p>
      </div>

      <div className="rogue-hero__hotspots" aria-label="Rogue Mode actions">
        <button
          type="button"
          data-tutorial-id="home-enter-rogue"
          onClick={onEnterRogue}
          className="rogue-hero__hotspot rogue-hero__hotspot--enter"
          aria-label="Enter Rogue"
        />
        <button
          type="button"
          onClick={onOpenChallenges}
          className="rogue-hero__hotspot rogue-hero__hotspot--challenges"
          aria-label="Challenges"
        />
        <button
          type="button"
          onClick={onRestartTutorial}
          className="rogue-hero__hotspot rogue-hero__hotspot--tutorial"
          aria-label="Tutorial"
        />
      </div>
    </section>
  );
};
