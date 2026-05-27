import { useEffect, useState } from "react";
import Hero from "../components/sections/Hero";
import AudioPlayerSection from "../components/sections/AudioPlayerSection";
import FeaturedBanner from "../components/sections/FeaturedBanner";
import StoriesGrid from "../components/sections/StoriesGrid";
import TweaksPanel from "../components/ui/TweaksPanel";

const STORAGE_KEY = "obskura_hero_variant";
const TOTAL = 47 * 60 + 12;

export default function Home() {
  const [variant, setVariant] = useState(() => localStorage.getItem(STORAGE_KEY) || "wide");
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0.18);

  const changeVariant = (v) => {
    setVariant(v);
    localStorage.setItem(STORAGE_KEY, v);
  };

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setProgress((p) => {
        const next = p + 1 / TOTAL;
        return next > 1 ? 0 : next;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [playing]);

  const toggle = () => setPlaying((p) => !p);

  return (
    <>
      <Hero variant={variant} playing={playing} onToggle={toggle} />
      <AudioPlayerSection playing={playing} onToggle={toggle} progress={progress} onSeek={setProgress} />
      <FeaturedBanner />
      <StoriesGrid />
      <TweaksPanel variant={variant} onChange={changeVariant} />
    </>
  );
}
