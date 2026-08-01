import { useMemo, useState } from "react";
import { StyleSheet, Text } from "react-native";

import { AppScreenLayout } from "@/components/AppScreenLayout";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { theme } from "@/constants/theme";
import { ALL_CLUB_TEAM_OPTION_ID } from "./constants/schedule.constants";
import { CalendarSection } from "./components/CalendarSection";
import { EventForm } from "./components/EventForm";
import { EventList } from "./components/EventList";
import { useScheduleData } from "./hooks/useScheduleData";
import {
  addMonths,
  buildStartsAt,
  formatMonthTitle,
  getDaysInMonth,
  getMonthStart,
} from "./utils/schedule-date.utils";
import { getEventsForMonth } from "./utils/schedule-selectors.utils";
import { scheduleRepository } from "./services/schedule.repository";
import type { ScheduleEventType } from "@/types/teamSync";
import type { TeamOption } from "./types/schedule.types";

export default function ScheduleScreen() {
  const { scheduleData, loadScheduleData, setScheduleData, setStatusMessage, statusMessage } =
    useScheduleData();
  const [visibleMonth, setVisibleMonth] = useState(() => getMonthStart(new Date()));
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showEventForm, setShowEventForm] = useState(false);
  const [title, setTitle] = useState("");
  const [selectedType, setSelectedType] = useState<ScheduleEventType>("practice");
  const [selectedTeamId, setSelectedTeamId] = useState(ALL_CLUB_TEAM_OPTION_ID);
  const [selectedDayNumber, setSelectedDayNumber] = useState(() => `${new Date().getDate()}`);
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [note, setNote] = useState("");

  const teamOptions = useMemo<TeamOption[]>(() => {
    const allClubOption: TeamOption = {
      id: ALL_CLUB_TEAM_OPTION_ID,
      label: "Tüm Kulüp",
    };

    if (scheduleData === null) {
      return [allClubOption];
    }

    return [
      allClubOption,
      ...scheduleData.teams.map((team) => ({
        id: team.id,
        label: team.name,
        teamId: team.id,
      })),
    ];
  }, [scheduleData]);

  const scheduleEvents = useMemo(() => scheduleData?.scheduleEvents ?? [], [scheduleData]);

  const visibleMonthEvents = useMemo(() => {
    return getEventsForMonth(scheduleEvents, visibleMonth);
  }, [scheduleEvents, visibleMonth]);

  const canCreate =
    title.trim().length > 0 &&
    selectedDayNumber.trim().length > 0 &&
    time.trim().length > 0 &&
    location.trim().length > 0;

  const selectedDay = Number(selectedDayNumber);
  const selectedDateLabel = Number.isInteger(selectedDay)
    ? new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), selectedDay).toLocaleDateString("tr-TR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "Tarih seçilmedi";

  function setMonthAndKeepValidDay(nextMonth: Date) {
    const nextMonthStart = getMonthStart(nextMonth);
    const maxDay = getDaysInMonth(nextMonthStart.getFullYear(), nextMonthStart.getMonth());

    setVisibleMonth(nextMonthStart);
    setSelectedDayNumber((currentDay) => {
      const parsedDay = Number(currentDay);

      if (!Number.isInteger(parsedDay) || parsedDay < 1) {
        return "";
      }

      return `${Math.min(parsedDay, maxDay)}`;
    });
  }

  function clearForm() {
    setTitle("");
    setSelectedType("practice");
    setSelectedTeamId(ALL_CLUB_TEAM_OPTION_ID);
    setTime("");
    setLocation("");
    setNote("");
  }

  function selectCalendarDay(dayNumber: number) {
    setSelectedDayNumber(`${dayNumber}`);

    if (!showEventForm) {
      setShowEventForm(true);
    }

    setStatusMessage(`${dayNumber} ${formatMonthTitle(visibleMonth)} için etkinlik ekleyebilirsin.`);
  }

  async function handleCreateScheduleItem() {
    if (scheduleData === null) {
      setStatusMessage("Önce merkezi data yüklenmeli.");
      return;
    }

    const parsedDayNumber = Number(selectedDayNumber.trim());
    const maxDay = getDaysInMonth(visibleMonth.getFullYear(), visibleMonth.getMonth());

    if (!canCreate) {
      setStatusMessage("Başlık, tarih, saat ve konum boş bırakılamaz.");
      return;
    }

    if (!Number.isInteger(parsedDayNumber) || parsedDayNumber < 1 || parsedDayNumber > maxDay) {
      setStatusMessage("Lütfen takvimden geçerli bir gün seçiniz.");
      return;
    }

    const startsAt = buildStartsAt(
      visibleMonth.getFullYear(),
      visibleMonth.getMonth(),
      parsedDayNumber,
      time
    );

    if (startsAt === null) {
      setStatusMessage("Saat formatı HH:mm şeklinde olmalı. Örn. 18:30");
      return;
    }

    const selectedTeam = teamOptions.find((team) => team.id === selectedTeamId) ?? teamOptions[0];

    try {
      const nextScheduleData = await scheduleRepository.createScheduleEvent({
        clubId: scheduleData.club.id,
        teamId: selectedTeam.teamId,
        title: title.trim(),
        type: selectedType,
        startsAt,
        location: location.trim(),
        note: note.trim() || "Ek not yok.",
        createdByUserId: scheduleData.currentUser.id,
      });

      setScheduleData(nextScheduleData);
      clearForm();
      setShowEventForm(false);
      setStatusMessage("Yeni etkinlik seçili ayın takvimine eklendi.");
    } catch {
      setStatusMessage("Etkinlik oluşturulurken bir sorun oluştu.");
    }
  }

  function openEventForm() {
    setShowEventForm(true);
    setStatusMessage("Takvimden gün seçip etkinlik bilgilerini doldurabilirsin.");
  }

  function closeEventForm() {
    clearForm();
    setShowEventForm(false);
    setStatusMessage("Etkinlik ekleme iptal edildi.");
  }

  function goToToday() {
    const today = new Date();
    setVisibleMonth(getMonthStart(today));
    setSelectedDayNumber(`${today.getDate()}`);
    setStatusMessage("Bugünün olduğu aya dönüldü.");
  }

  return (
    <AppScreenLayout variant="wide">
      <PageHeader title="Program" subtitle="Antrenman, maç ve toplantıları merkezi data üzerinden yönet." />

      <Card variant="elevated" style={styles.heroCard}>
        <StatusBadge label="Takvim yönetimi" tone="info" style={styles.heroLabel} />
        <Text style={styles.heroTitle}>Aylık program görünümü</Text>
        <Text style={styles.heroSubtitle}>
          Aylar arasında geçiş yap, istediğin ayı seç ve etkinliği doğrudan seçili tarihe kaydet.
        </Text>
      </Card>

      <CalendarSection
        visibleMonth={visibleMonth}
        visibleMonthEvents={visibleMonthEvents}
        selectedDayNumber={selectedDayNumber}
        showMonthPicker={showMonthPicker}
        showEventForm={showEventForm}
        statusMessage={statusMessage}
        onToggleMonthPicker={() => setShowMonthPicker((currentValue) => !currentValue)}
        onPrevMonth={() => setMonthAndKeepValidDay(addMonths(visibleMonth, -1))}
        onNextMonth={() => setMonthAndKeepValidDay(addMonths(visibleMonth, 1))}
        onPrevYear={() => setMonthAndKeepValidDay(addMonths(visibleMonth, -12))}
        onNextYear={() => setMonthAndKeepValidDay(addMonths(visibleMonth, 12))}
        onSelectMonth={(monthIndex) => {
          setMonthAndKeepValidDay(new Date(visibleMonth.getFullYear(), monthIndex, 1));
          setShowMonthPicker(false);
        }}
        onGoToday={goToToday}
        onSelectDay={selectCalendarDay}
        onOpenEventForm={openEventForm}
        onRefresh={loadScheduleData}
      />

      {showEventForm ? (
        <EventForm
          selectedDateLabel={selectedDateLabel}
          title={title}
          onChangeTitle={setTitle}
          selectedType={selectedType}
          onSelectType={setSelectedType}
          teamOptions={teamOptions}
          selectedTeamId={selectedTeamId}
          onSelectTeam={setSelectedTeamId}
          time={time}
          onChangeTime={setTime}
          location={location}
          onChangeLocation={setLocation}
          note={note}
          onChangeNote={setNote}
          canCreate={canCreate}
          onSave={handleCreateScheduleItem}
          onCancel={closeEventForm}
        />
      ) : null}

      <EventList
        visibleMonth={visibleMonth}
        visibleMonthEvents={visibleMonthEvents}
        scheduleData={scheduleData}
      />
    </AppScreenLayout>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    marginBottom: theme.spacing["2xl"],
  },
  heroLabel: {
    alignSelf: "flex-start",
    marginBottom: theme.spacing.lg,
  },
  heroTitle: {
    fontSize: theme.fontSizes["4xl"],
    fontWeight: theme.fontWeights.bold,
    color: theme.colors.text.primary,
    lineHeight: theme.lineHeights["4xl"],
    marginBottom: theme.spacing.md,
  },
  heroSubtitle: {
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.regular,
    color: theme.colors.text.secondary,
    lineHeight: theme.lineHeights.xl,
  },
});
