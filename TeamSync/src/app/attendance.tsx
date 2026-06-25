import { Link } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { theme } from "@/constants/theme";

type AttendanceStatus = "Katıldı" | "Katılmadı" | "Geç kaldı" | "Mazeretli";

type AthleteAttendance = {
  id: number;
  name: string;
  team: string;
  position: string;
  status: AttendanceStatus;
};

const attendanceOptions: AttendanceStatus[] = [
  "Katıldı",
  "Katılmadı",
  "Geç kaldı",
  "Mazeretli",
];

const initialAttendanceList: AthleteAttendance[] = [
  {
    id: 1,
    name: "Efe Yılmaz",
    team: "U16 Erkek",
    position: "Pasör",
    status: "Katıldı",
  },
  {
    id: 2,
    name: "Mert Asma",
    team: "U16 Erkek",
    position: "Smaçör",
    status: "Katıldı",
  },
  {
    id: 3,
    name: "Can Demir",
    team: "U16 Erkek",
    position: "Libero",
    status: "Geç kaldı",
  },
  {
    id: 4,
    name: "Deniz Kaya",
    team: "U16 Erkek",
    position: "Orta oyuncu",
    status: "Katılmadı",
  },
  {
    id: 5,
    name: "Emir Çelik",
    team: "U16 Erkek",
    position: "Pasör çaprazı",
    status: "Mazeretli",
  },
];

export default function AttendanceScreen() {
  const [attendanceList, setAttendanceList] = useState<AthleteAttendance[]>(
    initialAttendanceList
  );

  const [lastSavedAt, setLastSavedAt] = useState("Henüz kaydedilmedi");

  const presentCount = attendanceList.filter(
    (athlete) => athlete.status === "Katıldı"
  ).length;

  const absentCount = attendanceList.filter(
    (athlete) => athlete.status === "Katılmadı"
  ).length;

  const lateCount = attendanceList.filter(
    (athlete) => athlete.status === "Geç kaldı"
  ).length;

  const excusedCount = attendanceList.filter(
    (athlete) => athlete.status === "Mazeretli"
  ).length;

  function updateAttendanceStatus(
    athleteId: number,
    newStatus: AttendanceStatus
  ) {
    setAttendanceList((currentList) =>
      currentList.map((athlete) => {
        if (athlete.id === athleteId) {
          return {
            ...athlete,
            status: newStatus,
          };
        }

        return athlete;
      })
    );
  }

  function handleSaveAttendance() {
    setLastSavedAt("Şimdi");
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.screen}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.logo}>TeamSync</Text>

          <View>
            <Text style={styles.pageTitle}>Yoklama</Text>
            <Text style={styles.pageSubtitle}>
              Koçlar sporcuların antrenman katılım durumunu buradan takip eder.
            </Text>
          </View>
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>Antrenman takibi</Text>

          <Text style={styles.heroTitle}>U16 Erkek yoklaması</Text>

          <Text style={styles.heroSubtitle}>
            Sporcuları Katıldı, Katılmadı, Geç kaldı veya Mazeretli olarak
            işaretleyebilirsin.
          </Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{presentCount}</Text>
            <Text style={styles.statLabel}>Katıldı</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>{absentCount}</Text>
            <Text style={styles.statLabel}>Katılmadı</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>{lateCount}</Text>
            <Text style={styles.statLabel}>Geç kaldı</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>{excusedCount}</Text>
            <Text style={styles.statLabel}>Mazeretli</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.listHeader}>
            <View>
              <Text style={styles.sectionTitle}>Sporcu listesi</Text>
              <Text style={styles.sectionSubtitle}>
                Son kayıt: {lastSavedAt}
              </Text>
            </View>

            <Text style={styles.countText}>
              {attendanceList.length} sporcu
            </Text>
          </View>

          <View style={styles.attendanceList}>
            {attendanceList.map((athlete) => (
              <View key={athlete.id} style={styles.athleteCard}>
                <View style={styles.athleteTopRow}>
                  <View style={styles.athleteInfo}>
                    <Text style={styles.athleteName}>{athlete.name}</Text>
                    <Text style={styles.athleteMeta}>
                      {athlete.team} · {athlete.position}
                    </Text>
                  </View>

                  <Text style={styles.currentStatus}>{athlete.status}</Text>
                </View>

                <View style={styles.statusGrid}>
                  {attendanceOptions.map((status) => {
                    const isSelected = athlete.status === status;

                    return (
                      <Pressable
                        key={status}
                        onPress={() =>
                          updateAttendanceStatus(athlete.id, status)
                        }
                        style={({ pressed }) => [
                          styles.statusButton,
                          isSelected && styles.statusButtonSelected,
                          pressed && styles.statusButtonPressed,
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusButtonText,
                            isSelected && styles.statusButtonTextSelected,
                          ]}
                        >
                          {status}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>

          <Pressable
            onPress={handleSaveAttendance}
            style={({ pressed }) => [
              styles.saveButton,
              pressed && styles.saveButtonPressed,
            ]}
          >
            <Text style={styles.saveButtonText}>Yoklamayı kaydet</Text>
          </Pressable>
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
  section: {
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.radius["2xl"],
    padding: theme.spacing["2xl"],
    marginBottom: theme.spacing["2xl"],
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    ...theme.shadows.sm,
  },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
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
  },
  countText: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.extrabold,
  },
  attendanceList: {
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
    gap: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
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
  athleteMeta: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
    color: theme.colors.text.secondary,
  },
  currentStatus: {
    color: theme.colors.text.brand,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.black,
  },
  statusGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },
  statusButton: {
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  statusButtonSelected: {
    backgroundColor: theme.colors.brand.primary,
    borderColor: theme.colors.brand.primary,
  },
  statusButtonPressed: {
    opacity: 0.84,
    transform: [{ scale: 0.99 }],
  },
  statusButtonText: {
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.black,
    color: theme.colors.text.secondary,
  },
  statusButtonTextSelected: {
    color: theme.colors.text.inverse,
  },
  saveButton: {
    backgroundColor: theme.colors.brand.primary,
    borderRadius: theme.radius.lg,
    paddingVertical: theme.spacing.lg,
    alignItems: "center",
    marginTop: theme.spacing.xl,
  },
  saveButtonPressed: {
    opacity: 0.84,
    transform: [{ scale: 0.99 }],
  },
  saveButtonText: {
    color: theme.colors.text.inverse,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.black,
  },
  backButton: {
    marginBottom: theme.spacing["2xl"],
  },
});