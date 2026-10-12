export interface CaptionPlayer {
  getOptions?(module?: string): string[];
  getOption?(module: string, option: string): unknown;
  setOption?(module: string, option: string, value: unknown): void;
  loadModule?(module: string): void;
  unloadModule?(module: string): void;
}

export interface CaptionSnapshot {
  state: "loading" | "off" | "on" | "unavailable";
  canToggle: boolean;
}

type Track = { languageCode: string; [key: string]: unknown };
const isTrack = (value: unknown): value is Track =>
  Boolean(
    value &&
    typeof value === "object" &&
    "languageCode" in value &&
    typeof value.languageCode === "string" &&
    value.languageCode,
  );

export function readCaptions(player: CaptionPlayer): CaptionSnapshot {
  try {
    if (!player.getOptions || !player.getOption)
      return { state: "unavailable", canToggle: false };
    const modules = player.getOptions();
    if (!Array.isArray(modules))
      return { state: "unavailable", canToggle: false };
    // Module loading is exposed by the current SDK, but is not a documented
    // long-term contract. Detect it; never assume that it exists.
    const moduleControl =
      typeof player.loadModule === "function" &&
      typeof player.unloadModule === "function";
    if (!modules.includes("captions"))
      return { state: "off", canToggle: moduleControl };
    const options = player.getOptions("captions");
    if (!Array.isArray(options) || !options.includes("track"))
      return { state: "unavailable", canToggle: false };
    const track = player.getOption("captions", "track");
    // The SDK returns null/undefined when no caption track is selected,
    // including after unloading a previously registered captions module.
    if (track == null) return { state: "off", canToggle: moduleControl };
    if (typeof track !== "object")
      return { state: "unavailable", canToggle: false };
    return {
      state: isTrack(track) ? "on" : "off",
      canToggle:
        Boolean(player.setOption) &&
        (moduleControl || options.includes("tracklist")),
    };
  } catch {
    return { state: "unavailable", canToggle: false };
  }
}

export function applyCaptions(
  player: CaptionPlayer,
  enabled: boolean,
): "applied" | "waiting" | "unavailable" | "no-tracks" {
  try {
    if (!player.getOptions || !player.getOption) return "unavailable";
    const modules = player.getOptions();
    if (!Array.isArray(modules)) return "unavailable";
    const loaded = modules.includes("captions");
    if (!enabled) {
      if (!loaded) return "applied";
      if (typeof player.unloadModule === "function") {
        player.unloadModule("captions");
        return "waiting";
      }
      const options = player.getOptions("captions");
      if (options.includes("track") && player.setOption) {
        player.setOption("captions", "track", {});
        return "waiting";
      }
      return "unavailable";
    }
    if (!loaded) {
      if (typeof player.loadModule !== "function") return "unavailable";
      player.loadModule("captions");
      return "waiting";
    }
    const options = player.getOptions("captions");
    if (!options.includes("track") || !player.setOption) return "unavailable";
    if (isTrack(player.getOption("captions", "track"))) return "applied";
    if (!options.includes("tracklist")) return "unavailable";
    const tracks = player.getOption("captions", "tracklist");
    if (!Array.isArray(tracks)) return "waiting";
    const available = tracks.filter(isTrack);
    if (!available.length) return "no-tracks";
    const track =
      available.find((t) => t.languageCode === "ja") ?? available[0];
    player.setOption("captions", "track", track);
    return "waiting";
  } catch {
    return "unavailable";
  }
}
