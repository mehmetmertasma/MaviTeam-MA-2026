import type { ScheduleEvent, Team } from "@/types/teamSync";

import { getDateKeyFromValue, isEventInMonth } from "./schedule-date.utils";

export function sortScheduleEvents(events: ScheduleEvent[]) {
  return [...events].sort((firstEvent, secondEvent) => {
    return new Date(firstEvent.startsAt).getTime() - new Date(secondEvent.startsAt).getTime();
  });
}

export function getEventsForMonth(events: ScheduleEvent[], visibleMonth: Date) {
  return sortScheduleEvents(events).filter((event) => isEventInMonth(event, visibleMonth));
}

export function groupScheduleEventsByDate(events: ScheduleEvent[]) {
  return events.reduce<Record<string, ScheduleEvent[]>>((groups, event) => {
    const dateKey = getDateKeyFromValue(event.startsAt);

    if (dateKey.length === 0) {
      return groups;
    }

    return {
      ...groups,
      [dateKey]: [...(groups[dateKey] ?? []), event],
    };
  }, {});
}

export function getScheduleTeamLabel(event: ScheduleEvent, scheduleData: { teams: Team[] }) {
  if (event.teamId === undefined) {
    return "Tüm Kulüp";
  }

  return scheduleData.teams.find((team) => team.id === event.teamId)?.name ?? "Takım bulunamadı";
}
