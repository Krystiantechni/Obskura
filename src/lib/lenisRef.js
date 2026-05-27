// Współdzielona referencja do instancji Lenis — ustawiana przez useLenisScroll,
// odczytywana tam, gdzie potrzebna prędkość scrolla (np. krew w banerze cookie).
let instance = null;

export const setLenis = (l) => { instance = l; };
export const getLenis = () => instance;
