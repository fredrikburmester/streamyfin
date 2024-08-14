import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";
import { atom, useAtom } from "jotai";
import { useEffect } from "react";

export interface Job {
  id: string;
  item: BaseItemDto;
  execute: () => void | Promise<void>;
}

export const queueAtom = atom<Job[]>([]);
export const isProcessingAtom = atom(false);

export const queueActions = {
  enqueue: (queue: Job[], setQueue: (update: Job[]) => void, job: Job) => {
    const updatedQueue = [...queue, job];
    console.info("Enqueueing job", job, updatedQueue);
    setQueue(updatedQueue);
  },
  processJob: async (
    queue: Job[],
    setQueue: (update: Job[]) => void,
    setProcessing: (processing: boolean) => void,
  ) => {
    const [job, ...rest] = queue;
    setQueue(rest);

    console.info("Processing job", job);

    setProcessing(true);
    await job.execute();
    console.info("Job done", job);
    setProcessing(false);
  },
  clear: (
    setQueue: (update: Job[]) => void,
    setProcessing: (processing: boolean) => void,
  ) => {
    setQueue([]);
    setProcessing(false);
  },
};

export const useJobProcessor = () => {
  const [queue, setQueue] = useAtom(queueAtom);
  const [isProcessing, setProcessing] = useAtom(isProcessingAtom);

  useEffect(() => {
    console.info("Queue changed", queue, isProcessing);
    if (queue.length > 0 && !isProcessing) {
      console.info("Processing queue", queue);
      queueActions.processJob(queue, setQueue, setProcessing);
    }
  }, [queue, isProcessing, setQueue, setProcessing]);
};
