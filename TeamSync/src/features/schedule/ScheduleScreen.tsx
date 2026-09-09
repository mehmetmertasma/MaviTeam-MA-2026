import { useMemo, useState } from "react";
import { StyleSheet, Text } from "react-native";

import { AppScreenLayout } from "@/components/AppScreenLayout";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { theme } from "@/constants/theme";
import { useTranslation } from "@/localization";
import { ALL_CLUB_TEAM_OPTION_ID } from "./constants/schedule.constants";
import { CalendarSection } from "./components/CalendarSection";
import { EventDetailsBubble } from "./components/EventDetailsBubble";
import { EventForm } from "./components/EventForm";
import { EventList } from "./components/EventList";
import { useScheduleData } from "./hooks/useScheduleData";
import {
  addMonths,
  buildStartsAt,
  formatEventTime,
  formatMonthTitle,
  getDateFromValue,
  getDaysInMonth,
  getMonthStart,
} from "./utils/schedule-date.utils";
import { getEventsForMonth } from "./utils/schedule-selectors.utils";
import { scheduleRepository } from "./services/schedule.repository";
import type { ScheduleEvent, ScheduleEventType } from "@/types/teamSync";
import type { TeamOption } from "./types/schedule.types";

function getCopy(language: "tr" | "en") {
  const en = language === "en";
  return {
    pageTitle: en ? "Schedule" : "Program",
    pageSubtitle: en
      ? "Manage practices, matches, and meetings from the central data."
      : "Antrenman, maç ve toplantıları merkezi data üzerinden yönet.",
    heroLabel: en ? "Calendar management" : "Takvim yönetimi",
    heroTitle: en ? "Monthly schedule view" : "Aylık program görünümü",
    heroSubtitle: en
      ? "Switch between months, pick the one you want, and save the event straight to the selected date."
      : "Aylar arasında geçiş yap, istediğin ayı seç ve etkinliği doğrudan seçili tarihe kaydet.",
    allClub: en ? "Whole club" : "Tüm Kulüp",
    noDateSelected: en ? "No date selected" : "Tarih seçilmedi",
    statusSelectDay: (dayNumber: number, monthTitle: string) =>
      en ? `You can add an event for ${monthTitle} ${dayNumber}.` : `${dayNumber} ${monthTitle} için etkinlik ekleyebilirsin.`,
    statusDataNotLoaded: en ? "Central data must be loaded first." : "Önce merkezi data yüklenmeli.",
    statusMissingFields: en
      ? "Title, date, time, and location cannot be empty."
      : "Başlık, tarih, saat ve konum boş bırakılamaz.",
    statusInvalidDay: en ? "Please select a valid day on the calendar." : "Lütfen takvimden geçerli bir gün seçiniz.",
    statusInvalidTime: en
      ? "Time must be in HH:mm format. E.g. 18:30"
      : "Saat formatı HH:mm şeklinde olmalı. Örn. 18:30",
    statusUpdated: en ? "Event updated." : "Etkinlik güncellendi.",
    statusCreated: en ? "New event added to the selected month's calendar." : "Yeni etkinlik seçili ayın takvimine eklendi.",
    statusUpdateFailed: en ? "There was a problem updating the event." : "Etkinlik güncellenirken bir sorun oluştu.",
    statusCreateFailed: en ? "There was a problem creating the event." : "Etkinlik oluşturulurken bir sorun oluştu.",
    statusEditReady: en
      ? "You can edit the event details and save."
      : "Etkinlik bilgilerini düzenleyip kaydedebilirsin.",
    statusDeleted: en ? "Event deleted." : "Etkinlik silindi.",
    statusDeleteFailed: en ? "There was a problem deleting the event." : "Etkinlik silinirken bir sorun oluştu.",
    statusFormReady: en
      ? "Pick a day on the calendar and fill in the event details."
      : "Takvimden gün seçip etkinlik bilgilerini doldurabilirsin.",
    statusFormCancelled: en ? "Adding the event was cancelled." : "Etkinlik ekleme iptal edildi.",
    statusBackToToday: en ? "Returned to the month containing today." : "Bugünün olduğu aya dönüldü.",
  };
}

export default function ScheduleScreen() {
  const { language } = useTranslation();
  const copy = useMemo(() => getCopy(language), [language]);
  const locale = language === "tr" ? "tr-TR" : "en-US";
  const { scheduleData, loadScheduleData, setScheduleData, setStatus, statusMessage, statusTone } =
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
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [selectedEventForDetails, setSelectedEventForDetails] = useState<ScheduleEvent | null>(null);
  const [isSavingEvent, setIsSavingEvent] = useState(false);

  const teamOptions = useMemo<TeamOption[]>(() => {
    const allClubOption: TeamOption = {
      id: ALL_CLUB_TEAM_OPTION_ID,
      label: copy.allClub,
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
  }, [scheduleData, copy.allClub]);

  const scheduleEvents = useMemo(() => scheduleData?.scheduleEvents ?? [], [scheduleData]);

  const visibleMonthEvents = useMemo(() => {
    return getEventsForMonth(scheduleEvents, visibleMonth);
  }, [scheduleEvents, visibleMonth]);

  const canManageSchedule =
    scheduleData !== null
    && (scheduleData.currentUser.role === "clubAdmin" || scheduleData.currentUser.role === "coach");

  const canCreate =
    canManageSchedule &&
    title.trim().length > 0 &&
    selectedDayNumber.trim().length > 0 &&
    time.trim().length > 0 &&
    location.trim().length > 0;

  const selectedDay = Number(selectedDayNumber);
  const selectedDateLabel = Number.isInteger(selectedDay)
    ? new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), selectedDay).toLocaleDateString(locale, {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : copy.noDateSelected;

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
    setEditingEventId(null);
  }

  function selectCalendarDay(dayNumber: number) {
    setSelectedDayNumber(`${dayNumber}`);

    if (!canManageSchedule) {
      return;
    }

    if (!showEventForm) {
      setShowEventForm(true);
    }

    setStatus(copy.statusSelectDay(dayNumber, formatMonthTitle(visibleMonth, language)));
  }

  async function handleSaveScheduleItem() {
    if (scheduleData === null) {
      setStatus(copy.statusDataNotLoaded, "danger");
      return;
    }

    const parsedDayNumber = Number(selectedDayNumber.trim());
    const maxDay = getDaysInMonth(visibleMonth.getFullYear(), visibleMonth.getMonth());

    if (!canCreate) {
      setStatus(copy.statusMissingFields, "danger");
      return;
    }

    if (!Number.isInteger(parsedDayNumber) || parsedDayNumber < 1 || parsedDayNumber > maxDay) {
      setStatus(copy.statusInvalidDay, "danger");
      return;
    }

    const startsAt = buildStartsAt(
      visibleMonth.getFullYear(),
      visibleMonth.getMonth(),
      parsedDayNumber,
      time
    );

    if (startsAt === null) {
      setStatus(copy.statusInvalidTime, "danger");
      return;
    }

    const selectedTeam = teamOptions.find((team) => team.id === selectedTeamId) ?? teamOptions[0];

    try {
      setIsSavingEvent(true);

      if (editingEventId !== null) {
        const nextScheduleData = await scheduleRepository.updateScheduleEvent(editingEventId, {
          teamId: selectedTeam.teamId,
          title: title.trim(),
          type: selectedType,
          startsAt,
          location: location.trim(),
          note: note.trim(),
        });

        setScheduleData(nextScheduleData);
        clearForm();
        setShowEventForm(false);
        setStatus(copy.statusUpdated, "success");
        return;
      }

      const nextScheduleData = await scheduleRepository.createScheduleEvent({
        clubId: scheduleData.club.id,
        teamId: selectedTeam.teamId,
        title: title.trim(),
        type: selectedType,
        startsAt,
        location: location.trim(),
        note: note.trim(),
        createdByUserId: scheduleData.currentUser.id,
      });

      setScheduleData(nextScheduleData);
      clearForm();
      setShowEventForm(false);
      setStatus(copy.statusCreated, "success");
    } catch {
      setStatus(editingEventId !== null ? copy.statusUpdateFailed : copy.statusCreateFailed, "danger");
    } finally {
      setIsSavingEvent(false);
    }
  }

  function openEditForm(event: ScheduleEvent) {
    if (!canManageSchedule) {
      return;
    }

    const eventDate = getDateFromValue(event.startsAt);

    if (eventDate !== null) {
      setVisibleMonth(getMonthStart(eventDate));
      setSelectedDayNumber(`${eventDate.getDate()}`);
    }

    setTitle(event.title);
    setSelectedType(event.type);
    setSelectedTeamId(event.teamId ?? ALL_CLUB_TEAM_OPTION_ID);
    setTime(eventDate === null ? "" : formatEventTime(event.startsAt, language));
    setLocation(event.location);
    setNote(event.note ?? "");
    setEditingEventId(event.id);
    setShowEventForm(true);
    setSelectedEventForDetails(null);
    setStatus(copy.statusEditReady);
  }

  async function handleDeleteEvent(event: ScheduleEvent) {
    try {
      const nextScheduleData = await scheduleRepository.removeScheduleEvent(event.id);
      setScheduleData(nextScheduleData);
      setSelectedEventForDetails(null);
      setStatus(copy.statusDeleted, "success");
    } catch {
      setStatus(copy.statusDeleteFailed, "danger");
    }
  }

  function openEventForm() {
    if (!canManageSchedule) {
      return;
    }

    setShowEventForm(true);
    setStatus(copy.statusFormReady);
  }

  function closeEventForm() {
    clearForm();
    setShowEventForm(false);
    setStatus(copy.statusFormCancelled);
  }

  function goToToday() {
    const today = new Date();
    setVisibleMonth(getMonthStart(today));
    setSelectedDayNumber(`${today.getDate()}`);
    setStatus(copy.statusBackToToday);
  }

  return (
    <AppScreenLayout variant="wide">
      <PageHeader title={copy.pageTitle} subtitle={copy.pageSubtitle} />

      <Card variant="elevated" style={styles.heroCard}>
        <StatusBadge label={copy.heroLabel} tone="info" style={styles.heroLabel} />
        <Text style={styles.heroTitle}>{copy.heroTitle}</Text>
        <Text style={styles.heroSubtitle}>{copy.heroSubtitle}</Text>
      </Card>

      <CalendarSection
        language={language}
        visibleMonth={visibleMonth}
        visibleMonthEvents={visibleMonthEvents}
        selectedDayNumber={selectedDayNumber}
        showMonthPicker={showMonthPicker}
        showEventForm={showEventForm}
        statusMessage={statusMessage}
        statusTone={statusTone}
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
        onSelectEvent={setSelectedEventForDetails}
        onOpenEventForm={openEventForm}
        onRefresh={loadScheduleData}
        canManageEvents={canManageSchedule}
      />

      {selectedEventForDetails !== null && scheduleData !== null ? (
        <EventDetailsBubble
          key={selectedEventForDetails.id}
          event={selectedEventForDetails}
          scheduleData={scheduleData}
          canManage={canManageSchedule}
          onEdit={openEditForm}
          onDelete={handleDeleteEvent}
          onClose={() => setSelectedEventForDetails(null)}
          language={language}
        />
      ) : null}

      {showEventForm && canManageSchedule ? (
        <EventForm
          language={language}
          isEditing={editingEventId !== null}
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
          isSaving={isSavingEvent}
          onSave={handleSaveScheduleItem}
          onCancel={closeEventForm}
        />
      ) : null}

      <EventList
        visibleMonth={visibleMonth}
        visibleMonthEvents={visibleMonthEvents}
        scheduleData={scheduleData}
        onSelectEvent={setSelectedEventForDetails}
        language={language}
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
