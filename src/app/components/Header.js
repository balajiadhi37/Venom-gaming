import Logo from "./Logo";

export default function Header() {
  return (
    <header className="header">
      <div className="container header-inner">
        <Logo />
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
