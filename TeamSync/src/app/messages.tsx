import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
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
import { SearchField } from "@/components/SearchField";
import { TextField } from "@/components/TextField";
import { theme } from "@/constants/theme";
import { useTranslation } from "@/localization";
import { useAppDataContext } from "@/providers/AppDataProvider";
import { authService } from "@/services/authService";
import { firestoreMaviTeamDataService } from "@/services/firestoreMaviTeamDataService";
import { teamSyncService } from "@/services/teamSyncService";
import type { ChatGroup, ChatMessage, TeamSyncAppData, UserProfile } from "@/types/teamSync";
import { matchesSearchQuery } from "@/utils/search";

type ActiveChat = { type: "group"; groupId: string } | { type: "direct"; userId: string };

type TargetOption = {
  id: string;
  label: string;
  teamId?: string;
};

const EMPTY_CHAT_GROUPS: ChatGroup[] = [];
const EMPTY_CHAT_MESSAGES: ChatMessage[] = [];
const EMPTY_USERS: UserProfile[] = [];

function formatMessageTime(createdAt: string, locale: string) {
  const date = new Date(createdAt);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
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

function getSenderName(userId: string, users: UserProfile[], unknownUserLabel: string) {
  return users.find((user) => user.id === userId)?.fullName ?? unknownUserLabel;
}

function getGroupTeamName(group: ChatGroup, appData: TeamSyncAppData, allClubLabel: string, teamNotFoundLabel: string) {
  if (group.teamId === undefined) {
    return allClubLabel;
  }

  return appData.teams.find((team) => team.id === group.teamId)?.name ?? teamNotFoundLabel;
}

function getGroupMembers(group: ChatGroup, users: UserProfile[]) {
  return users.filter((user) => group.visibleUserIds.includes(user.id) && user.status !== "removed");
}

function toGroupMembers(group: ChatGroup, appData: TeamSyncAppData, allClubLabel: string, teamNotFoundLabel: string): GroupMember[] {
  const teamName = getGroupTeamName(group, appData, allClubLabel, teamNotFoundLabel);

  return getGroupMembers(group, appData.users).map((user) => ({
    id: user.id,
    name: user.fullName,
    role: "",
    teamName,
  }));
}

function getCopy(language: "tr" | "en") {
  const en = language === "en";

  return {
    pageTitle: en ? "Messages" : "Mesajlar",
    pageSubtitle: en ? "Direct messages and group conversations." : "Bireysel mesajlar ve grup konuşmaları.",
    unknownUser: en ? "Unknown user" : "Bilinmeyen kullanıcı",
    allClub: en ? "Whole Club" : "Tüm Kulüp",
    teamNotFound: en ? "Team not found" : "Takım bulunamadı",
    messagesUpdated: en ? "Messages updated." : "Mesajlar güncellendi.",
    directChatOpened: (name: string) => (en ? `Direct message with ${name} opened.` : `${name} ile bireysel mesaj açıldı.`),
    waitForPageLoad: en ? "Please wait for the page to finish loading." : "Sayfanın yüklenmesini bekle.",
    noUsersForConversation: en ? "No users found for this conversation." : "Bu konuşma için kullanıcı bulunamadı.",
    defaultGroupNameSuffix: en ? "Messages" : "Mesajları",
    groupCreated: en ? "New group conversation created." : "Yeni grup konuşması oluşturuldu.",
    groupCreateError: en ? "There was a problem creating the new group." : "Yeni grup oluşturulurken bir sorun oluştu.",
    sendMessageError: en ? "There was a problem sending the message." : "Mesaj gönderilirken bir sorun oluştu.",
    membersCount: (count: number) => (en ? `${count} members` : `${count} üye`),
    viewList: en ? "view list" : "listeyi gör",
    groupMembersTitle: (name: string) => (en ? `${name} members` : `${name} üyeleri`),
    directMessageFallback: en ? "Direct message" : "Bireysel mesaj",
    noMessagesTitle: en ? "No messages yet" : "Henüz mesaj yok",
    noMessagesDescription: en
      ? "You can send the first message in this conversation."
      : "Bu konuşmada ilk mesajı sen gönderebilirsin.",
    messagePlaceholder: en ? "Write a message..." : "Mesaj yaz...",
    directSectionTitle: en ? "Direct messages" : "Bireysel mesajlar",
    directSectionSubtitle: en
      ? "Start a new message or open a chat with an existing contact."
      : "Yeni mesaj oluştur veya mevcut kişiye mesaj aç.",
    close: en ? "Close" : "Kapat",
    newMessage: en ? "New message" : "Yeni mesaj oluştur",
    pickContactStatus: en ? "Pick a contact for a direct message." : "Bireysel mesaj için kişi seçebilirsin.",
    pickContactTitle: en ? "Pick a contact" : "Kişi seç",
    pickContactSubtitle: en
      ? "Choose one of the contacts below to start a direct message."
      : "Bireysel mesaj başlatmak için aşağıdaki kişilerden birini seç.",
    searchNameOrEmail: en ? "Search by name or email..." : "İsim veya e-posta ara...",
    searchContactsLabel: en ? "Search contacts" : "Kişilerde ara",
    noMatchingContactsTitle: en ? "No matching contacts" : "Aramayla eşleşen kişi yok",
    noMatchingContactsDescription: en
      ? "Try again with a different name or email."
      : "Farklı bir isim veya e-posta ile tekrar dene.",
    noDirectMessagesYet: en ? "No direct messages yet." : "Henüz bireysel mesaj yok.",
    openMessage: en ? "Open message" : "Mesaj aç",
    noContactsTitle: en ? "No contacts for direct messages" : "Bireysel mesaj için kişi yok",
    noContactsDescription: en
      ? "Members will be listed here once approved."
      : "Üyeler onaylandığında burada listelenecek.",
    groupSectionTitle: en ? "Group conversations" : "Grup konuşmaları",
    newGroup: en ? "New group" : "Yeni grup oluştur",
    createGroupStatus: en
      ? "You can create a new group conversation in this section."
      : "Yeni grup konuşmasını bu bölümde oluşturabilirsin.",
    newGroupTitle: en ? "Create a new group" : "Yeni grup oluştur",
    newGroupSubtitle: en
      ? "Start a new group conversation for the club or a team."
      : "Kulüp veya takım için yeni bir grup konuşması başlat.",
    conversationNameLabel: en ? "Conversation name" : "Konuşma adı",
    conversationNamePlaceholder: en ? "E.g. Match preparation" : "Örn. Maç hazırlığı",
    recipientLabel: en ? "Send to" : "Kime gönderilecek?",
    firstMessageLabel: en ? "First message" : "İlk mesaj",
    firstMessagePlaceholder: en ? "Write your message..." : "Mesajını yaz...",
    createGroup: en ? "Create group" : "Grubu oluştur",
    cancel: en ? "Cancel" : "Vazgeç",
    groupCreateCanceled: en ? "New group creation canceled." : "Yeni grup oluşturma iptal edildi.",
    searchGroupOrTeam: en ? "Search group or team..." : "Grup veya takım ara...",
    searchGroupsLabel: en ? "Search group conversations" : "Grup konuşmalarında ara",
    noMessagesInGroupYet: en ? "No messages yet." : "Henüz mesaj yok.",
    viewListHint: en ? "View list" : "Listeyi gör",
    noMatchingGroupsTitle: en ? "No matching groups" : "Aramayla eşleşen grup yok",
    noMatchingGroupsDescription: en ? "Try again with a different name." : "Farklı bir isim ile tekrar dene.",
    noGroupsYetTitle: en ? "No group conversations yet" : "Henüz grup konuşması yok",
    noGroupsYetDescriptionCanCreate: en
      ? "Use the New group button to start a club-wide or team conversation."
      : "Yeni grup oluştur butonuyla kulüp veya takım konuşması başlatabilirsin.",
    noGroupsYetDescriptionReadonly: en
      ? "It will appear here once a group conversation is started."
      : "Bir grup konuşması başlatıldığında burada görünecek.",
  };
}

export default function MessagesScreen() {
  const { language } = useTranslation();
  const copy = useMemo(() => getCopy(language), [language]);
  const locale = language === "tr" ? "tr-TR" : "en-US";
  const { appData, setAppData } = useAppDataContext();
  const [firestoreChatMessages, setFirestoreChatMessages] = useState<ChatMessage[] | null>(null);
  const [activeChat, setActiveChat] = useState<ActiveChat | null>(null);
  const [draftText, setDraftText] = useState("");
  const [showDirectPicker, setShowDirectPicker] = useState(false);
  const [showCreateGroupForm, setShowCreateGroupForm] = useState(false);
  const [newConversationName, setNewConversationName] = useState("");
  const [newConversationTargetId, setNewConversationTargetId] = useState("all-club");
  const [newConversationMessage, setNewConversationMessage] = useState("");
  const [openMemberListGroupId, setOpenMemberListGroupId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState(copy.messagesUpdated);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const [directSearchQuery, setDirectSearchQuery] = useState("");
  const [groupSearchQuery, setGroupSearchQuery] = useState("");

  useEffect(() => {
    if (!authService.isConfigured()) return;
    const firebaseUser = authService.getCurrentUser();
    if (firebaseUser === null) return;

    const unsubscribe = firestoreMaviTeamDataService.subscribeToVisibleChatMessagesForCurrentUser(
      firebaseUser,
      (messages) => {
        setFirestoreChatMessages(messages);
      },
      (error) => {
        console.warn("[messages] Realtime chat subscription error:", error);
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  const chatGroups = appData?.chatGroups ?? EMPTY_CHAT_GROUPS;
  const chatMessages = firestoreChatMessages ?? appData?.chatMessages ?? EMPTY_CHAT_MESSAGES;
  const users = appData?.users ?? EMPTY_USERS;
  const currentUser = appData?.currentUser;

  const directUsers = useMemo(() => {
    if (currentUser === undefined) {
      return EMPTY_USERS;
    }

    return users.filter((user) => user.id !== currentUser.id && user.status !== "removed");
  }, [currentUser, users]);

  const filteredDirectUsers = useMemo(() => {
    return directUsers.filter((user) => matchesSearchQuery(directSearchQuery, user.fullName, user.email));
  }, [directUsers, directSearchQuery]);

  const filteredChatGroups = useMemo(() => {
    if (appData === null) {
      return chatGroups;
    }

    return chatGroups.filter((group) => matchesSearchQuery(groupSearchQuery, group.name, getGroupTeamName(group, appData, copy.allClub, copy.teamNotFound)));
  }, [appData, chatGroups, groupSearchQuery, copy]);

  const canCreateGroups = currentUser?.role === "clubAdmin" || currentUser?.role === "coach";

  const targetOptions = useMemo<TargetOption[]>(() => {
    const allClubOption: TargetOption = {
      id: "all-club",
      label: copy.allClub,
    };

    if (appData === null) {
      return [allClubOption];
    }

    // A coach can only start a group for a team they actually coach (not
    // club-wide, not another coach's team) -- matches
    // canCreateOrUpdateChatGroupData in firestore.rules, which would reject
    // anything else. clubAdmin keeps every option, including club-wide.
    if (appData.currentUser.role === "coach") {
      return appData.teams
        .filter((team) => team.coachIds.includes(appData.currentUser.id))
        .map((team) => ({ id: team.id, label: team.name, teamId: team.id }));
    }

    return [
      allClubOption,
      ...appData.teams.map((team) => ({
        id: team.id,
        label: team.name,
        teamId: team.id,
      })),
    ];
  }, [appData, copy]);

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

  const messagesScrollRef = useRef<ScrollView>(null);

  const visibleMessages = useMemo(() => {
    if (appData === null || activeChat === null) {
      return [];
    }

    if (activeChat.type === "group") {
      return chatMessages.filter((message) => message.groupId === activeChat.groupId);
    }

    return getDirectMessages(appData.currentUser.id, activeChat.userId, chatMessages);
  }, [activeChat, appData, chatMessages]);

  useEffect(() => {
    if (activeChat !== null && visibleMessages.length > 0) {
      setTimeout(() => {
        messagesScrollRef.current?.scrollToEnd({ animated: true });
      }, 80);
    }
  }, [activeChat, visibleMessages.length]);

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
    setStatusMessage(copy.directChatOpened(user.fullName));
  }

  function closeChat() {
    setActiveChat(null);
    setOpenMemberListGroupId(null);
    setDraftText("");
  }

  async function createConversation() {
    if (isCreatingConversation) {
      return;
    }

    if (appData === null) {
      setStatusMessage(copy.waitForPageLoad);
      return;
    }

    const selectedTarget = targetOptions.find((target) => target.id === newConversationTargetId) ?? targetOptions[0];
    const activeUsers = appData.users.filter((user) => user.status !== "removed");
    const targetUsers = selectedTarget.teamId === undefined
      ? activeUsers
      : activeUsers.filter((user) => user.teamIds.includes(selectedTarget.teamId ?? ""));
    const visibleUserIds = Array.from(new Set([appData.currentUser.id, ...targetUsers.map((user) => user.id)]));

    if (visibleUserIds.length === 0) {
      setStatusMessage(copy.noUsersForConversation);
      return;
    }

    setIsCreatingConversation(true);

    try {
      const groupName = newConversationName.trim() || `${selectedTarget.label} ${copy.defaultGroupNameSuffix}`;
      const { nextAppData: nextAppDataWithGroup, group: createdGroup } = await teamSyncService.createChatGroupDirect(appData, {
        clubId: appData.club.id,
        teamId: selectedTarget.teamId,
        name: groupName,
        visibleUserIds,
      });

      const firstMessageText = newConversationMessage.trim();

      if (firstMessageText.length > 0) {
        const { nextAppData: nextAppDataWithMessage } = await teamSyncService.createChatMessageDirect(nextAppDataWithGroup, {
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
      setStatusMessage(copy.groupCreated);
    } catch {
      setStatusMessage(copy.groupCreateError);
    } finally {
      setIsCreatingConversation(false);
    }
  }

  async function sendMessage() {
    if (appData === null || activeChat === null || isSendingMessage) {
      return;
    }

    const trimmedText = draftText.trim();

    if (trimmedText.length === 0) {
      return;
    }

    setDraftText("");
    setIsSendingMessage(true);

    try {
      const { nextAppData } = await teamSyncService.createChatMessageDirect(appData, {
        clubId: appData.club.id,
        groupId: activeChat.type === "group" ? activeChat.groupId : undefined,
        directUserIds: activeChat.type === "direct" ? [appData.currentUser.id, activeChat.userId] : undefined,
        senderUserId: appData.currentUser.id,
        text: trimmedText,
      });

      setAppData(nextAppData);
    } catch {
      setDraftText(trimmedText);
      setStatusMessage(copy.sendMessageError);
    } finally {
      setIsSendingMessage(false);
    }
  }

  if (activeChat !== null && appData !== null) {
    const isGroupChat = activeChat.type === "group";
    const chatTitle = isGroupChat ? activeGroup?.name : activeDirectUser?.fullName;
    const chatSubtitle = isGroupChat && activeGroup !== undefined
      ? `${copy.membersCount(getGroupMembers(activeGroup, users).length)} · ${getGroupTeamName(activeGroup, appData, copy.allClub, copy.teamNotFound)}`
      : activeDirectUser?.email ?? copy.directMessageFallback;

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
                  <Text style={styles.chatSubtitleLink}>{chatSubtitle} · {copy.viewList}</Text>
                </Pressable>
              ) : (
                <Text style={styles.chatSubtitle}>{chatSubtitle}</Text>
              )}
            </View>
          </View>

          {isGroupChat && activeGroup !== undefined && openMemberListGroupId === activeGroup.id ? (
            <View style={styles.chatMemberBubbleWrapper}>
              <GroupMemberBubble
                title={copy.groupMembersTitle(activeGroup.name)}
                members={toGroupMembers(activeGroup, appData, copy.allClub, copy.teamNotFound)}
                onClose={() => setOpenMemberListGroupId(null)}
                onQuickMessage={() => setOpenMemberListGroupId(null)}
              />
            </View>
          ) : null}

          <ScrollView
            ref={messagesScrollRef}
            style={styles.messagesScroll}
            contentContainerStyle={styles.messagesContent}
            keyboardShouldPersistTaps="handled"
          >
            {visibleMessages.length > 0 ? (
              visibleMessages.map((message) => {
                const isMyMessage = message.senderUserId === appData.currentUser.id;

                return (
                  <View key={message.id} style={[styles.messageBubble, isMyMessage ? styles.myMessageBubble : styles.otherMessageBubble]}>
                    <View style={styles.messageTopRow}>
                      <Text style={styles.messageSender}>{getSenderName(message.senderUserId, users, copy.unknownUser)}</Text>
                      <Text style={styles.messageTime}>{formatMessageTime(message.createdAt, locale)}</Text>
                    </View>
                    <Text style={styles.messageText}>{message.text}</Text>
                  </View>
                );
              })
            ) : (
              <EmptyState title={copy.noMessagesTitle} description={copy.noMessagesDescription} />
            )}
          </ScrollView>

          <View style={styles.composer}>
            <TextInput
              value={draftText}
              onChangeText={setDraftText}
              placeholder={copy.messagePlaceholder}
              placeholderTextColor={theme.colors.text.muted}
              multiline
              style={styles.composerInput}
            />
            <Pressable
              onPress={sendMessage}
              disabled={isSendingMessage}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={({ pressed }) => [
                styles.sendButton,
                pressed && !isSendingMessage ? styles.pressed : null,
                isSendingMessage ? styles.sendButtonDisabled : null,
              ]}
            >
              {isSendingMessage ? (
                <ActivityIndicator size="small" color={theme.colors.text.inverse} />
              ) : (
                <Text style={styles.sendButtonText}>➤</Text>
              )}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      );
    }
  }

  return (
    <AppScreenLayout>
      <PageHeader title={copy.pageTitle} subtitle={copy.pageSubtitle} />

      <Card style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionHeaderText}>
            <Text style={styles.sectionTitle}>{copy.directSectionTitle}</Text>
            <Text style={styles.sectionSubtitle}>{copy.directSectionSubtitle}</Text>
          </View>

          <AppButton
            title={showDirectPicker ? copy.close : copy.newMessage}
            variant="secondary"
            onPress={() => {
              setShowDirectPicker((currentValue) => !currentValue);
              setStatusMessage(copy.pickContactStatus);
            }}
            style={styles.smallActionButton}
          />
        </View>

        {showDirectPicker ? (
          <Card variant="subtle" style={styles.inlineCreateBox}>
            <Text style={styles.inlineCreateTitle}>{copy.pickContactTitle}</Text>
            <Text style={styles.inlineCreateSubtitle}>{copy.pickContactSubtitle}</Text>
          </Card>
        ) : null}

        {appData !== null && directUsers.length > 0 ? (
          <>
            {directUsers.length > 5 ? (
              <SearchField
                value={directSearchQuery}
                onChangeText={setDirectSearchQuery}
                placeholder={copy.searchNameOrEmail}
                accessibilityLabel={copy.searchContactsLabel}
                style={styles.directSearchField}
              />
            ) : null}

            {filteredDirectUsers.length === 0 ? (
              <EmptyState title={copy.noMatchingContactsTitle} description={copy.noMatchingContactsDescription} />
            ) : (
              <View style={styles.directList}>
                {filteredDirectUsers.map((user) => {
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
                            {lastMessage ? `${getSenderName(lastMessage.senderUserId, users, copy.unknownUser)}: ${lastMessage.text}` : copy.noDirectMessagesYet}
                          </Text>
                        </View>
                      </Pressable>

                      <Pressable onPress={() => openDirectChat(user)} style={({ pressed }) => [styles.openMessageButton, pressed ? styles.pressed : null]}>
                        <Text style={styles.openMessageButtonText}>{copy.openMessage}</Text>
                      </Pressable>
                    </Card>
                  );
                })}
              </View>
            )}
          </>
        ) : (
          <EmptyState title={copy.noContactsTitle} description={copy.noContactsDescription} />
        )}
      </Card>

      <Card style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionHeaderText}>
            <Text style={styles.sectionTitle}>{copy.groupSectionTitle}</Text>
            <Text style={styles.sectionSubtitle}>{statusMessage}</Text>
          </View>

          {canCreateGroups ? (
            <AppButton
              title={showCreateGroupForm ? copy.close : copy.newGroup}
              variant="secondary"
              onPress={() => {
                setShowCreateGroupForm((currentValue) => !currentValue);
                setStatusMessage(copy.createGroupStatus);
              }}
              style={styles.smallActionButton}
            />
          ) : null}
        </View>

        {showCreateGroupForm && canCreateGroups ? (
          <Card variant="subtle" style={styles.inlineCreateBox}>
            <Text style={styles.inlineCreateTitle}>{copy.newGroupTitle}</Text>
            <Text style={styles.inlineCreateSubtitle}>{copy.newGroupSubtitle}</Text>

            <TextField
              label={copy.conversationNameLabel}
              value={newConversationName}
              onChangeText={setNewConversationName}
              placeholder={copy.conversationNamePlaceholder}
              containerStyle={styles.field}
            />

            <Text style={styles.label}>{copy.recipientLabel}</Text>
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
              label={copy.firstMessageLabel}
              value={newConversationMessage}
              onChangeText={setNewConversationMessage}
              placeholder={copy.firstMessagePlaceholder}
              multiline
              containerStyle={styles.field}
            />

            <View style={styles.formActions}>
              <AppButton
                title={copy.createGroup}
                onPress={createConversation}
                loading={isCreatingConversation}
                style={styles.actionButton}
              />
              <AppButton
                title={copy.cancel}
                variant="ghost"
                onPress={() => {
                  clearCreateForm();
                  setShowCreateGroupForm(false);
                  setStatusMessage(copy.groupCreateCanceled);
                }}
                disabled={isCreatingConversation}
                style={styles.actionButton}
              />
            </View>
          </Card>
        ) : null}

        {chatGroups.length > 5 ? (
          <SearchField
            value={groupSearchQuery}
            onChangeText={setGroupSearchQuery}
            placeholder={copy.searchGroupOrTeam}
            accessibilityLabel={copy.searchGroupsLabel}
            style={styles.groupSearchField}
          />
        ) : null}

        {appData !== null && filteredChatGroups.length > 0 ? (
          filteredChatGroups.map((group) => {
            const lastMessage = getLastGroupMessage(group.id, chatMessages);
            const isMemberListOpen = openMemberListGroupId === group.id;
            const members = toGroupMembers(group, appData, copy.allClub, copy.teamNotFound);
            const teamName = getGroupTeamName(group, appData, copy.allClub, copy.teamNotFound);

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
                        {lastMessage ? `${getSenderName(lastMessage.senderUserId, users, copy.unknownUser)}: ${lastMessage.text}` : copy.noMessagesInGroupYet}
                      </Text>
                    </View>
                  </Pressable>

                  <Pressable
                    onPress={() => setOpenMemberListGroupId(isMemberListOpen ? null : group.id)}
                    style={({ pressed }) => [styles.memberCountButton, pressed ? styles.pressed : null]}
                  >
                    <Text style={styles.memberCountText}>{copy.membersCount(members.length)}</Text>
                    <Text style={styles.memberCountHint}>{copy.viewListHint}</Text>
                  </Pressable>
                </Card>

                {isMemberListOpen ? (
                  <GroupMemberBubble
                    title={copy.groupMembersTitle(group.name)}
                    members={members}
                    onClose={() => setOpenMemberListGroupId(null)}
                    onQuickMessage={() => setOpenMemberListGroupId(null)}
                  />
                ) : null}
              </View>
            );
          })
        ) : chatGroups.length > 0 ? (
          <EmptyState title={copy.noMatchingGroupsTitle} description={copy.noMatchingGroupsDescription} />
        ) : (
          <EmptyState
            title={copy.noGroupsYetTitle}
            description={
              canCreateGroups
                ? copy.noGroupsYetDescriptionCanCreate
                : copy.noGroupsYetDescriptionReadonly
            }
          />
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
  targetButton: { borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border.default, paddingVertical: theme.spacing.sm, paddingHorizontal: theme.spacing.lg, backgroundColor: theme.colors.background.surface },
  targetButtonSelected: { backgroundColor: theme.colors.brand.primary, borderColor: theme.colors.brand.primary },
  targetButtonText: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.semibold },
  targetButtonTextSelected: { color: theme.colors.text.inverse },
  formActions: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.md, marginTop: theme.spacing.sm },
  actionButton: { flexGrow: 1, minWidth: 150 },
  directSearchField: { marginBottom: theme.spacing.lg },
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
  groupSearchField: { marginBottom: theme.spacing.md },
  groupWrapper: { marginBottom: theme.spacing.sm },
  groupCard: { flexDirection: "row", overflow: "hidden" },
  groupMainArea: { flex: 1, flexDirection: "row", alignItems: "center", gap: theme.spacing.md, padding: theme.spacing.md },
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
  sendButtonDisabled: { opacity: 0.7 },
  sendButtonText: { color: theme.colors.text.inverse, fontSize: theme.fontSizes.lg, fontWeight: theme.fontWeights.semibold },
  pressed: { opacity: 0.84, transform: [{ scale: 0.99 }] },
});
