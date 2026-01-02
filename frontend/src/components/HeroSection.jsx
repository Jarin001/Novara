import "../styles/hero.css";
import "../styles/animatedLaptop.css";
import AnimatedLaptopMockup from "./AnimatedLaptopMockup";

export default function HeroSection() {
  return (
    <section className="hero-section">
      <div className="container text-center">
        {/* HERO TEXT */}
        <div className="hero-text mb-5">
          <h1 className="display-5 fw-bold">
            Organize your research, effortlessly
          </h1>
          <p className="lead text-muted">
            Read, annotate, cite, and collaborate on research papers — all in one place.
          </p>
        </div>

        {/* ANIMATION BELOW TEXT */}
        <div className="hero-animation d-flex justify-content-center">
          <AnimatedLaptopMockup />
        </div>
      </div>
    </section>
  );
}
