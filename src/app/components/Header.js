import { STUDIO } from "../data1";

export default function Header() {
  return (
    <header className="header">
      <div className="container header-inner">
        <a className="logo" href="#top">
          <img className="logo-mark" src={STUDIO.logo} alt="" width="36" height="36" />
          <span>
            VENOM <span className="accent">GAMING ARENA</span>
          </span>
        </a>
        <nav className="nav">
          <a href="#setups">Setups</a>
          <a href="#games">Games</a>
          <a href="#pricing">Pricing</a>
          <a href="#contact">Contact</a>
        </nav>
        <a className="btn btn-primary" href="#contact">
          Book a seat
        </a>
      </div>
    </header>
  );
}
