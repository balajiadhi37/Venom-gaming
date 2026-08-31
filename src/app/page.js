import Header from "./components/Header";
import Games from "./components/Games";
import BookingForm from "./components/BookingForm";
import Footer from "./components/Footer";
import Hero from "./components/Hero";
import { PLANS, SETUPS, STUDIO } from "./data1";

export default function Home() {
  return (
    <>
      <Header />

      <main id="top">
        <Hero />

        {/* ---------- setups ---------- */}
        <section className="section alt" id="setups">
          <div className="container">
            <div className="section-head reveal">
              <h2>What we run</h2>
              <p>
                Two zones, one studio. Console players get the couch and the big screen; PC players
                get the high refresh rate and the mechanical keys.
              </p>
            </div>
            <div className="grid-3">
              {SETUPS.map((setup) => (
                <article className="card reveal" key={setup.title}>
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
          <div className="container">
            <div className="section-head reveal">
              <h2>Simple hourly pricing</h2>
              <p>No membership fees, no hidden charges. Pay for the time you play.</p>
            </div>
            <div className="grid-3">
              {PLANS.map((plan) => (
                <article
                  className={`card price-card reveal${plan.featured ? " featured" : ""}`}
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
            <div className="section-head reveal">
              <h2>Book a seat</h2>
              <p>
                Drop your details and we will hold your station. Walk-ins are welcome too, but
                weekends fill up fast.
              </p>
            </div>

            <div className="contact-grid reveal">
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
