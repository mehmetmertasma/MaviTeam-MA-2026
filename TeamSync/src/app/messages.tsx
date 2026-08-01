import { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { AppButton } from "@/components/AppButton";
import { AppScreenLayout } from "@/components/AppScreenLayout";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { GroupMemberBubble, type GroupMember } from "@/components/GroupMemberBubble";
import { PageHeader } from "@/components/PageHeader";
import { TextField } from "@/components/TextField";
import { theme } from "@/constants/theme";
import { useAppDataContext } from "@/providers/AppDataProvider";
import { teamSyncService } from "@/services/teamSyncService";
import type { ChatGroup, ChatMessage, TeamSyncAppData, UserProfile } from "@/types/teamSync";

type ActiveChat = { type: "group"; groupId: string } | { type: "direct"; userId: string };

type TargetOption = {
  id: string;
  label: string;
  teamId?: string;
};

const EMPTY_CHAT_GROUPS: ChatGroup[] = [];
const EMPTY_CHAT_MESSAGES: ChatMessage[] = [];
const EMPTY_USERS: UserProfile[] = [];

function formatMessageTime(createdAt: string) {
  const date = new Date(createdAt);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
}

function getLastGroupMessage(groupId: string, messages: ChatMessage[]) {
  const conversationMessages = messages.filter((message) => message.groupId === groupId);
  return conversationMessages[conversationMessages.length - 1];
}

function getDirectMessages(currentUserId: string, targetUserId: string, messages: ChatMessage[]) {
  return messages.filter((message) => {
    const directUserIds = message.directUserIds ?? [];
    return directUserIds.includes(currentUserId) && directUserIds.includes(targetUserId);
  });
}

function getLastDirectMessage(currentUserId: string, targetUserId: string, messages: ChatMessage[]) {
  const conversationMessages = getDirectMessages(currentUserId, targetUserId, messages);
  return conversationMessages[conversationMessages.length - 1];
}

function getInitials(name: string) {
  const initials = name
    .trim()
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return initials || "TS";
}

function getSenderName(userId: string, users: UserProfile[]) {
  return users.find((user) => user.id === userId)?.fullName ?? "Bilinmeyen kullanıcı";
}

function getGroupTeamName(group: ChatGroup, appData: TeamSyncAppData) {
  if (group.teamId === undefined) {
    return "Tüm Kulüp";
  }

  return appData.teams.find((team) => team.id === group.teamId)?.name ?? "Takım bulunamadı";
}

function getGroupMembers(group: ChatGroup, users: UserProfile[]) {
  return users.filter((user) => group.visibleUserIds.includes(user.id) && user.status !== "removed");
}

function toGroupMembers(group: ChatGroup, appData: TeamSyncAppData): GroupMember[] {
  const teamName = getGroupTeamName(group, appData);

  return getGroupMembers(group, appData.users).map((user) => ({
    id: user.id,
    name: user.fullName,
    role: "",
    teamName,
  }));
}

export default function MessagesScreen() {
  const { appData, setAppData } = useAppDataContext();
  const [activeChat, setActiveChat] = useState<ActiveChat | null>(null);
  const [draftText, setDraftText] = useState("");
  const [showDirectPicker, setShowDirectPicker] = useState(false);
  const [showCreateGroupForm, setShowCreateGroupForm] = useState(false);
  const [newConversationName, setNewConversationName] = useState("");
  const [newConversationTargetId, setNewConversationTargetId] = useState("all-club");
  const [newConversationMessage, setNewConversationMessage] = useState("");
  const [openMemberListGroupId, setOpenMemberListGroupId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState("Mesajlar merkezi TeamSync datasından yüklendi.");

  const chatGroups = appData?.chatGroups ?? EMPTY_CHAT_GROUPS;
  const chatMessages = appData?.chatMessages ?? EMPTY_CHAT_MESSAGES;
  const users = appData?.users ?? EMPTY_USERS;
  const currentUser = appData?.currentUser;

  const directUsers = useMemo(() => {
    if (currentUser === undefined) {
      return EMPTY_USERS;
    }

    return users.filter((user) => user.id !== currentUser.id && user.status !== "removed");
  }, [currentUser, users]);

  const targetOptions = useMemo<TargetOption[]>(() => {
    const allClubOption: TargetOption = {
      id: "all-club",
      label: "Tüm Kulüp",
    };

    if (appData === null) {
      return [allClubOption];
    }

    return [
      allClubOption,
      ...appData.teams.map((team) => ({
        id: team.id,
        label: team.name,
        teamId: team.id,
      })),
    ];
  }, [appData]);

  const activeGroup = useMemo(() => {
    if (activeChat === null || activeChat.type !== "group") {
      return undefined;
    }

    return chatGroups.find((group) => group.id === activeChat.groupId);
  }, [activeChat, chatGroups]);

  const activeDirectUser = useMemo(() => {
    if (activeChat === null || activeChat.type !== "direct") {
      return undefined;
    }

    return users.find((user) => user.id === activeChat.userId);
  }, [activeChat, users]);

  const visibleMessages = useMemo(() => {
    if (appData === null || activeChat === null) {
      return [];
    }

    if (activeChat.type === "group") {
      return chatMessages.filter((message) => message.groupId === activeChat.groupId);
    }

    return getDirectMessages(appData.currentUser.id, activeChat.userId, chatMessages);
  }, [activeChat, appData, chatMessages]);

  function clearCreateForm() {
    setNewConversationName("");
    setNewConversationTargetId("all-club");
    setNewConversationMessage("");
  }

  function openGroupChat(group: ChatGroup) {
    setActiveChat({ type: "group", groupId: group.id });
    setOpenMemberListGroupId(null);
    setDraftText("");
  }

  function openDirectChat(user: UserProfile) {
    setActiveChat({ type: "direct", userId: user.id });
    setOpenMemberListGroupId(null);
    setShowDirectPicker(false);
    setDraftText("");
    setStatusMessage(`${user.fullName} ile bireysel mesaj açıldı.`);
  }

  function closeChat() {
    setActiveChat(null);
    setOpenMemberListGroupId(null);
    setDraftText("");
  }

  async function createConversation() {
    if (appData === null) {
      setStatusMessage("Önce merkezi data yüklenmeli.");
      return;
    }

    const selectedTarget = targetOptions.find((target) => target.id === newConversationTargetId) ?? targetOptions[0];
    const activeUsers = appData.users.filter((user) => user.status !== "removed");
    const targetUsers = selectedTarget.teamId === undefined
      ? activeUsers
      : activeUsers.filter((user) => user.teamIds.includes(selectedTarget.teamId ?? ""));
    const visibleUserIds = Array.from(new Set([appData.currentUser.id, ...targetUsers.map((user) => user.id)]));

    if (visibleUserIds.length === 0) {
      setStatusMessage("Bu konuşma için kullanıcı bulunamadı.");
      return;
    }

    try {
      const groupName = newConversationName.trim() || `${selectedTarget.label} Mesajları`;
      const nextAppDataWithGroup = await teamSyncService.createChatGroup({
        clubId: appData.club.id,
        teamId: selectedTarget.teamId,
        name: groupName,
        visibleUserIds,
      });

      const createdGroup = nextAppDataWithGroup.chatGroups[0];
      const firstMessageText = newConversationMessage.trim();

      if (firstMessageText.length > 0) {
        const nextAppDataWithMessage = await teamSyncService.createChatMessage({
          clubId: appData.club.id,
          groupId: createdGroup.id,
          senderUserId: appData.currentUser.id,
          text: firstMessageText,
        });

        setAppData(nextAppDataWithMessage);
      } else {
        setAppData(nextAppDataWithGroup);
      }

      setActiveChat({ type: "group", groupId: createdGroup.id });
      clearCreateForm();
      setShowCreateGroupForm(false);
      setStatusMessage("Yeni grup konuşması oluşturuldu.");
    } catch {
      setStatusMessage("Yeni grup oluşturulurken bir sorun oluştu.");
    }
  }

  async function sendMessage() {
    if (appData === null || activeChat === null) {
      return;
    }

    const trimmedText = draftText.trim();

    if (trimmedText.length === 0) {
      return;
    }

    try {
      const nextAppData = await teamSyncService.createChatMessage({
        clubId: appData.club.id,
        groupId: activeChat.type === "group" ? activeChat.groupId : undefined,
        directUserIds: activeChat.type === "direct" ? [appData.currentUser.id, activeChat.userId] : undefined,
        senderUserId: appData.currentUser.id,
        text: trimmedText,
      });

      setAppData(nextAppData);
      setDraftText("");
    } catch {
      setStatusMessage("Mesaj gönderilirken bir sorun oluştu.");
    }
  }

  if (activeChat !== null && appData !== null) {
    const isGroupChat = activeChat.type === "group";
    const chatTitle = isGroupChat ? activeGroup?.name : activeDirectUser?.fullName;
    const chatSubtitle = isGroupChat && activeGroup !== undefined
      ? `${getGroupMembers(activeGroup, users).length} üye · ${getGroupTeamName(activeGroup, appData)}`
      : activeDirectUser?.email ?? "Bireysel mesaj";

    if (chatTitle !== undefined) {
      return (
        <KeyboardAvoidingView style={styles.chatScreen} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View style={styles.chatHeaderWrapper}>
            <Pressable onPress={closeChat} style={({ pressed }) => [styles.backButton, pressed ? styles.pressed : null]}>
              <Text style={styles.backButtonText}>‹</Text>
            </Pressable>

            <View style={styles.chatTitleArea}>
              <Text style={styles.chatTitle} numberOfLines={1}>{chatTitle}</Text>
              {isGroupChat && activeGroup !== undefined ? (
                <Pressable onPress={() => setOpenMemberListGroupId(activeGroup.id)}>
                  <Text style={styles.chatSubtitleLink}>{chatSubtitle} · listeyi gör</Text>
                </Pressable>
              ) : (
                <Text style={styles.chatSubtitle}>{chatSubtitle}</Text>
              )}
            </View>
          </View>

          {isGroupChat && activeGroup !== undefined && openMemberListGroupId === activeGroup.id ? (
            <View style={styles.chatMemberBubbleWrapper}>
              <GroupMemberBubble
                title={`${activeGroup.name} üyeleri`}
                members={toGroupMembers(activeGroup, appData)}
                onClose={() => setOpenMemberListGroupId(null)}
                onQuickMessage={() => setOpenMemberListGroupId(null)}
              />
            </View>
          ) : null}

          <ScrollView style={styles.messagesScroll} contentContainerStyle={styles.messagesContent}>
            {visibleMessages.length > 0 ? (
              visibleMessages.map((message) => {
                const isMyMessage = message.senderUserId === appData.currentUser.id;

                return (
                  <View key={message.id} style={[styles.messageBubble, isMyMessage ? styles.myMessageBubble : styles.otherMessageBubble]}>
                    <View style={styles.messageTopRow}>
                      <Text style={styles.messageSender}>{getSenderName(message.senderUserId, users)}</Text>
                      <Text style={styles.messageTime}>{formatMessageTime(message.createdAt)}</Text>
                    </View>
                    <Text style={styles.messageText}>{message.text}</Text>
                  </View>
                );
              })
            ) : (
              <EmptyState title="Henüz mesaj yok" description="Bu konuşmada ilk mesajı sen gönderebilirsin." />
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
  }

  return (
    <AppScreenLayout>
      <PageHeader title="Mesajlar" subtitle="Bireysel mesajlar ve grup konuşmaları." />

      <Card style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionHeaderText}>
            <Text style={styles.sectionTitle}>Bireysel mesajlar</Text>
            <Text style={styles.sectionSubtitle}>Yeni mesaj oluştur veya mevcut kişiye mesaj aç.</Text>
          </View>

          <AppButton
            title={showDirectPicker ? "Kapat" : "Yeni mesaj oluştur"}
            variant="secondary"
            onPress={() => {
              setShowDirectPicker((currentValue) => !currentValue);
              setStatusMessage("Bireysel mesaj için kişi seçebilirsin.");
            }}
            style={styles.smallActionButton}
          />
        </View>

        {showDirectPicker ? (
          <Card variant="subtle" style={styles.inlineCreateBox}>
            <Text style={styles.inlineCreateTitle}>Kişi seç</Text>
            <Text style={styles.inlineCreateSubtitle}>Bireysel mesaj başlatmak için aşağıdaki kişilerden birini seç.</Text>
          </Card>
        ) : null}

        {appData !== null && directUsers.length > 0 ? (
          <View style={styles.directList}>
            {directUsers.map((user) => {
              const lastMessage = getLastDirectMessage(appData.currentUser.id, user.id, chatMessages);

              return (
                <Card key={user.id} padding="none" style={styles.directCard}>
                  <Pressable onPress={() => openDirectChat(user)} style={({ pressed }) => [styles.directMainArea, pressed ? styles.pressed : null]}>
                    <View style={styles.directAvatar}>
                      <Text style={styles.directAvatarText}>{getInitials(user.fullName)}</Text>
                    </View>
                    <View style={styles.directInfo}>
                      <Text style={styles.directName}>{user.fullName}</Text>
                      <Text style={styles.directMeta}>{user.email}</Text>
                      <Text style={styles.lastMessage} numberOfLines={1}>
                        {lastMessage ? `${getSenderName(lastMessage.senderUserId, users)}: ${lastMessage.text}` : "Henüz bireysel mesaj yok."}
                      </Text>
                    </View>
                  </Pressable>

                  <Pressable onPress={() => openDirectChat(user)} style={({ pressed }) => [styles.openMessageButton, pressed ? styles.pressed : null]}>
                    <Text style={styles.openMessageButtonText}>Mesaj aç</Text>
                  </Pressable>
                </Card>
              );
            })}
          </View>
        ) : (
          <EmptyState title="Bireysel mesaj için kişi yok" description="Üyeler onaylandığında burada listelenecek." />
        )}
      </Card>

      <Card style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionHeaderText}>
            <Text style={styles.sectionTitle}>Grup konuşmaları</Text>
            <Text style={styles.sectionSubtitle}>{statusMessage}</Text>
          </View>

          <AppButton
            title={showCreateGroupForm ? "Kapat" : "Yeni grup oluştur"}
            variant="secondary"
            onPress={() => {
              setShowCreateGroupForm((currentValue) => !currentValue);
              setStatusMessage("Yeni grup konuşmasını bu bölümde oluşturabilirsin.");
            }}
            style={styles.smallActionButton}
          />
        </View>

        {showCreateGroupForm ? (
          <Card variant="subtle" style={styles.inlineCreateBox}>
            <Text style={styles.inlineCreateTitle}>Yeni grup oluştur</Text>
            <Text style={styles.inlineCreateSubtitle}>Kulüp veya takım için yeni bir grup konuşması başlat.</Text>

            <TextField
              label="Konuşma adı"
              value={newConversationName}
              onChangeText={setNewConversationName}
              placeholder="Örn. Maç hazırlığı"
              containerStyle={styles.field}
            />

            <Text style={styles.label}>Kime gönderilecek?</Text>
            <View style={styles.targetGrid}>
              {targetOptions.map((target) => {
                const isSelected = newConversationTargetId === target.id;

                return (
                  <Pressable
                    key={target.id}
                    onPress={() => setNewConversationTargetId(target.id)}
                    style={({ pressed }) => [
                      styles.targetButton,
                      isSelected ? styles.targetButtonSelected : null,
                      pressed ? styles.pressed : null,
                    ]}
                  >
                    <Text style={[styles.targetButtonText, isSelected ? styles.targetButtonTextSelected : null]}>{target.label}</Text>
                  </Pressable>
                );
              })}
            </View>

            <TextField
              label="İlk mesaj"
              value={newConversationMessage}
              onChangeText={setNewConversationMessage}
              placeholder="Mesajını yaz..."
              multiline
              containerStyle={styles.field}
            />

            <View style={styles.formActions}>
              <AppButton title="Grubu oluştur" onPress={createConversation} style={styles.actionButton} />
              <AppButton
                title="Vazgeç"
                variant="ghost"
                onPress={() => {
                  clearCreateForm();
                  setShowCreateGroupForm(false);
                  setStatusMessage("Yeni grup oluşturma iptal edildi.");
                }}
                style={styles.actionButton}
              />
            </View>
          </Card>
        ) : null}

        {appData !== null && chatGroups.length > 0 ? (
          chatGroups.map((group) => {
            const lastMessage = getLastGroupMessage(group.id, chatMessages);
            const isMemberListOpen = openMemberListGroupId === group.id;
            const members = toGroupMembers(group, appData);
            const teamName = getGroupTeamName(group, appData);

            return (
              <View key={group.id} style={styles.groupWrapper}>
                <Card padding="none" style={styles.groupCard}>
                  <Pressable onPress={() => openGroupChat(group)} style={({ pressed }) => [styles.groupMainArea, pressed ? styles.pressed : null]}>
                    <View style={styles.groupAvatar}>
                      <Text style={styles.groupAvatarText}>{getInitials(group.name)}</Text>
                    </View>

                    <View style={styles.groupInfo}>
                      <View style={styles.groupTopRow}>
                        <Text style={styles.groupTitle}>{group.name}</Text>
                        <Text style={styles.groupArrow}>›</Text>
                      </View>
                      <Text style={styles.groupDescription}>{teamName}</Text>
                      <Text style={styles.lastMessage} numberOfLines={1}>
                        {lastMessage ? `${getSenderName(lastMessage.senderUserId, users)}: ${lastMessage.text}` : "Henüz mesaj yok."}
                      </Text>
                    </View>
                  </Pressable>

                  <Pressable
                    onPress={() => setOpenMemberListGroupId(isMemberListOpen ? null : group.id)}
                    style={({ pressed }) => [styles.memberCountButton, pressed ? styles.pressed : null]}
                  >
                    <Text style={styles.memberCountText}>{members.length} üye</Text>
                    <Text style={styles.memberCountHint}>Listeyi gör</Text>
                  </Pressable>
                </Card>

                {isMemberListOpen ? (
                  <GroupMemberBubble
                    title={`${group.name} üyeleri`}
                    members={members}
                    onClose={() => setOpenMemberListGroupId(null)}
                    onQuickMessage={() => setOpenMemberListGroupId(null)}
                  />
                ) : null}
              </View>
            );
          })
        ) : (
          <EmptyState title="Henüz grup konuşması yok" description="Yeni grup oluştur butonuyla kulüp veya takım konuşması başlatabilirsin." />
        )}
      </Card>
    </AppScreenLayout>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background.app },
  section: { marginBottom: theme.spacing["2xl"] },
  sectionHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: theme.spacing.lg, marginBottom: theme.spacing.xl },
  sectionHeaderText: { flex: 1 },
  sectionTitle: { color: theme.colors.text.primary, fontSize: theme.fontSizes["2xl"], fontWeight: theme.fontWeights.semibold, marginBottom: theme.spacing.sm },
  sectionSubtitle: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.md, fontWeight: theme.fontWeights.regular, lineHeight: theme.lineHeights.md },
  smallActionButton: { alignSelf: "flex-start" },
  label: { color: theme.colors.text.primary, fontSize: theme.fontSizes.md, fontWeight: theme.fontWeights.semibold, marginBottom: theme.spacing.sm },
  field: { marginBottom: theme.spacing.lg },
  inlineCreateBox: { marginBottom: theme.spacing.xl },
  inlineCreateTitle: { color: theme.colors.text.primary, fontSize: theme.fontSizes.lg, fontWeight: theme.fontWeights.semibold, marginBottom: theme.spacing.xs },
  inlineCreateSubtitle: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.md, fontWeight: theme.fontWeights.regular, lineHeight: theme.lineHeights.md, marginBottom: theme.spacing.lg },
  targetGrid: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm, marginBottom: theme.spacing.xl },
  targetButton: { borderRadius: theme.radius.full, borderWidth: 1, borderColor: theme.colors.border.default, paddingVertical: theme.spacing.sm, paddingHorizontal: theme.spacing.lg, backgroundColor: theme.colors.background.surface },
  targetButtonSelected: { backgroundColor: theme.colors.brand.primary, borderColor: theme.colors.brand.primary },
  targetButtonText: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.semibold },
  targetButtonTextSelected: { color: theme.colors.text.inverse },
  formActions: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.md, marginTop: theme.spacing.sm },
  actionButton: { flexGrow: 1, minWidth: 150 },
  directList: { gap: theme.spacing.md },
  directCard: { flexDirection: "row", alignItems: "stretch", overflow: "hidden" },
  directMainArea: { flex: 1, flexDirection: "row", alignItems: "center", gap: theme.spacing.md, padding: theme.spacing.lg },
  directAvatar: { width: 48, height: 48, borderRadius: theme.radius.full, backgroundColor: theme.colors.brand.secondary, alignItems: "center", justifyContent: "center" },
  directAvatarText: { color: theme.colors.text.inverse, fontSize: theme.fontSizes.md, fontWeight: theme.fontWeights.semibold },
  directInfo: { flex: 1 },
  directName: { color: theme.colors.text.primary, fontSize: theme.fontSizes.lg, fontWeight: theme.fontWeights.semibold, marginBottom: theme.spacing.xs },
  directMeta: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.regular },
  openMessageButton: { minWidth: 104, alignItems: "center", justifyContent: "center", paddingHorizontal: theme.spacing.md, borderLeftWidth: 1, borderLeftColor: theme.colors.border.default, backgroundColor: theme.colors.background.subtle },
  openMessageButtonText: { color: theme.colors.text.brand, fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.semibold },
  groupWrapper: { marginBottom: theme.spacing.md },
  groupCard: { flexDirection: "row", overflow: "hidden" },
  groupMainArea: { flex: 1, flexDirection: "row", alignItems: "center", gap: theme.spacing.md, padding: theme.spacing.lg },
  groupAvatar: { width: 48, height: 48, borderRadius: theme.radius.full, backgroundColor: theme.colors.brand.primary, alignItems: "center", justifyContent: "center" },
  groupAvatarText: { color: theme.colors.text.inverse, fontSize: theme.fontSizes.md, fontWeight: theme.fontWeights.semibold },
  groupInfo: { flex: 1 },
  groupTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: theme.spacing.md },
  groupTitle: { color: theme.colors.text.primary, fontSize: theme.fontSizes.lg, fontWeight: theme.fontWeights.semibold },
  groupArrow: { color: theme.colors.text.secondary, fontSize: theme.fontSizes["2xl"], fontWeight: theme.fontWeights.semibold },
  groupDescription: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.regular, marginTop: theme.spacing.xs },
  lastMessage: { color: theme.colors.text.muted, fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.regular, marginTop: theme.spacing.xs },
  memberCountButton: { minWidth: 112, alignItems: "center", justifyContent: "center", paddingHorizontal: theme.spacing.md, borderLeftWidth: 1, borderLeftColor: theme.colors.border.default, backgroundColor: theme.colors.background.subtle },
  memberCountText: { color: theme.colors.text.brand, fontSize: theme.fontSizes.md, fontWeight: theme.fontWeights.semibold },
  memberCountHint: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.xs, fontWeight: theme.fontWeights.medium, marginTop: 2 },
  chatScreen: { flex: 1, backgroundColor: theme.colors.background.app },
  chatHeaderWrapper: { flexDirection: "row", alignItems: "center", gap: theme.spacing.md, paddingHorizontal: theme.spacing["2xl"], paddingTop: theme.spacing["2xl"], paddingBottom: theme.spacing.lg, backgroundColor: theme.colors.background.app },
  backButton: { width: 44, height: 44, borderRadius: theme.radius.full, backgroundColor: theme.colors.background.surface, alignItems: "center", justifyContent: "center" },
  backButtonText: { color: theme.colors.text.primary, fontSize: 34, fontWeight: theme.fontWeights.semibold, lineHeight: 36 },
  chatTitleArea: { flex: 1 },
  chatTitle: { color: theme.colors.text.inverse, fontSize: theme.fontSizes["2xl"], fontWeight: theme.fontWeights.semibold },
  chatSubtitle: { color: theme.colors.text.inverse, opacity: 0.72, fontSize: theme.fontSizes.md, fontWeight: theme.fontWeights.regular, marginTop: theme.spacing.xs },
  chatSubtitleLink: { color: theme.colors.brand.primary, fontSize: theme.fontSizes.md, fontWeight: theme.fontWeights.semibold, marginTop: theme.spacing.xs },
  chatMemberBubbleWrapper: { paddingHorizontal: theme.spacing["2xl"] },
  messagesScroll: { flex: 1 },
  messagesContent: { paddingHorizontal: theme.spacing["2xl"], paddingBottom: theme.spacing["2xl"], gap: theme.spacing.md },
  messageBubble: { maxWidth: "82%", borderRadius: theme.radius.xl, padding: theme.spacing.lg, borderWidth: 1, borderColor: theme.colors.border.default },
  myMessageBubble: { alignSelf: "flex-end", backgroundColor: theme.colors.brand.primarySoft },
  otherMessageBubble: { alignSelf: "flex-start", backgroundColor: theme.colors.background.surface },
  messageTopRow: { flexDirection: "row", justifyContent: "space-between", gap: theme.spacing.md, marginBottom: theme.spacing.xs },
  messageSender: { color: theme.colors.text.primary, fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.semibold },
  messageTime: { color: theme.colors.text.muted, fontSize: theme.fontSizes.xs, fontWeight: theme.fontWeights.medium },
  messageText: { color: theme.colors.text.primary, fontSize: theme.fontSizes.md, fontWeight: theme.fontWeights.regular, lineHeight: theme.lineHeights.lg },
  composer: { flexDirection: "row", alignItems: "flex-end", gap: theme.spacing.md, padding: theme.spacing.lg, backgroundColor: theme.colors.background.surface, borderTopWidth: 1, borderTopColor: theme.colors.border.default },
  composerInput: { flex: 1, minHeight: 46, maxHeight: 120, borderRadius: theme.radius.xl, backgroundColor: theme.colors.background.subtle, borderWidth: 1, borderColor: theme.colors.border.default, paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md, color: theme.colors.text.primary, fontSize: theme.fontSizes.md, fontWeight: theme.fontWeights.regular },
  sendButton: { width: 46, height: 46, borderRadius: theme.radius.full, backgroundColor: theme.colors.brand.primary, alignItems: "center", justifyContent: "center" },
  sendButtonText: { color: theme.colors.text.inverse, fontSize: theme.fontSizes.lg, fontWeight: theme.fontWeights.semibold },
  pressed: { opacity: 0.84, transform: [{ scale: 0.99 }] },
});
