import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

import { scheduleRepository } from "../services/schedule.repository";
import type { ScheduleWorkspaceData } from "../types/schedule.types";

const INITIAL_STATUS_MESSAGE = "Program merkezi MaviTeam datasından yüklenecek.";
const SUCCESS_STATUS_MESSAGE = "Program merkezi MaviTeam datasından yüklendi.";
const ERROR_STATUS_MESSAGE = "Program yüklenirken bir sorun oluştu.";

type UseScheduleDataResult = {
  scheduleData: ScheduleWorkspaceData | null;
  isLoading: boolean;
  statusMessage: string;
  loadScheduleData: () => Promise<void>;
  setScheduleData: React.Dispatch<React.SetStateAction<ScheduleWorkspaceData | null>>;
  setStatusMessage: React.Dispatch<React.SetStateAction<string>>;
};

export function useScheduleData(): UseScheduleDataResult {
  const [scheduleData, setScheduleData] = useState<ScheduleWorkspaceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState(INITIAL_STATUS_MESSAGE);

  const loadScheduleData = useCallback(async () => {
    setIsLoading(true);

    try {
      const loadedScheduleData = await scheduleRepository.getScheduleData();
      setScheduleData(loadedScheduleData);
      setStatusMessage(SUCCESS_STATUS_MESSAGE);
    } catch {
      setStatusMessage(ERROR_STATUS_MESSAGE);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadScheduleData();
    }, [loadScheduleData])
  );

  return {
    scheduleData,
    isLoading,
    statusMessage,
    loadScheduleData,
    setScheduleData,
    setStatusMessage,
  };
}
