import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

import { scheduleRepository } from "../services/schedule.repository";
import type { ScheduleWorkspaceData } from "../types/schedule.types";

const INITIAL_STATUS_MESSAGE = "Program merkezi MaviTeam datasından yüklenecek.";
const SUCCESS_STATUS_MESSAGE = "Program merkezi MaviTeam datasından yüklendi.";
const ERROR_STATUS_MESSAGE = "Program yüklenirken bir sorun oluştu.";

// Lets the status line at the bottom of CalendarSection look like a
// confirmation (green), a problem (red), or a neutral instruction (gray)
// instead of always rendering as the same plain gray sentence -- otherwise
// "Event updated." and "Pick a day and fill in the details." are visually
// indistinguishable, and a completed save doesn't look like anything happened.
export type ScheduleStatusTone = "neutral" | "success" | "danger";

type UseScheduleDataResult = {
  scheduleData: ScheduleWorkspaceData | null;
  isLoading: boolean;
  statusMessage: string;
  statusTone: ScheduleStatusTone;
  loadScheduleData: () => Promise<void>;
  setScheduleData: React.Dispatch<React.SetStateAction<ScheduleWorkspaceData | null>>;
  setStatus: (message: string, tone?: ScheduleStatusTone) => void;
};

export function useScheduleData(): UseScheduleDataResult {
  const [scheduleData, setScheduleData] = useState<ScheduleWorkspaceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState(INITIAL_STATUS_MESSAGE);
  const [statusTone, setStatusTone] = useState<ScheduleStatusTone>("neutral");

  const setStatus = useCallback((message: string, tone: ScheduleStatusTone = "neutral") => {
    setStatusMessage(message);
    setStatusTone(tone);
  }, []);

  const loadScheduleData = useCallback(async () => {
    setIsLoading(true);

    try {
      const loadedScheduleData = await scheduleRepository.getScheduleData();
      setScheduleData(loadedScheduleData);
      setStatus(SUCCESS_STATUS_MESSAGE, "success");
    } catch {
      setStatus(ERROR_STATUS_MESSAGE, "danger");
    } finally {
      setIsLoading(false);
    }
  }, [setStatus]);

  useFocusEffect(
    useCallback(() => {
      void loadScheduleData();
    }, [loadScheduleData])
  );

  return {
    scheduleData,
    isLoading,
    statusMessage,
    statusTone,
    loadScheduleData,
    setScheduleData,
    setStatus,
  };
}
