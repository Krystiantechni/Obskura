import { useEffect, useState } from "react";

// Maszyna do pisania — animacja typewriter dla tablicy stringów.
// strings: ["Witaj", "Cześć", "Halo"], speed: ms per znak, pause: między stringami.
export function useTypewriter({ strings = [""], speed = 80, pause = 1500, loop = true } = {}) {
  const [text, setText] = useState("");
  const [stringIdx, setStringIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!strings.length) return undefined;
    const current = strings[stringIdx % strings.length] || "";
    let timer;

    if (!deleting && charIdx <= current.length) {
      timer = setTimeout(() => {
        setText(current.slice(0, charIdx));
        setCharIdx((c) => c + 1);
      }, speed);
    } else if (!deleting && charIdx > current.length) {
      timer = setTimeout(() => setDeleting(true), pause);
    } else if (deleting && charIdx > 0) {
      timer = setTimeout(() => {
        setText(current.slice(0, charIdx - 1));
        setCharIdx((c) => c - 1);
      }, speed / 2);
    } else if (deleting && charIdx === 0) {
      setDeleting(false);
      setStringIdx((i) => (loop ? (i + 1) % strings.length : Math.min(i + 1, strings.length - 1)));
    }
    return () => clearTimeout(timer);
  }, [charIdx, deleting, stringIdx, strings, speed, pause, loop]);

  return text;
}

export default useTypewriter;
