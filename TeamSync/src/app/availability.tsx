import { Link } from "expo-router";
import { useState } from "react";
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

export default function AvailabilityScreen() {
  const [activeView, setActiveView] = useState<AvailabilityView>("athleteParent");
  const [selectedEventId, setSelectedEventId] = useState(events[0].id);
  const [availabilityList, setAvailabilityList] =
    useState<AthleteAvailability[]>(initialAvailability);
  const [myNote, setMyNote] = useState("Geliyorum.");

  const selectedEvent = events.find((event) => event.id === selectedEventId);

  const availableCount = availabilityList.filter(
    (athlete) => athlete.status === "available",
  ).length;

  const notAvailableCount = availabilityList.filter(
    (athlete) => athlete.status === "notAvailable",
  ).length;

  const notAnsweredCount = availabilityList.filter(
    (athlete) => athlete.status === "notAnswered",
  ).length;

  const myAvailability = availabilityList.find(
    (athlete) => athlete.athleteName === "Mert Asma",
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
      }),
    );
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
      }),
    );
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.screen}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.logo}>TeamSync</Text>

          <View>
            <Text style={styles.pageTitle}>Uygunluk Bildirme</Text>

            <Text style={styles.pageSubtitle}>
              Sporcular ve veliler antrenman veya maç için uygunluk durumunu
              bildirir. Koçlar takımın durumunu tek ekranda görür.
            </Text>
          </View>
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>Katılım planlama</Text>

          <Text style={styles.heroTitle}>Kim geliyor, kim gelemiyor?</Text>

          <Text style={styles.heroSubtitle}>
            Bu ekran maç ve antrenman öncesi koçun kadro planlamasını
            kolaylaştırır.
          </Text>
        </View>

        <View style={styles.viewSwitcher}>
          <Pressable
            onPress={() => setActiveView("athleteParent")}
            style={[
              styles.viewButton,
              activeView === "athleteParent" && styles.viewButtonActive,
            ]}
          >
            <Text
              style={[
                styles.viewButtonText,
                activeView === "athleteParent" && styles.viewButtonTextActive,
              ]}
            >
              Sporcu / Veli
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveView("coachAdmin")}
            style={[
              styles.viewButton,
              activeView === "coachAdmin" && styles.viewButtonActive,
            ]}
          >
            <Text
              style={[
                styles.viewButtonText,
                activeView === "coachAdmin" && styles.viewButtonTextActive,
              ]}
            >
              Koç / Admin
            </Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Etkinlik seç</Text>

          <Text style={styles.sectionSubtitle}>
            Demo için etkinliği buradan seçiyoruz. Gerçek sistemde bu bilgiler
            takvimden gelecek.
          </Text>

          <View style={styles.eventList}>
            {events.map((event) => {
              const isSelected = selectedEventId === event.id;

              return (
                <Pressable
                  key={event.id}
                  onPress={() => setSelectedEventId(event.id)}
                  style={({ pressed }) => [
                    styles.eventCard,
                    isSelected && styles.eventCardActive,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.eventTitle,
                      isSelected && styles.eventTitleActive,
                    ]}
                  >
                    {event.title}
                  </Text>

                  <Text
                    style={[
                      styles.eventMeta,
                      isSelected && styles.eventMetaActive,
                    ]}
                  >
                    {event.date} · {event.location}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {activeView === "athleteParent" && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Benim durumum</Text>

            <Text style={styles.sectionSubtitle}>
              {selectedEvent?.title} için uygunluk durumunu seç.
            </Text>

            <View style={styles.myStatusCard}>
              <Text style={styles.myName}>Mert Asma</Text>
              <Text style={styles.myTeam}>U17 Erkek</Text>

              <View style={styles.statusBadge}>
                <Text style={styles.statusBadgeText}>
                  Şu an: {getStatusLabel(myAvailability?.status ?? "notAnswered")}
                </Text>
              </View>
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

            <View style={styles.statusActions}>
              <Pressable
                onPress={() => updateMyStatus("available")}
                style={({ pressed }) => [
                  styles.statusButton,
                  styles.availableButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.statusButtonText}>Uygunum</Text>
              </Pressable>

              <Pressable
                onPress={() => updateMyStatus("notAvailable")}
                style={({ pressed }) => [
                  styles.statusButton,
                  styles.notAvailableButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.statusButtonText}>Uygun değilim</Text>
              </Pressable>

              <Pressable
                onPress={saveMyNote}
                style={({ pressed }) => [
                  styles.statusButton,
                  styles.noteButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.statusButtonText}>Notu kaydet</Text>
              </Pressable>
            </View>
          </View>
        )}

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{availableCount}</Text>
            <Text style={styles.statLabel}>Uygun</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>{notAvailableCount}</Text>
            <Text style={styles.statLabel}>Uygun değil</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>{notAnsweredCount}</Text>
            <Text style={styles.statLabel}>Cevap yok</Text>
          </View>
        </View>

        {activeView === "coachAdmin" && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Takım uygunluk listesi</Text>

            <Text style={styles.sectionSubtitle}>
              Koç ve admin, seçilen etkinlik için oyuncuların durumunu görür.
            </Text>

            <View style={styles.athleteList}>
              {availabilityList.map((athlete) => {
                const isAvailable = athlete.status === "available";
                const isNotAvailable = athlete.status === "notAvailable";

                return (
                  <View key={athlete.id} style={styles.athleteCard}>
                    <View style={styles.athleteTopRow}>
                      <View style={styles.athleteInfo}>
                        <Text style={styles.athleteName}>
                          {athlete.athleteName}
                        </Text>

                        <Text style={styles.parentName}>
                          Veli: {athlete.parentName}
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.listStatusBadge,
                          isAvailable && styles.listStatusBadgeAvailable,
                          isNotAvailable && styles.listStatusBadgeNotAvailable,
                        ]}
                      >
                        <Text
                          style={[
                            styles.listStatusText,
                            isAvailable && styles.listStatusTextAvailable,
                            isNotAvailable &&
                              styles.listStatusTextNotAvailable,
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
        )}

        <View style={styles.noteCard}>
          <Text style={styles.noteTitle}>Gerçek sistemde nasıl olacak?</Text>

          <Text style={styles.noteText}>
            Firebase eklendiğinde her etkinlik için ayrı uygunluk kayıtları
            tutulacak. Sporcu veya veli durum değiştirince koç anında görecek.
          </Text>
        </View>

        <Link href="/dashboard" asChild>
          <AppButton
            title="Dashboard'a dön"
            variant="ghost"
            accessibilityLabel="Dashboard sayfasına dön"
            style={styles.backButton}
          />
        </Link>
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
    padding: theme.spacing["2xl"],
  },
  container: {
    width: "100%",
    maxWidth: 980,
    alignSelf: "center",
  },
  header: {
    marginTop: theme.spacing["2xl"],
    marginBottom: theme.spacing["2xl"],
    gap: theme.spacing.lg,
  },
  logo: {
    fontSize: theme.fontSizes["2xl"],
    fontWeight: theme.fontWeights.black,
    color: theme.colors.brand.primary,
  },
  pageTitle: {
    fontSize: theme.fontSizes["5xl"],
    fontWeight: theme.fontWeights.black,
    color: theme.colors.text.inverse,
    lineHeight: theme.lineHeights["5xl"],
    marginBottom: theme.spacing.sm,
  },
  pageSubtitle: {
    fontSize: theme.fontSizes.lg,
    color: theme.colors.text.inverse,
    opacity: 0.76,
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
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    paddingVertical: theme.spacing.lg,
    alignItems: "center",
  },
  viewButtonActive: {
    backgroundColor: theme.colors.brand.primary,
    borderColor: theme.colors.brand.primary,
  },
  viewButtonText: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.black,
    color: theme.colors.text.secondary,
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
  sectionTitle: {
    fontSize: theme.fontSizes["2xl"],
    fontWeight: theme.fontWeights.black,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  sectionSubtitle: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
    color: theme.colors.text.secondary,
    lineHeight: theme.lineHeights.md,
    marginBottom: theme.spacing.lg,
  },
  eventList: {
    gap: theme.spacing.md,
  },
  eventCard: {
    backgroundColor: theme.colors.background.subtle,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    padding: theme.spacing.lg,
  },
  eventCardActive: {
    backgroundColor: theme.colors.brand.primary,
    borderColor: theme.colors.brand.primary,
  },
  eventTitle: {
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.black,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  eventTitleActive: {
    color: theme.colors.text.inverse,
  },
  eventMeta: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
    color: theme.colors.text.secondary,
  },
  eventMetaActive: {
    color: theme.colors.text.inverse,
  },
  myStatusCard: {
    backgroundColor: theme.colors.background.subtle,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    marginBottom: theme.spacing.lg,
  },
  myName: {
    fontSize: theme.fontSizes.xl,
    fontWeight: theme.fontWeights.black,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  myTeam: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.md,
  },
  statusBadge: {
    alignSelf: "flex-start",
    backgroundColor: theme.colors.brand.primarySoft,
    borderRadius: theme.radius.full,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
  },
  statusBadgeText: {
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.black,
    color: theme.colors.text.brand,
  },
  label: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.extrabold,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
  },
  input: {
    backgroundColor: theme.colors.background.subtle,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
    color: theme.colors.text.primary,
  },
  textArea: {
    minHeight: 110,
    textAlignVertical: "top",
  },
  statusActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.md,
    marginTop: theme.spacing.lg,
  },
  statusButton: {
    flexGrow: 1,
    flexBasis: 160,
    borderRadius: theme.radius.full,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    alignItems: "center",
  },
  availableButton: {
    backgroundColor: theme.colors.state.success,
  },
  notAvailableButton: {
    backgroundColor: theme.colors.state.danger,
  },
  noteButton: {
    backgroundColor: theme.colors.brand.primary,
  },
  statusButtonText: {
    color: theme.colors.text.inverse,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.black,
  },
  pressed: {
    opacity: 0.84,
    transform: [{ scale: 0.99 }],
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.lg,
    marginBottom: theme.spacing["2xl"],
  },
  statCard: {
    flexGrow: 1,
    flexBasis: 180,
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    ...theme.shadows.sm,
  },
  statValue: {
    fontSize: theme.fontSizes["4xl"],
    fontWeight: theme.fontWeights.black,
    color: theme.colors.brand.primary,
    marginBottom: theme.spacing.xs,
  },
  statLabel: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.extrabold,
    color: theme.colors.text.secondary,
  },
  athleteList: {
    gap: theme.spacing.md,
  },
  athleteCard: {
    backgroundColor: theme.colors.background.subtle,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
  },
  athleteTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  athleteInfo: {
    flex: 1,
  },
  athleteName: {
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.black,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  parentName: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
    color: theme.colors.text.secondary,
  },
  listStatusBadge: {
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.radius.full,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    alignSelf: "flex-start",
  },
  listStatusBadgeAvailable: {
    backgroundColor: theme.colors.state.successSoft,
  },
  listStatusBadgeNotAvailable: {
    backgroundColor: theme.colors.state.dangerSoft,
  },
  listStatusText: {
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.black,
    color: theme.colors.text.muted,
  },
  listStatusTextAvailable: {
    color: theme.colors.text.success,
  },
  listStatusTextNotAvailable: {
    color: theme.colors.text.danger,
  },
  noteText: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
    color: theme.colors.text.secondary,
    lineHeight: theme.lineHeights.md,
  },
  noteCard: {
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.radius["2xl"],
    padding: theme.spacing["2xl"],
    marginBottom: theme.spacing["2xl"],
    borderWidth: 1,
    borderColor: theme.colors.border.default,
  },
  noteTitle: {
    fontSize: theme.fontSizes.xl,
    fontWeight: theme.fontWeights.black,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  backButton: {
    marginBottom: theme.spacing["2xl"],
  },
});