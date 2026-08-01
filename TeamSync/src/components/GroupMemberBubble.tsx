import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { theme } from "@/constants/theme";

export type GroupMember = {
  id: string;
  name: string;
  role: string;
  teamName: string;
};

type GroupMemberBubbleProps = {
  title: string;
  members: GroupMember[];
  onClose: () => void;
  onQuickMessage: (member: GroupMember) => void;
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function GroupMemberBubble({
  title,
  members,
  onClose,
  onQuickMessage,
}: GroupMemberBubbleProps) {
  return (
    <View style={styles.panel}>
      <View style={styles.header}>
        <View style={styles.titleArea}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>
            Bu grup mesajlarını görebilen {members.length} kişi
          </Text>
        </View>

        <Pressable
          onPress={onClose}
          style={({ pressed }) => [styles.closeButton, pressed ? styles.pressed : null]}
          accessibilityLabel="Üye listesini kapat"
        >
          <Text style={styles.closeButtonText}>×</Text>
        </Pressable>
      </View>

      <ScrollView
        nestedScrollEnabled
        style={styles.memberList}
        contentContainerStyle={styles.memberListContent}
      >
        {members.map((member) => (
          <View key={member.id} style={styles.memberRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getInitials(member.name)}</Text>
            </View>

            <View style={styles.memberInfo}>
              <Text style={styles.memberName}>{member.name}</Text>
              <Text style={styles.memberMeta}>{member.teamName}</Text>
            </View>

            <Pressable
              onPress={() => onQuickMessage(member)}
              style={({ pressed }) => [styles.quickButton, pressed ? styles.pressed : null]}
            >
              <Text style={styles.quickButtonText}>Hızlı mesaj</Text>
            </Pressable>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.radius["2xl"],
    borderWidth: 1,
    borderColor: theme.colors.brand.primarySoft,
    padding: theme.spacing.lg,
    marginTop: theme.spacing.md,
    ...theme.shadows.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  titleArea: { flex: 1 },
  title: { color: theme.colors.text.primary, fontSize: theme.fontSizes.lg, fontWeight: theme.fontWeights.semibold },
  subtitle: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.semibold,
    marginTop: theme.spacing.xs,
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.background.subtle,
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonText: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes.xl,
    fontWeight: theme.fontWeights.semibold,
    marginTop: -2,
  },
  memberList: { maxHeight: 280 },
  memberListContent: { gap: theme.spacing.sm },
  memberRow: {
    minHeight: 62,
    backgroundColor: theme.colors.background.subtle,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.brand.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: theme.colors.text.brand,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.semibold,
  },
  memberInfo: { flex: 1 },
  memberName: { color: theme.colors.text.primary, fontSize: theme.fontSizes.md, fontWeight: theme.fontWeights.semibold },
  memberMeta: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.semibold,
    marginTop: theme.spacing.xs,
  },
  quickButton: {
    backgroundColor: theme.colors.brand.primary,
    borderRadius: theme.radius.full,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  quickButtonText: {
    color: theme.colors.text.inverse,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.semibold,
  },
  pressed: { opacity: 0.84, transform: [{ scale: 0.99 }] },
});
