export type PlaylistItem = {
  ItemId: string;
  PlaylistItemId: string;
};

export type PlayQueueData = {
  IsPlaying: boolean;
  LastUpdate: string;
  PlayingItemIndex: number;
  Playlist: PlaylistItem[];
  Reason: "NewPlaylist" | "SetCurrentItem"; // or use string if more values are expected
  RepeatMode: "RepeatNone"; // or use string if more values are expected
  ShuffleMode: "Sorted"; // or use string if more values are expected
  StartPositionTicks: number;
};

export type GroupData = {
  GroupId: string;
  GroupName: string;
  LastUpdatedAt: string;
  Participants: Participant[];
  State: string; // You can use an enum or union type if there are known possible states
};

export type SyncPlayCommandData = {
  Command: string;
  EmittedAt: string;
  GroupId: string;
  PlaylistItemId: string;
  PositionTicks: number;
  When: string;
};

export type StateUpdateData = {
  Reason: "Pause" | "Unpause";
  State: "Waiting" | "Playing";
};

export type GroupJoinedData = {
  GroupId: string;
  GroupName: string;
  LastUpdatedAt: string;
  Participants: string[];
  State: "Idle";
};

export type Participant = string[];
