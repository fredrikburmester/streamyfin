import AsyncStorage from "@react-native-async-storage/async-storage";
import { atomWithStorage, createJSONStorage } from "jotai/utils";

type LogLevel = "INFO" | "WARN" | "ERROR";

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
}

const asyncStorage = createJSONStorage(() => AsyncStorage);
const logsAtom = atomWithStorage("logs", [], asyncStorage);

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

  const currentLogs = await AsyncStorage.getItem("logs");
  const logs: LogEntry[] = currentLogs ? JSON.parse(currentLogs) : [];
  logs.push(newEntry);

  const maxLogs = 100;
  const recentLogs = logs.slice(Math.max(logs.length - maxLogs, 0));

  await AsyncStorage.setItem("logs", JSON.stringify(recentLogs));
};

export const readFromLog = async (): Promise<LogEntry[]> => {
  const logs = await AsyncStorage.getItem("logs");
  return logs ? JSON.parse(logs) : [];
};

export const clearLogs = async () => {
  await AsyncStorage.removeItem("logs");
};

export default logsAtom;
