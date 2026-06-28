import { useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { GroupMemberBubble, type GroupMember } from "@/components/GroupMemberBubble";
import { theme } from "@/constants/theme";

type ChatGroup = {
  id: string;
  name: string;
  teamName: string;
  description: string;
  memberCount: number;
};

type ChatMessage = {
  id: string;
  conversationId: string;
  senderName: string;
  senderRole: string;
  text: string;
  createdAt: string;
};

type ActiveChat =
  | { type: "group"; groupId: string }
  | { type: "direct"; memberId: string; conversationId: string };

const CURRENT_USER_ID = "athlete-mert";
const CURRENT_USER_NAME = "Mert Asma";
const CURRENT_USER_ROLE = "Athlete";

const chatGroups: ChatGroup[] = [
  {
    id: "team-u17-chat",
    name: "Team Chat",
    teamName: "U17 Erkek",
    description: "Antrenman, maç ve takım duyuruları",
    memberCount: 28,
  },
  {
    id: "team-u14-chat",
    name: "Team Chat",
    teamName: "U14 Kız",
    description: "Takım içi hızlı iletişim",
    memberCount: 22,
  },
  {
    id: "team-u18-chat",
    name: "Team Chat",
    teamName: "U18 Elite",
    description: "Elite takım mesajları",
    memberCount: 18,
  },
];

function createGroupMembers(group: ChatGroup): GroupMember[] {
  return Array.from({ length: group.memberCount }, (_, index) => {
    const memberNumber = index + 1;
    const role = memberNumber === 1 ? "Coach" : memberNumber % 5 === 0 ? "Parent" : "Athlete";

    return {
      id: `${group.id}-member-${memberNumber}`,
      name: `${group.teamName} Üye ${memberNumber}`,
      role,
      teamName: group.teamName,
    };
  });
}

const groupMembersById = chatGroups.reduce<Record<string, GroupMember[]>>(
  (groups, group) => ({ ...groups, [group.id]: createGroupMembers(group) }),
  {}
);

const allMembers = Object.values(groupMembersById).flat();

function getDirectConversationId(memberId: string) {
  return `direct-${[CURRENT_USER_ID, memberId].sort().join("-")}`;
}

const startingMessages: ChatMessage[] = [
  {
    id: "1",
    conversationId: "team-u17-chat",
    senderName: "Coach Emre",
    senderRole: "Coach",
    text: "Bugünkü antrenman 18:30’da başlayacak. Lütfen 15 dakika erken gelin.",
    createdAt: "2026-06-26T14:30:00.000Z",
  },
  {
    id: "2",
    conversationId: "team-u14-chat",
    senderName: "Coach Aylin",
    senderRole: "Coach",
    text: "U14 için yarın servis çalışması yapacağız.",
    createdAt: "2026-06-26T17:20:00.000Z",
  },
  {
    id: "3",
    conversationId: "team-u18-chat",
    senderName: "Coach Daniel",
    senderRole: "Coach",
    text: "U18 Elite maç kadrosu akşam paylaşılacak.",
    createdAt: "2026-06-27T13:15:00.000Z",
  },
];

function formatMessageTime(createdAt: string) {
  const date = new Date(createdAt);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
}

function getLastMessage(conversationId: string, messages: ChatMessage[]) {
  const conversationMessages = messages.filter((message) => message.conversationId === conversationId);
  return conversationMessages[conversationMessages.length - 1];
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function MessagesScreen() {
  const [activeChat, setActiveChat] = useState<ActiveChat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>(startingMessages);
  const [draftText, setDraftText] = useState("");
  const [openMemberListGroupId, setOpenMemberListGroupId] = useState<string | null>(null);

  const activeConversationId = activeChat?.type === "group" ? activeChat.groupId : activeChat?.conversationId;

  const activeGroup = useMemo(() => {
    if (activeChat?.type !== "group") {
      return undefined;
    }

    return chatGroups.find((group) => group.id === activeChat.groupId);
  }, [activeChat]);

  const activeMember = useMemo(() => {
    if (activeChat?.type !== "direct") {
      return undefined;
    }

    return allMembers.find((member) => member.id === activeChat.memberId);
  }, [activeChat]);

  const visibleMessages = useMemo(() => {
    if (!activeConversationId) {
      return [];
    }

    return messages.filter((message) => message.conversationId === activeConversationId);
  }, [activeConversationId, messages]);

  function openGroupChat(group: ChatGroup) {
    setActiveChat({ type: "group", groupId: group.id });
    setOpenMemberListGroupId(null);
    setDraftText("");
  }

  function openDirectChat(member: GroupMember) {
    setActiveChat({
      type: "direct",
      memberId: member.id,
      conversationId: getDirectConversationId(member.id),
    });
    setOpenMemberListGroupId(null);
    setDraftText("");
  }

  function closeChat() {
    setActiveChat(null);
    setOpenMemberListGroupId(null);
    setDraftText("");
  }

  function sendMessage() {
    const trimmedText = draftText.trim();

    if (!activeConversationId || trimmedText.length === 0) {
      return;
    }

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      conversationId: activeConversationId,
      senderName: CURRENT_USER_NAME,
      senderRole: CURRENT_USER_ROLE,
      text: trimmedText,
      createdAt: new Date().toISOString(),
    };

    setMessages((currentMessages) => [...currentMessages, newMessage]);
    setDraftText("");
  }

  if (activeChat !== null) {
    const chatTitle = activeChat.type === "group" ? `${activeGroup?.teamName ?? "Team"} Team Chat` : activeMember?.name ?? "Bireysel Mesaj";
    const chatSubtitle = activeChat.type === "group" ? `${activeGroup?.memberCount ?? 0} üye` : activeMember ? `${activeMember.role} · ${activeMember.teamName}` : "Bireysel mesaj";

    return (
      <KeyboardAvoidingView style={styles.chatScreen} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.chatHeaderWrapper}>
          <Pressable onPress={closeChat} style={({ pressed }) => [styles.backButton, pressed ? styles.pressed : null]}>
            <Text style={styles.backButtonText}>‹</Text>
          </Pressable>

          <View style={styles.chatTitleArea}>
            <Text style={styles.chatTitle} numberOfLines={1}>{chatTitle}</Text>
            {activeChat.type === "group" && activeGroup ? (
              <Pressable onPress={() => setOpenMemberListGroupId(activeGroup.id)}>
                <Text style={styles.chatSubtitleLink}>{chatSubtitle} · listeyi gör</Text>
              </Pressable>
            ) : (
              <Text style={styles.chatSubtitle}>{chatSubtitle}</Text>
            )}
          </View>
        </View>

        {activeGroup && openMemberListGroupId === activeGroup.id ? (
          <View style={styles.chatMemberBubbleWrapper}>
            <GroupMemberBubble
              title={`${activeGroup.teamName} üyeleri`}
              members={groupMembersById[activeGroup.id] ?? []}
              onClose={() => setOpenMemberListGroupId(null)}
              onQuickMessage={openDirectChat}
            />
          </View>
        ) : null}

        <ScrollView style={styles.messagesScroll} contentContainerStyle={styles.messagesContent}>
          {visibleMessages.length > 0 ? (
            visibleMessages.map((message) => {
              const isMyMessage = message.senderName === CURRENT_USER_NAME;

              return (
                <View key={message.id} style={[styles.messageBubble, isMyMessage ? styles.myMessageBubble : styles.otherMessageBubble]}>
                  <View style={styles.messageTopRow}>
                    <Text style={styles.messageSender}>{message.senderName}</Text>
                    <Text style={styles.messageTime}>{formatMessageTime(message.createdAt)}</Text>
                  </View>
                  <Text style={styles.messageRole}>{message.senderRole}</Text>
                  <Text style={styles.messageText}>{message.text}</Text>
                </View>
              );
            })
          ) : (
            <View style={styles.emptyChatCard}>
              <Text style={styles.emptyChatTitle}>Henüz mesaj yok</Text>
              <Text style={styles.emptyChatText}>Bu konuşmada ilk mesajı sen gönderebilirsin.</Text>
            </View>
          )}
        </ScrollView>

        <View style={styles.composer}>
          <TextInput
            value={draftText}
            onChangeText={setDraftText}
            placeholder="Mesaj yaz..."
            placeholderTextColor={theme.colors.text.muted}
            multiline
            style={styles.composerInput}
          />
          <Pressable onPress={sendMessage} style={({ pressed }) => [styles.sendButton, pressed ? styles.pressed : null]}>
            <Text style={styles.sendButtonText}>➤</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.screenContent}>
      <View style={styles.container}>
        <View style={styles.pageHeader}>
          <Text style={styles.logo}>TeamSync</Text>
          <Text style={styles.title}>Mesajlar</Text>
          <Text style={styles.subtitle}>Takım grupları ve bireysel mesajlar.</Text>
        </View>

        <View style={styles.groupsSection}>
          <Text style={styles.sectionTitle}>Takım Grupları</Text>

          {chatGroups.map((group) => {
            const lastMessage = getLastMessage(group.id, messages);
            const isMemberListOpen = openMemberListGroupId === group.id;

            return (
              <View key={group.id}>
                <View style={styles.groupCard}>
                  <Pressable onPress={() => openGroupChat(group)} style={({ pressed }) => [styles.groupMainArea, pressed ? styles.pressed : null]}>
                    <View style={styles.groupAvatar}>
                      <Text style={styles.groupAvatarText}>{getInitials(group.teamName)}</Text>
                    </View>

                    <View style={styles.groupInfo}>
                      <View style={styles.groupTopRow}>
                        <Text style={styles.groupTitle}>{group.teamName} {group.name}</Text>
                        <Text style={styles.groupArrow}>›</Text>
                      </View>
                      <Text style={styles.groupDescription}>{group.description}</Text>
                      <Text style={styles.lastMessage} numberOfLines={1}>
                        {lastMessage ? `${lastMessage.senderName}: ${lastMessage.text}` : "Henüz mesaj yok."}
                      </Text>
                    </View>
                  </Pressable>

                  <Pressable
                    onPress={() => setOpenMemberListGroupId(isMemberListOpen ? null : group.id)}
                    style={({ pressed }) => [styles.memberCountButton, pressed ? styles.pressed : null]}
                  >
                    <Text style={styles.memberCountText}>{group.memberCount} üye</Text>
                    <Text style={styles.memberCountHint}>Listeyi gör</Text>
                  </Pressable>
                </View>

                {isMemberListOpen ? (
                  <GroupMemberBubble
                    title={`${group.teamName} üyeleri`}
                    members={groupMembersById[group.id] ?? []}
                    onClose={() => setOpenMemberListGroupId(null)}
                    onQuickMessage={openDirectChat}
                  />
                ) : null}
              </View>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background.app },
  screenContent: { flexGrow: 1, paddingHorizontal: theme.spacing["2xl"], paddingBottom: theme.spacing["2xl"] },
  container: { width: "100%", maxWidth: 980, alignSelf: "center" },
  pageHeader: { marginBottom: theme.spacing["2xl"] },
  logo: { color: theme.colors.brand.primary, fontSize: theme.fontSizes["2xl"], fontWeight: theme.fontWeights.black, marginBottom: theme.spacing.md },
  title: { color: theme.colors.text.inverse, fontSize: theme.fontSizes["5xl"], fontWeight: theme.fontWeights.black, lineHeight: theme.lineHeights["5xl"], marginBottom: theme.spacing.sm },
  subtitle: { color: theme.colors.text.inverse, opacity: 0.76, fontSize: theme.fontSizes.lg, fontWeight: theme.fontWeights.semibold },
  groupsSection: { gap: theme.spacing.lg },
  sectionTitle: { color: theme.colors.text.inverse, fontSize: theme.fontSizes["2xl"], fontWeight: theme.fontWeights.black, marginBottom: theme.spacing.sm },
  groupCard: { backgroundColor: theme.colors.background.surface, borderRadius: theme.radius["2xl"], borderWidth: 1, borderColor: theme.colors.border.default, padding: theme.spacing.xl, gap: theme.spacing.lg, ...theme.shadows.sm },
  groupMainArea: { flexDirection: "row", gap: theme.spacing.lg },
  groupAvatar: { width: 52, height: 52, borderRadius: theme.radius.full, backgroundColor: theme.colors.brand.primarySoft, alignItems: "center", justifyContent: "center" },
  groupAvatarText: { color: theme.colors.text.brand, fontSize: theme.fontSizes.md, fontWeight: theme.fontWeights.black },
  groupInfo: { flex: 1 },
  groupTopRow: { flexDirection: "row", alignItems: "center", gap: theme.spacing.md },
  groupTitle: { flex: 1, color: theme.colors.text.primary, fontSize: theme.fontSizes.xl, fontWeight: theme.fontWeights.black },
  groupArrow: { color: theme.colors.text.brand, fontSize: theme.fontSizes["3xl"], fontWeight: theme.fontWeights.black },
  groupDescription: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.md, fontWeight: theme.fontWeights.semibold, marginTop: theme.spacing.xs },
  lastMessage: { color: theme.colors.text.muted, fontSize: theme.fontSizes.md, fontWeight: theme.fontWeights.semibold, marginTop: theme.spacing.md },
  memberCountButton: { alignSelf: "flex-start", backgroundColor: theme.colors.brand.primarySoft, borderRadius: theme.radius.full, paddingVertical: theme.spacing.sm, paddingHorizontal: theme.spacing.lg },
  memberCountText: { color: theme.colors.text.brand, fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.black },
  memberCountHint: { color: theme.colors.text.brand, fontSize: 10, fontWeight: theme.fontWeights.semibold, marginTop: 2 },
  chatScreen: { flex: 1, backgroundColor: theme.colors.background.app },
  chatHeaderWrapper: { paddingHorizontal: theme.spacing["2xl"], paddingBottom: theme.spacing.lg, borderBottomWidth: 1, borderBottomColor: theme.colors.border.default, flexDirection: "row", alignItems: "center", gap: theme.spacing.md },
  backButton: { width: 44, height: 44, borderRadius: theme.radius.full, backgroundColor: theme.colors.background.surface, borderWidth: 1, borderColor: theme.colors.border.default, alignItems: "center", justifyContent: "center", ...theme.shadows.sm },
  backButtonText: { color: theme.colors.text.primary, fontSize: theme.fontSizes["3xl"], fontWeight: theme.fontWeights.black, marginTop: -4 },
  chatTitleArea: { flex: 1 },
  chatTitle: { color: theme.colors.text.inverse, fontSize: theme.fontSizes.xl, fontWeight: theme.fontWeights.black },
  chatSubtitle: { color: theme.colors.text.inverse, opacity: 0.72, fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.semibold, marginTop: theme.spacing.xs },
  chatSubtitleLink: { color: theme.colors.text.inverse, opacity: 0.9, fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.black, marginTop: theme.spacing.xs, textDecorationLine: "underline" },
  chatMemberBubbleWrapper: { paddingHorizontal: theme.spacing.xl, paddingTop: theme.spacing.md },
  messagesScroll: { flex: 1 },
  messagesContent: { padding: theme.spacing.xl, gap: theme.spacing.md },
  messageBubble: { borderRadius: theme.radius.xl, padding: theme.spacing.lg, borderWidth: 1, ...theme.shadows.sm },
  otherMessageBubble: { backgroundColor: theme.colors.background.surface, borderColor: theme.colors.border.default, alignSelf: "flex-start", maxWidth: "88%" },
  myMessageBubble: { backgroundColor: theme.colors.brand.primarySoft, borderColor: theme.colors.brand.primarySoft, alignSelf: "flex-end", maxWidth: "88%" },
  messageTopRow: { flexDirection: "row", justifyContent: "space-between", gap: theme.spacing.md, marginBottom: theme.spacing.xs },
  messageSender: { color: theme.colors.text.primary, fontSize: theme.fontSizes.md, fontWeight: theme.fontWeights.black },
  messageTime: { color: theme.colors.text.muted, fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.extrabold },
  messageRole: { color: theme.colors.text.brand, fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.extrabold, marginBottom: theme.spacing.sm },
  messageText: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.md, fontWeight: theme.fontWeights.semibold, lineHeight: theme.lineHeights.md },
  emptyChatCard: { backgroundColor: theme.colors.background.surface, borderRadius: theme.radius.xl, borderWidth: 1, borderColor: theme.colors.border.default, padding: theme.spacing.xl },
  emptyChatTitle: { color: theme.colors.text.primary, fontSize: theme.fontSizes.lg, fontWeight: theme.fontWeights.black, marginBottom: theme.spacing.xs },
  emptyChatText: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.md, fontWeight: theme.fontWeights.semibold },
  composer: { backgroundColor: theme.colors.background.surface, borderTopWidth: 1, borderTopColor: theme.colors.border.default, padding: theme.spacing.lg, flexDirection: "row", alignItems: "flex-end", gap: theme.spacing.md },
  composerInput: { flex: 1, minHeight: 46, maxHeight: 110, backgroundColor: theme.colors.background.subtle, borderWidth: 1, borderColor: theme.colors.border.default, borderRadius: theme.radius.xl, paddingVertical: theme.spacing.md, paddingHorizontal: theme.spacing.lg, color: theme.colors.text.primary, fontSize: theme.fontSizes.md, fontWeight: theme.fontWeights.semibold, textAlignVertical: "top" },
  sendButton: { width: 46, height: 46, borderRadius: theme.radius.full, backgroundColor: theme.colors.brand.primary, alignItems: "center", justifyContent: "center" },
  sendButtonText: { color: theme.colors.text.inverse, fontSize: theme.fontSizes.lg, fontWeight: theme.fontWeights.black },
  pressed: { opacity: 0.84, transform: [{ scale: 0.99 }] },
});