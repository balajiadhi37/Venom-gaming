"use client";

import { useState } from "react";
import { GAMES } from "../data1";

const FILTERS = ["All", "PS5", "PC"];

export default function Games() {
  const [filter, setFilter] = useState("All");

  const visible = GAMES.filter(
    (game) => filter === "All" || game.platform === filter || game.platform === "Both"
  );

  return (
    <section className="section" id="games">
      <div className="container">
        <div className="section-head">
          <h2>Games on the floor</h2>
          <p>
            Over 150 titles installed and ready. Here are the ones our regulars keep coming back
            for — ask at the counter and we will load anything else from the library.
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
          {visible.map((game) => (
            <article className="game-card" key={game.name}>
              <div className="game-art">{game.art}</div>
              <div className="game-body">
                <h4>{game.name}</h4>
                <p>{game.note}</p>
                <span className="tag hot">{game.platform === "Both" ? "PS5 + PC" : game.platform}</span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
