import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

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
    <ScrollView style={styles.scroll} contentContainerStyle={styles.screen}>
      <View style={styles.container}>
        <View style={styles.pageHeader}>
          <Text style={styles.logo}>MaviTeam</Text>
          <Text style={styles.pageTitle}>Program</Text>
          <Text style={styles.pageSubtitle}>
            Antrenman, maç ve toplantıları merkezi data üzerinden yönet.
          </Text>
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>Takvim yönetimi</Text>
          <Text style={styles.heroTitle}>Aylık program görünümü</Text>
          <Text style={styles.heroSubtitle}>
            Aylar arasında geçiş yap, istediğin ayı seç ve etkinliği doğrudan seçili tarihe kaydet.
          </Text>
        </View>

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
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: theme.colors.background.app },
  screen: {
    flexGrow: 1,
    backgroundColor: theme.colors.background.app,
    paddingHorizontal: theme.spacing["2xl"],
    paddingBottom: theme.spacing["2xl"],
  },
  container: { width: "100%", maxWidth: 1100, alignSelf: "center" },
  pageHeader: { marginBottom: theme.spacing["2xl"] },
  logo: {
    color: theme.colors.brand.primary,
    fontSize: theme.fontSizes["2xl"],
    fontWeight: theme.fontWeights.black,
    marginBottom: theme.spacing.md,
  },
  pageTitle: {
    color: theme.colors.text.inverse,
    fontSize: theme.fontSizes["5xl"],
    fontWeight: theme.fontWeights.black,
    lineHeight: theme.lineHeights["5xl"],
    marginBottom: theme.spacing.sm,
  },
  pageSubtitle: {
    color: theme.colors.text.inverse,
    opacity: 0.76,
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.semibold,
    lineHeight: theme.lineHeights.xl,
  },
  heroCard: {
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.radius["2xl"],
    padding: theme.spacing["3xl"],
    marginBottom: theme.spacing["2xl"],
    ...theme.shadows.md,
  },
  heroLabel: {
    alignSelf: "flex-start",
    backgroundColor: theme.colors.brand.primarySoft,
    color: theme.colors.text.brand,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.extrabold,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.full,
    marginBottom: theme.spacing.lg,
  },
  heroTitle: {
    fontSize: theme.fontSizes["4xl"],
    fontWeight: theme.fontWeights.black,
    color: theme.colors.text.primary,
    lineHeight: theme.lineHeights["4xl"],
    marginBottom: theme.spacing.md,
  },
  heroSubtitle: {
    fontSize: theme.fontSizes.lg,
    color: theme.colors.text.secondary,
    lineHeight: theme.lineHeights.xl,
  },
});
