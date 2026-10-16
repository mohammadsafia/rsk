import { Hero, LandingNav, Specimen } from '@views/home';

function HomePage() {
  return (
    <div data-slot="landing" className="bg-canvas text-fg min-h-dvh">
      <LandingNav />

      <main>
        <Hero />
        <Specimen />
      </main>
    </div>
  );
}

export default HomePage;
