import { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { AppButton } from "@/components/AppButton";
import { theme } from "@/constants/theme";

type AvailabilityStatus = "available" | "notAvailable" | "notAnswered";
type AvailabilityView = "coachAdmin" | "athleteParent";

type EventOption = {
  id: number;
  title: string;
  date: string;
  teamName: string;
  location: string;
};

type AthleteAvailability = {
  id: number;
  athleteName: string;
  parentName: string;
  teamName: string;
  status: AvailabilityStatus;
  note: string;
};

const events: EventOption[] = [
  {
    id: 1,
    title: "U17 Erkek antrenmanı",
    date: "Bugün 18:30",
    teamName: "U17 Erkek",
    location: "Ana Spor Salonu",
  },
  {
    id: 2,
    title: "U17 hazırlık maçı",
    date: "Yarın 20:00",
    teamName: "U17 Erkek",
    location: "Kadıköy Spor Kompleksi",
  },
  {
    id: 3,
    title: "A Takım antrenmanı",
    date: "Cuma 19:00",
    teamName: "A Takım",
    location: "Kulüp Salonu",
  },
];

const initialAvailability: AthleteAvailability[] = [
  {
    id: 1,
    athleteName: "Mert Asma",
    parentName: "Ayşe Asma",
    teamName: "U17 Erkek",
    status: "available",
    note: "Geliyorum.",
  },
  {
    id: 2,
    athleteName: "Efe Yılmaz",
    parentName: "Mehmet Yılmaz",
    teamName: "U17 Erkek",
    status: "notAvailable",
    note: "Okul programı var.",
  },
  {
    id: 3,
    athleteName: "Deniz Kaya",
    parentName: "Selin Kaya",
    teamName: "U17 Erkek",
    status: "notAnswered",
    note: "",
  },
];

function getStatusLabel(status: AvailabilityStatus) {
  if (status === "available") {
    return "Uygun";
  }

  if (status === "notAvailable") {
    return "Uygun değil";
  }

  return "Cevap yok";
}

function getCurrentSaveLabel() {
  const time = new Date().toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return `Şimdi · ${time}`;
}

export default function AvailabilityScreen() {
  const [activeView, setActiveView] = useState<AvailabilityView>("athleteParent");
  const [selectedEventId, setSelectedEventId] = useState(events[0].id);
  const [availabilityList, setAvailabilityList] =
    useState<AthleteAvailability[]>(initialAvailability);
  const [myNote, setMyNote] = useState("Geliyorum.");
  const [statusMessage, setStatusMessage] = useState(
    "Uygunluk cevapları şimdilik bu oturum içinde tutuluyor."
  );
  const [lastSavedAt, setLastSavedAt] = useState("Henüz kaydedilmedi");

  const selectedEvent = events.find((event) => event.id === selectedEventId) ?? events[0];

  const availabilitySummary = useMemo(() => {
    const availableCount = availabilityList.filter(
      (athlete) => athlete.status === "available"
    ).length;

    const notAvailableCount = availabilityList.filter(
      (athlete) => athlete.status === "notAvailable"
    ).length;

    const notAnsweredCount = availabilityList.filter(
      (athlete) => athlete.status === "notAnswered"
    ).length;

    const totalCount = availabilityList.length;
    const responseRate =
      totalCount > 0
        ? Math.round(((availableCount + notAvailableCount) / totalCount) * 100)
        : 0;

    return {
      availableCount,
      notAvailableCount,
      notAnsweredCount,
      totalCount,
      responseRate,
    };
  }, [availabilityList]);

  const myAvailability = availabilityList.find(
    (athlete) => athlete.athleteName === "Mert Asma"
  );

  function updateMyStatus(newStatus: AvailabilityStatus) {
    setAvailabilityList((currentList) =>
      currentList.map((athlete) => {
        if (athlete.athleteName !== "Mert Asma") {
          return athlete;
        }

        return {
          ...athlete,
          status: newStatus,
          note: myNote.trim(),
        };
      })
    );

    setLastSavedAt(getCurrentSaveLabel());
    setStatusMessage("Uygunluk durumun kaydedildi.");
  }

  function saveMyNote() {
    setAvailabilityList((currentList) =>
      currentList.map((athlete) => {
        if (athlete.athleteName !== "Mert Asma") {
          return athlete;
        }

        return {
          ...athlete,
          note: myNote.trim(),
        };
      })
    );

    setLastSavedAt(getCurrentSaveLabel());
    setStatusMessage("Not kaydedildi.");
  }

  function resetAvailability() {
    setAvailabilityList(initialAvailability);
    setMyNote("Geliyorum.");
    setLastSavedAt("Henüz kaydedilmedi");
    setStatusMessage("Uygunluk demo haline sıfırlandı.");
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.screen}>
      <View style={styles.container}>
        <View style={styles.pageHeader}>
          <Text style={styles.logo}>TeamSync</Text>
          <Text style={styles.pageTitle}>Uygunluk</Text>
          <Text style={styles.pageSubtitle}>
            Sporcu ve veliler etkinlik için gelip gelemeyeceğini bildirir.
          </Text>
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>Katılım planlama</Text>
          <Text style={styles.heroTitle}>Kim geliyor, kim gelemiyor?</Text>
          <Text style={styles.heroSubtitle}>
            Maç ve antrenman öncesi koçun kadro planlamasını kolaylaştırır.
          </Text>
        </View>

        <View style={styles.viewSwitcher}>
          <Pressable
            onPress={() => setActiveView("athleteParent")}
            style={({ pressed }) => [
              styles.viewButton,
              activeView === "athleteParent" ? styles.viewButtonActive : null,
              pressed ? styles.pressed : null,
            ]}
          >
            <Text
              style={[
                styles.viewButtonText,
                activeView === "athleteParent" ? styles.viewButtonTextActive : null,
              ]}
            >
              Sporcu / Veli
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveView("coachAdmin")}
            style={({ pressed }) => [
              styles.viewButton,
              activeView === "coachAdmin" ? styles.viewButtonActive : null,
              pressed ? styles.pressed : null,
            ]}
          >
            <Text
              style={[
                styles.viewButtonText,
                activeView === "coachAdmin" ? styles.viewButtonTextActive : null,
              ]}
            >
              Koç / Admin
            </Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeaderText}>
              <Text style={styles.sectionTitle}>Etkinlik seç</Text>
              <Text style={styles.sectionSubtitle}>
                Demo için etkinliği buradan seçiyoruz. Gerçek sistemde takvimden gelecek.
              </Text>
            </View>

            <Text style={styles.statusPill}>{events.length} etkinlik</Text>
          </View>

          <View style={styles.eventList}>
            {events.map((event) => {
              const isSelected = selectedEventId === event.id;

              return (
                <Pressable
                  key={event.id}
                  onPress={() => setSelectedEventId(event.id)}
                  style={({ pressed }) => [
                    styles.eventCard,
                    isSelected ? styles.eventCardActive : null,
                    pressed ? styles.pressed : null,
                  ]}
                >
                  <Text
                    style={[
                      styles.eventTitle,
                      isSelected ? styles.eventTitleActive : null,
                    ]}
                  >
                    {event.title}
                  </Text>

                  <Text
                    style={[
                      styles.eventMeta,
                      isSelected ? styles.eventMetaActive : null,
                    ]}
                  >
                    {event.teamName} · {event.date} · {event.location}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {activeView === "athleteParent" ? (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionHeaderText}>
                <Text style={styles.sectionTitle}>Benim durumum</Text>
                <Text style={styles.sectionSubtitle}>
                  {selectedEvent.title} için uygunluk durumunu seç.
                </Text>
              </View>

              <Text style={styles.statusPill}>
                {getStatusLabel(myAvailability?.status ?? "notAnswered")}
              </Text>
            </View>

            <View style={styles.myStatusCard}>
              <Text style={styles.myName}>Mert Asma</Text>
              <Text style={styles.myTeam}>U17 Erkek · Son kayıt: {lastSavedAt}</Text>
            </View>

            <Text style={styles.label}>Not</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Örn: Geliyorum / Geç kalabilirim / Gelemiyorum"
              placeholderTextColor={theme.colors.text.muted}
              value={myNote}
              onChangeText={setMyNote}
              multiline
            />

            <View style={styles.actionRow}>
              <AppButton
                title="Uygunum"
                onPress={() => updateMyStatus("available")}
                style={styles.actionButton}
              />

              <AppButton
                title="Uygun değilim"
                variant="secondary"
                onPress={() => updateMyStatus("notAvailable")}
                style={styles.actionButton}
              />

              <AppButton
                title="Notu kaydet"
                variant="ghost"
                onPress={saveMyNote}
                style={styles.actionButton}
              />
            </View>

            <Text style={styles.statusText}>{statusMessage}</Text>
          </View>
        ) : null}

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{availabilitySummary.availableCount}</Text>
            <Text style={styles.statLabel}>Uygun</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>{availabilitySummary.notAvailableCount}</Text>
            <Text style={styles.statLabel}>Uygun değil</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>{availabilitySummary.notAnsweredCount}</Text>
            <Text style={styles.statLabel}>Cevap yok</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>%{availabilitySummary.responseRate}</Text>
            <Text style={styles.statLabel}>Cevap oranı</Text>
          </View>
        </View>

        {activeView === "coachAdmin" ? (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionHeaderText}>
                <Text style={styles.sectionTitle}>Takım uygunluk listesi</Text>
                <Text style={styles.sectionSubtitle}>
                  Koç ve admin, seçilen etkinlik için oyuncuların durumunu görür.
                </Text>
              </View>

              <Text style={styles.statusPill}>{availabilitySummary.totalCount} sporcu</Text>
            </View>

            <View style={styles.athleteList}>
              {availabilityList.map((athlete) => {
                const isAvailable = athlete.status === "available";
                const isNotAvailable = athlete.status === "notAvailable";

                return (
                  <View key={athlete.id} style={styles.athleteCard}>
                    <View style={styles.athleteTopRow}>
                      <View style={styles.athleteInfo}>
                        <Text style={styles.athleteName}>{athlete.athleteName}</Text>
                        <Text style={styles.parentName}>Veli: {athlete.parentName}</Text>
                      </View>

                      <View
                        style={[
                          styles.listStatusBadge,
                          isAvailable ? styles.listStatusBadgeAvailable : null,
                          isNotAvailable ? styles.listStatusBadgeNotAvailable : null,
                        ]}
                      >
                        <Text
                          style={[
                            styles.listStatusText,
                            isAvailable ? styles.listStatusTextAvailable : null,
                            isNotAvailable ? styles.listStatusTextNotAvailable : null,
                          ]}
                        >
                          {getStatusLabel(athlete.status)}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.noteText}>
                      {athlete.note !== "" ? athlete.note : "Not yazılmadı."}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        ) : null}

        <View style={styles.noteCard}>
          <Text style={styles.noteTitle}>Gerçek sistemde nasıl olacak?</Text>
          <Text style={styles.noteText}>
            Firebase eklendiğinde her etkinlik için ayrı uygunluk kayıtları tutulacak.
            Sporcu veya veli durum değiştirince koç anında görecek.
          </Text>

          <AppButton
            title="Demo veriyi sıfırla"
            variant="ghost"
            onPress={resetAvailability}
            style={styles.resetButton}
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: theme.colors.background.app,
  },
  screen: {
    flexGrow: 1,
    backgroundColor: theme.colors.background.app,
    paddingHorizontal: theme.spacing["2xl"],
    paddingBottom: theme.spacing["2xl"],
  },
  container: {
    width: "100%",
    maxWidth: 980,
    alignSelf: "center",
  },
  pageHeader: {
    marginBottom: theme.spacing["2xl"],
  },
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
  viewSwitcher: {
    flexDirection: "row",
    gap: theme.spacing.md,
    marginBottom: theme.spacing["2xl"],
  },
  viewButton: {
    flex: 1,
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    alignItems: "center",
  },
  viewButtonActive: {
    backgroundColor: theme.colors.brand.primary,
    borderColor: theme.colors.brand.primary,
  },
  viewButtonText: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.black,
  },
  viewButtonTextActive: {
    color: theme.colors.text.inverse,
  },
  section: {
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.radius["2xl"],
    padding: theme.spacing["2xl"],
    marginBottom: theme.spacing["2xl"],
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    ...theme.shadows.sm,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  sectionHeaderText: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: theme.fontSizes["2xl"],
    fontWeight: theme.fontWeights.black,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  sectionSubtitle: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
    color: theme.colors.text.secondary,
    lineHeight: theme.lineHeights.md,
  },
  statusPill: {
    backgroundColor: theme.colors.brand.primarySoft,
    color: theme.colors.text.brand,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.black,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.full,
  },
  eventList: {
    gap: theme.spacing.md,
  },
  eventCard: {
    backgroundColor: theme.colors.background.subtle,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    padding: theme.spacing.lg,
  },
  eventCardActive: {
    backgroundColor: theme.colors.brand.primary,
    borderColor: theme.colors.brand.primary,
  },
  eventTitle: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.black,
    marginBottom: theme.spacing.xs,
  },
  eventTitleActive: {
    color: theme.colors.text.inverse,
  },
  eventMeta: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.semibold,
  },
  eventMetaActive: {
    color: theme.colors.text.inverse,
  },
  myStatusCard: {
    backgroundColor: theme.colors.background.subtle,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  myName: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes.xl,
    fontWeight: theme.fontWeights.black,
    marginBottom: theme.spacing.xs,
  },
  myTeam: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
  },
  label: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.black,
    marginBottom: theme.spacing.sm,
  },
  input: {
    minHeight: 52,
    backgroundColor: theme.colors.background.subtle,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.lg,
  },
  textArea: {
    minHeight: 110,
    textAlignVertical: "top",
  },
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  actionButton: {
    flexGrow: 1,
  },
  statusText: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.semibold,
    marginTop: theme.spacing.lg,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.lg,
    marginBottom: theme.spacing["2xl"],
  },
  statCard: {
    flexGrow: 1,
    flexBasis: 145,
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    ...theme.shadows.sm,
  },
  statValue: {
    color: theme.colors.brand.primary,
    fontSize: theme.fontSizes["4xl"],
    fontWeight: theme.fontWeights.black,
    marginBottom: theme.spacing.xs,
  },
  statLabel: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.extrabold,
  },
  athleteList: {
    gap: theme.spacing.md,
  },
  athleteCard: {
    backgroundColor: theme.colors.background.subtle,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    padding: theme.spacing.lg,
  },
  athleteTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  athleteInfo: {
    flex: 1,
  },
  athleteName: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.black,
    marginBottom: theme.spacing.xs,
  },
  parentName: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.semibold,
  },
  listStatusBadge: {
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  listStatusBadgeAvailable: {
    backgroundColor: theme.colors.brand.primarySoft,
    borderColor: theme.colors.brand.primarySoft,
  },
  listStatusBadgeNotAvailable: {
    backgroundColor: theme.colors.background.surface,
    borderColor: theme.colors.border.default,
  },
  listStatusText: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.black,
  },
  listStatusTextAvailable: {
    color: theme.colors.text.brand,
  },
  listStatusTextNotAvailable: {
    color: theme.colors.text.secondary,
  },
  noteCard: {
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.radius["2xl"],
    padding: theme.spacing["2xl"],
    marginBottom: theme.spacing["2xl"],
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    ...theme.shadows.sm,
  },
  noteTitle: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes.xl,
    fontWeight: theme.fontWeights.black,
    marginBottom: theme.spacing.md,
  },
  noteText: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
    lineHeight: theme.lineHeights.md,
  },
  resetButton: {
    marginTop: theme.spacing.lg,
  },
  pressed: {
    opacity: 0.84,
    transform: [{ scale: 0.99 }],
  },
});
