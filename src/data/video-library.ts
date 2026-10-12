import inventory from "./registered-videos.json";
import type { VideoRecord } from "../domain/types";

interface Inventory {
  fetchedAt: string;
  videos: VideoRecord[];
  units: { id: string; videoIds: string[]; fetchedAt: string }[];
  failures: { id: string; reason: string }[];
}
export const registeredInventory = inventory as Inventory;
export const registeredVideos = registeredInventory.videos;
const records = new Map(registeredVideos.map((video) => [video.id, video]));
export function unitVideos(unitId: string): VideoRecord[] {
  const unit = registeredInventory.units.find((u) => u.id === unitId);
  return (unit?.videoIds ?? []).flatMap((id) => {
    const video = records.get(id);
    return video ? [video] : [];
  });
}
