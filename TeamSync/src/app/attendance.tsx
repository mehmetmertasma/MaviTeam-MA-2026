import { useMemo, useState } from "react";
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

function getCurrentSaveLabel() {
  const time = new Date().toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return `Şimdi · ${time}`;
}

export default function AttendanceScreen() {
  const [attendanceList, setAttendanceList] =
    useState<AthleteAttendance[]>(initialAttendanceList);
  const [lastSavedAt, setLastSavedAt] = useState("Henüz kaydedilmedi");
  const [statusMessage, setStatusMessage] = useState(
    "Yoklama değişiklikleri şimdilik bu oturum içinde tutuluyor."
  );

  const attendanceSummary = useMemo(() => {
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

    const totalCount = attendanceList.length;
    const activeCount = presentCount + lateCount;
    const attendanceRate =
      totalCount > 0 ? Math.round((activeCount / totalCount) * 100) : 0;

    return {
      presentCount,
      absentCount,
      lateCount,
      excusedCount,
      totalCount,
      attendanceRate,
    };
  }, [attendanceList]);

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

    setStatusMessage("Yoklama güncellendi. Kaydetmeyi unutma.");
  }

  function handleSaveAttendance() {
    setLastSavedAt(getCurrentSaveLabel());
    setStatusMessage("Yoklama kaydedildi.");
  }

  function resetAttendance() {
    setAttendanceList(initialAttendanceList);
    setLastSavedAt("Henüz kaydedilmedi");
    setStatusMessage("Yoklama demo haline sıfırlandı.");
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.screen}>
      <View style={styles.container}>
        <View style={styles.pageHeader}>
          <Text style={styles.logo}>TeamSync</Text>
          <Text style={styles.pageTitle}>Yoklama</Text>
          <Text style={styles.pageSubtitle}>
            Koçlar sporcuların antrenman katılım durumunu buradan takip eder.
          </Text>
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
            <Text style={styles.statValue}>
              {attendanceSummary.presentCount}
            </Text>
            <Text style={styles.statLabel}>Katıldı</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>{attendanceSummary.absentCount}</Text>
            <Text style={styles.statLabel}>Katılmadı</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>{attendanceSummary.lateCount}</Text>
            <Text style={styles.statLabel}>Geç kaldı</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {attendanceSummary.excusedCount}
            </Text>
            <Text style={styles.statLabel}>Mazeretli</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeaderText}>
              <Text style={styles.sectionTitle}>Sporcu listesi</Text>
              <Text style={styles.sectionSubtitle}>
                Son kayıt: {lastSavedAt}
              </Text>
            </View>

            <Text style={styles.statusPill}>
              %{attendanceSummary.attendanceRate} katılım
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
                          isSelected ? styles.statusButtonSelected : null,
                          pressed ? styles.pressed : null,
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusButtonText,
                            isSelected ? styles.statusButtonTextSelected : null,
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

          <View style={styles.actionRow}>
            <AppButton
              title="Yoklamayı kaydet"
              onPress={handleSaveAttendance}
              style={styles.actionButton}
            />

            <AppButton
              title="Sıfırla"
              variant="ghost"
              onPress={resetAttendance}
              style={styles.actionButton}
            />
          </View>

          <Text style={styles.statusText}>{statusMessage}</Text>
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
  attendanceList: {
    gap: theme.spacing.md,
  },
  athleteCard: {
    backgroundColor: theme.colors.background.subtle,
    borderRadius: theme.radius.xl,
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
  statusButtonText: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.black,
  },
  statusButtonTextSelected: {
    color: theme.colors.text.inverse,
  },
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.md,
    marginTop: theme.spacing["2xl"],
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
  pressed: {
    opacity: 0.84,
    transform: [{ scale: 0.99 }],
  },
});
