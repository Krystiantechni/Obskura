// src/lib/catalogApi.js
// Cienka warstwa nad request() (B8a). Listy/seasons/genres publiczne (auth:false);
// detal odcinka wysyła token (auth:true) — zalogowany+uprawniony dostaje audio_url premium.
// Endpoint detalu ma OptionalTokenAuth → zły/wygasły token NIE daje 401 (pozostaje publiczny).
import { request } from "./apiClient.js";

function qs(params = {}) {
  const usp = new URLSearchParams();
  for (const [key, val] of Object.entries(params)) {
    if (val === undefined || val === null || val === "") continue;
    usp.append(key, String(val));
  }
  const s = usp.toString();
  return s ? `?${s}` : "";
}

export const fetchEpisodes = (params = {}) =>
  request("GET", `catalog/episodes${qs(params)}`, { auth: false });

export const fetchEpisode = (slug) =>
  request("GET", `catalog/episodes/${slug}`, { auth: true });

export const fetchSeasons = () => request("GET", "catalog/seasons", { auth: false });
export const fetchGenres = () => request("GET", "catalog/genres", { auth: false });
export const fetchCreators = (params = {}) =>
  request("GET", `catalog/creators${qs(params)}`, { auth: false });
