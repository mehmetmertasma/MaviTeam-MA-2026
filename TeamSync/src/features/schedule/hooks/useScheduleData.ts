import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

import { teamSyncService } from "@/services/teamSyncService";
import type { TeamSyncAppData } from "@/types/teamSync";

const INITIAL_STATUS_MESSAGE = "Program merkezi MaviTeam datasından yüklenecek.";
const SUCCESS_STATUS_MESSAGE = "Program merkezi MaviTeam datasından yüklendi.";
const ERROR_STATUS_MESSAGE = "Program yüklenirken bir sorun oluştu.";

type UseScheduleDataResult = {
  appData: TeamSyncAppData | null;
  isLoading: boolean;
  statusMessage: string;
  loadScheduleData: () => Promise<void>;
  setAppData: React.Dispatch<React.SetStateAction<TeamSyncAppData | null>>;
  setStatusMessage: React.Dispatch<React.SetStateAction<string>>;
};

export function useScheduleData(): UseScheduleDataResult {
  const [appData, setAppData] = useState<TeamSyncAppData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState(INITIAL_STATUS_MESSAGE);

  const loadScheduleData = useCallback(async () => {
    setIsLoading(true);

    try {
      const loadedAppData = await teamSyncService.getAppData();
      setAppData(loadedAppData);
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
    appData,
    isLoading,
    statusMessage,
    loadScheduleData,
    setAppData,
    setStatusMessage,
  };
}
