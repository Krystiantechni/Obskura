import { useState } from "react";
import Hero from "../components/sections/Hero";
import AudioPlayerSection from "../components/sections/AudioPlayerSection";
import FeaturedBanner from "../components/sections/FeaturedBanner";
import StoriesGrid from "../components/sections/StoriesGrid";
import TweaksPanel from "../components/ui/TweaksPanel";

const STORAGE_KEY = "obskura_hero_variant";

export default function Home() {
  const [variant, setVariant] = useState(() => localStorage.getItem(STORAGE_KEY) || "wide");

  const changeVariant = (v) => {
    setVariant(v);
    localStorage.setItem(STORAGE_KEY, v);
  };

  return (
    <>
      <Hero variant={variant} />
      <AudioPlayerSection />
      <FeaturedBanner />
      <StoriesGrid />
      <TweaksPanel variant={variant} onChange={changeVariant} />
    </>
  );
}
