import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

import { useTranslation } from "@/localization";
import { scheduleRepository } from "../services/schedule.repository";
import type { ScheduleWorkspaceData } from "../types/schedule.types";

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
  const { language } = useTranslation();
  const isEn = language === "en";

  const initialStatus = isEn
    ? "Schedule will be loaded from MaviTeam data."
    : "Program merkezi MaviTeam datasından yüklenecek.";
  const successStatus = isEn
    ? "Schedule loaded from MaviTeam data."
    : "Program merkezi MaviTeam datasından yüklendi.";
  const errorStatus = isEn
    ? "There was a problem loading the schedule."
    : "Program yüklenirken bir sorun oluştu.";

  const [scheduleData, setScheduleData] = useState<ScheduleWorkspaceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [customStatusMessage, setCustomStatusMessage] = useState<string | null>(null);
  const statusMessage = customStatusMessage ?? initialStatus;
  const [statusTone, setStatusTone] = useState<ScheduleStatusTone>("neutral");

  const setStatus = useCallback((message: string, tone: ScheduleStatusTone = "neutral") => {
    setCustomStatusMessage(message);
    setStatusTone(tone);
  }, []);

  const loadScheduleData = useCallback(async () => {
    setIsLoading(true);

    try {
      const loadedScheduleData = await scheduleRepository.getScheduleData();
      setScheduleData(loadedScheduleData);
      setStatus(successStatus, "success");
    } catch {
      setStatus(errorStatus, "danger");
    } finally {
      setIsLoading(false);
    }
  }, [errorStatus, setStatus, successStatus]);

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
