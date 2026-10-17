import { Documented, Features, GetGoing, Hero, LandingFooter, LandingNav, Specimen, Structure, Tooling } from '@views/home';

function HomePage() {
  return (
    <div data-slot="landing" className="bg-canvas text-fg min-h-dvh">
      <LandingNav />

      <main>
        <Hero />
        <Specimen />
        <Features />
        {/* The docs site is dev-only, so its showcase is too. */}
        {import.meta.env.DEV && <Documented />}
        <Tooling />
        <Structure />
        <GetGoing />
      </main>

      <LandingFooter />
    </div>
  );
}

export default HomePage;
