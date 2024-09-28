import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { atom, useAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { useEffect } from "react";

export interface Job {
  id: string;
  item: BaseItemDto;
  execute: () => void | Promise<void>;
}

export const runningAtom = atomWithStorage<boolean>("queueRunning", false, {
  getItem: async (key) => {
    const value = await AsyncStorage.getItem(key);
    return value ? JSON.parse(value) : false;
  },
  setItem: async (key, value) => {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  },
  removeItem: async (key) => {
    await AsyncStorage.removeItem(key);
  },
});

export const queueAtom = atomWithStorage<Job[]>("queueJobs", [], {
  getItem: async (key) => {
    const value = await AsyncStorage.getItem(key);
    return value ? JSON.parse(value) : [];
  },
  setItem: async (key, value) => {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  },
  removeItem: async (key) => {
    await AsyncStorage.removeItem(key);
  },
});

export const queueActions = {
  enqueue: (queue: Job[], setQueue: (update: Job[]) => void, job: Job) => {
    const updatedQueue = [...queue, job];
    console.info("Enqueueing job", job, updatedQueue);
    setQueue(updatedQueue);
  },
  processJob: async (
    queue: Job[],
    setQueue: (update: Job[]) => void,
    setProcessing: (processing: boolean) => void
  ) => {
    const [job, ...rest] = queue;
    setQueue(rest);

    console.info("Processing job", job);

    setProcessing(true);

    // Excute the function assiociated with the job.
    await job.execute();

    console.info("Job done", job);

    setProcessing(false);
  },
  clear: (
    setQueue: (update: Job[]) => void,
    setProcessing: (processing: boolean) => void
  ) => {
    setQueue([]);
    setProcessing(false);
  },
};

export const useJobProcessor = () => {
  const [queue, setQueue] = useAtom(queueAtom);
  const [running, setRunning] = useAtom(runningAtom);

  useEffect(() => {
    if (queue.length > 0 && !running) {
      console.info("Processing queue", queue);
      queueActions.processJob(queue, setQueue, setRunning);
    }
  }, [queue, running, setQueue, setRunning]);
};
