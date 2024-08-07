import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";
import { atom } from "jotai";

export type ProcessItem = {
  item: BaseItemDto;
  progress: number;
  speed?: number;
  startTime?: Date;
};

export const runningProcesses = atom<ProcessItem | null>(null);
