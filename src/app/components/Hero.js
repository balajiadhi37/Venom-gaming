import { resolveHeroArt } from "../heroArt";
import { STATS, STUDIO } from "../data1";
import HeroScene from "./HeroScene";

// Server component: the headline, copy, buttons and stats stay in the initial
// HTML with no hydration cost. Only the three decorative art layers inside
// HeroScene cross the client boundary, and they take plain string props.
export default function Hero() {
  const art = resolveHeroArt();

  return (
    <section className="hero">
      <HeroScene {...art} />
      <div className="container">
        <div className="hero-inner">
          <span className="eyebrow">PS5 · Sim Racing · Mylapore, Chennai</span>
          <h1>
            Enter the <span className="accent" data-text="Venom">Venom</span> gaming studio.
          </h1>
          <p>
            {STUDIO.tagline} Eight PlayStation 5 consoles, twelve RTX battle stations and a
            library of 150+ titles — open every day until 11 PM.
          </p>
          <div className="hero-actions">
            <a className="btn btn-primary" href="#contact">
              Book your slot
            </a>
            <a className="btn btn-ghost" href="#games">
              See the game list
            </a>
          </div>
        </div>

        <div className="stats">
          {STATS.map((stat) => (
            <div className="stat" key={stat.label}>
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
