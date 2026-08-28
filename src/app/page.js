import Header from "./components/Header";
import Games from "./components/Games";
import BookingForm from "./components/BookingForm";
import Footer from "./components/Footer";
import SpiderWeb from "./components/SpiderWeb";
import { PLANS, SETUPS, STATS, STUDIO } from "./data1";

export default function Home() {
  return (
    <>
      <Header />

      <main id="top">
        {/* ---------- hero ---------- */}
        <section className="hero">
          <SpiderWeb className="web-tl" />
          <SpiderWeb className="web-tr" />
          <div className="container">
            <div className="hero-inner">
              <span className="eyebrow">PS5 · Gaming PC · Coimbatore</span>
              <h1>
                Enter the <span className="accent">Venom</span> gaming studio.
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

        {/* ---------- setups ---------- */}
        <section className="section alt" id="setups">
          <div className="container">
            <div className="section-head">
              <h2>What we run</h2>
              <p>
                Two zones, one studio. Console players get the couch and the big screen; PC players
                get the high refresh rate and the mechanical keys.
              </p>
            </div>
            <div className="grid-3">
              {SETUPS.map((setup) => (
                <article className="card" key={setup.title}>
                  <div className="card-icon">{setup.icon}</div>
                  <h3>{setup.title}</h3>
                  <p>{setup.text}</p>
                  <div className="tag-list">
                    {setup.tags.map((tag) => (
                      <span className="tag" key={tag}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- games ---------- */}
        <Games />

        {/* ---------- pricing ---------- */}
        <section className="section alt" id="pricing">
          <SpiderWeb className="web-br" />
          <div className="container">
            <div className="section-head">
              <h2>Simple hourly pricing</h2>
              <p>No membership fees, no hidden charges. Pay for the time you play.</p>
            </div>
            <div className="grid-3">
              {PLANS.map((plan) => (
                <article
                  className={`card price-card${plan.featured ? " featured" : ""}`}
                  key={plan.name}
                >
                  {plan.badge && <span className="price-badge">{plan.badge}</span>}
                  <h3>{plan.name}</h3>
                  <div className="price">
                    {plan.price} <small>{plan.unit}</small>
                  </div>
                  <ul className="price-list">
                    {plan.perks.map((perk) => (
                      <li key={perk}>{perk}</li>
                    ))}
                  </ul>
                  <a className={`btn ${plan.featured ? "btn-primary" : "btn-ghost"}`} href="#contact">
                    Book this
                  </a>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- contact ---------- */}
        <section className="section" id="contact">
          <div className="container">
            <div className="section-head">
              <h2>Book a seat</h2>
              <p>
                Drop your details and we will hold your station. Walk-ins are welcome too, but
                weekends fill up fast.
              </p>
            </div>

            <div className="contact-grid">
              <div>
                <div className="info-row">
                  <span className="label">Studio</span>
                  <span className="value">{STUDIO.address}</span>
                </div>
                <div className="info-row">
                  <span className="label">Open</span>
                  <span className="value">{STUDIO.hours}</span>
                </div>
                <div className="info-row">
                  <span className="label">Phone</span>
                  <span className="value">{STUDIO.phone}</span>
                </div>
                <div className="info-row">
                  <span className="label">Email</span>
                  <span className="value">{STUDIO.email}</span>
                </div>
                <div className="info-row">
                  <span className="label">Instagram</span>
                  <span className="value">{STUDIO.instagram}</span>
                </div>
              </div>

              <BookingForm />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
