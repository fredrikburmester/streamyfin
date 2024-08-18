import { atom } from "jotai";
import { atomWithStorage, createJSONStorage } from "jotai/utils";

type LogLevel = "INFO" | "WARN" | "ERROR";

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
}

const logsAtom = atom([]);

export const writeToLog = async (
  level: LogLevel,
  message: string,
  data?: any
) => {
  const newEntry: LogEntry = {
    timestamp: new Date().toISOString(),
    level: level,
    message: message,
    data: data,
  };

  const logs: LogEntry[] = [];
  logs.push(newEntry);

  const maxLogs = 100;
};

export const readFromLog = async (): Promise<LogEntry[]> => {
  return [];
};

export const clearLogs = async () => {};

export default logsAtom;
