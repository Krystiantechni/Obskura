import Hero from "../components/sections/Hero";
import AudioPlayerSection from "../components/sections/AudioPlayerSection";
import FeaturedBanner from "../components/sections/FeaturedBanner";
import StoriesGrid from "../components/sections/StoriesGrid";

export default function Home() {
  return (
    <>
      <Hero />
      <AudioPlayerSection />
      <FeaturedBanner />
      <StoriesGrid />
    </>
  );
}
