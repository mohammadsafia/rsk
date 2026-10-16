import { Hero, LandingNav } from '@views/home';

function HomePage() {
  return (
    <div data-slot="landing" className="bg-canvas text-fg min-h-dvh">
      <LandingNav />

      <main>
        <Hero />
      </main>
    </div>
  );
}

export default HomePage;
