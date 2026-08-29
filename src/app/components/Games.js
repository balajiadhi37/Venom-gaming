"use client";

import { useState } from "react";
import { GAMES } from "../data1";

const FILTERS = ["All", "PS5", "PC"];

export default function Games() {
  const [filter, setFilter] = useState("All");
  const [picked, setPicked] = useState(null);
  // Covers degrade gracefully: remote art -> local poster -> emoji.
  const [fallback, setFallback] = useState({});

  function stepDown(game) {
    setFallback((prev) => {
      const stage = prev[game.name] ?? 0;
      return { ...prev, [game.name]: stage + 1 };
    });
  }

  function coverFor(game) {
    const stage = fallback[game.name] ?? 0;
    if (stage === 0) return game.image;
    if (stage === 1 && game.poster && game.poster !== game.image) return game.poster;
    // Out of sources: the tile keeps its gradient rather than showing a glyph.
    return null;
  }

  const visible = GAMES.filter(
    (game) => filter === "All" || game.platform === filter || game.platform === "Both"
  );

  return (
    <section className="section" id="games">
      <div className="container">
        <div className="section-head reveal">
          <h2>Games on the floor</h2>
          <p>
            Over 150 titles installed and ready. Here are the ones our regulars keep coming back
            for — tap a cover to pick your title, then ask at the counter and we will load anything
            else from the library.
          </p>
        </div>

        <div className="filter-row">
          {FILTERS.map((item) => (
            <button
              key={item}
              type="button"
              className={`filter-btn${filter === item ? " active" : ""}`}
              onClick={() => setFilter(item)}
            >
              {item === "All" ? "All games" : item}
            </button>
          ))}
        </div>

        <div className="grid-3">
          {visible.map((game) => {
            const isPicked = picked === game.name;
            const cover = coverFor(game);

            return (
              <article
                key={game.name}
                className={`game-card reveal${isPicked ? " picked" : ""}`}
                tabIndex={0}
                role="button"
                aria-pressed={isPicked}
                onClick={() => setPicked(isPicked ? null : game.name)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setPicked(isPicked ? null : game.name);
                  }
                }}
              >
                <div className="game-art">
                  {cover && (
                    <img
                      className="game-img"
                      src={cover}
                      alt={`${game.name} cover art`}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      onError={() => stepDown(game)}
                    />
                  )}
                  <span className="game-art-shine" aria-hidden="true" />
                  <span className="game-platform">
                    {game.platform === "Both" ? "PS5 + PC" : game.platform}
                  </span>
                </div>

                <div className="game-body">
                  <h4>{game.name}</h4>
                  <p>{game.note}</p>
                  <span className="tag hot">
                    {isPicked ? "Picked — mention it at the counter" : "Tap to pick"}
                  </span>
                </div>
              </article>
            );
          })}
        </div>

        <p className="art-credit">
          Cover art served from the public Steam, Epic Games and PlayStation store CDNs.
        </p>
      </div>
    </section>
  );
}
