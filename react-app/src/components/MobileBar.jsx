export default function MobileBar() {
  return (
    <>
      <a href="tel:0671429695" className="mobile-bar-link" id="mobile-call">
        <svg className="icon" aria-hidden="true"><use href="#icon-phone"></use></svg>
        Appeler
      </a>
      <a href="#contact" className="mobile-bar-link mobile-bar-primary" id="mobile-rdv">
        Rendez-vous
      </a>
    </>
  );
}
