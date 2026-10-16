import { Documented, Features, GetGoing, Hero, LandingFooter, LandingNav, Specimen, Structure, Tooling } from '@views/home';

function HomePage() {
  return (
    <div data-slot="landing" className="bg-canvas text-fg min-h-dvh">
      <LandingNav />

      <main>
        <Hero />
        <Specimen />
        <Features />
        <Documented />
        <Tooling />
        <Structure />
        <GetGoing />
      </main>

      <LandingFooter />
    </div>
  );
}

export default HomePage;
