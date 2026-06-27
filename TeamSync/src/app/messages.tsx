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

import { AppDrawer } from "@/components/AppDrawer";
import { AppHeader } from "@/components/AppHeader";
import { theme } from "@/constants/theme";

type ChatGroup = {
  id: string;
  name: string;
  teamName: string;
  description: string;
  memberCount: number;
};

type Contact = {
  id: string;
  name: string;
  role: string;
  teamName: string;
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
  | {
      type: "group";
      groupId: string;
    }
  | {
      type: "direct";
      contactId: string;
      conversationId: string;
    };

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

const contacts: Contact[] = [
  {
    id: "admin-mert",
    name: "Admin Mert",
    role: "Admin",
    teamName: "Kulüp Yönetimi",
  },
  {
    id: "coach-emre",
    name: "Coach Emre",
    role: "Coach",
    teamName: "U17 Erkek",
  },
  {
    id: "coach-aylin",
    name: "Coach Aylin",
    role: "Coach",
    teamName: "U14 Kız",
  },
  {
    id: "coach-daniel",
    name: "Coach Daniel",
    role: "Coach",
    teamName: "U18 Elite",
  },
  {
    id: "parent-ayse",
    name: "Ayşe Veli",
    role: "Parent",
    teamName: "U17 Erkek",
  },
  {
    id: "parent-mehmet",
    name: "Mehmet Veli",
    role: "Parent",
    teamName: "U14 Kız",
  },
  {
    id: "athlete-efe",
    name: "Efe Demir",
    role: "Athlete",
    teamName: "U17 Erkek",
  },
  {
    id: "athlete-zeynep",
    name: "Zeynep Kaya",
    role: "Athlete",
    teamName: "U14 Kız",
  },
];

function getDirectConversationId(contactId: string) {
  return `direct-${[CURRENT_USER_ID, contactId].sort().join("-")}`;
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
    conversationId: "team-u17-chat",
    senderName: "Admin Mert",
    senderRole: "Admin",
    text: "Salon girişinde kulüp kartlarınızı göstermeyi unutmayın.",
    createdAt: "2026-06-26T15:10:00.000Z",
  },
  {
    id: "3",
    conversationId: "team-u17-chat",
    senderName: "Mert Asma",
    senderRole: "Athlete",
    text: "Tamam coach, görüşürüz.",
    createdAt: "2026-06-26T16:05:00.000Z",
  },
  {
    id: "4",
    conversationId: "team-u14-chat",
    senderName: "Coach Aylin",
    senderRole: "Coach",
    text: "U14 için yarın servis çalışması yapacağız.",
    createdAt: "2026-06-26T17:20:00.000Z",
  },
  {
    id: "5",
    conversationId: "team-u18-chat",
    senderName: "Coach Daniel",
    senderRole: "Coach",
    text: "U18 Elite maç kadrosu akşam paylaşılacak.",
    createdAt: "2026-06-27T13:15:00.000Z",
  },
  {
    id: "6",
    conversationId: getDirectConversationId("coach-emre"),
    senderName: "Coach Emre",
    senderRole: "Coach",
    text: "Mert, bugün servis çalışmasına biraz erken gelmen iyi olur.",
    createdAt: "2026-06-27T14:00:00.000Z",
  },
];

function formatMessageTime(createdAt: string) {
  const date = new Date(createdAt);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getLastMessage(conversationId: string, messages: ChatMessage[]) {
  const conversationMessages = messages.filter(
    (message) => message.conversationId === conversationId
  );

  return conversationMessages[conversationMessages.length - 1];
}

function getContactInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);
}

export default function MessagesScreen() {
  const [activeChat, setActiveChat] = useState<ActiveChat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>(startingMessages);
  const [draftText, setDraftText] = useState("");
  const [drawerIsOpen, setDrawerIsOpen] = useState(false);
  const [newMessageIsOpen, setNewMessageIsOpen] = useState(false);
  const [contactSearchText, setContactSearchText] = useState("");

  const activeConversationId =
    activeChat?.type === "group"
      ? activeChat.groupId
      : activeChat?.type === "direct"
        ? activeChat.conversationId
        : undefined;

  const activeGroup = useMemo(() => {
    if (activeChat?.type !== "group") {
      return undefined;
    }

    return chatGroups.find((group) => group.id === activeChat.groupId);
  }, [activeChat]);

  const activeContact = useMemo(() => {
    if (activeChat?.type !== "direct") {
      return undefined;
    }

    return contacts.find((contact) => contact.id === activeChat.contactId);
  }, [activeChat]);

  const visibleMessages = useMemo(() => {
    if (activeConversationId === undefined) {
      return [];
    }

    return messages.filter(
      (message) => message.conversationId === activeConversationId
    );
  }, [activeConversationId, messages]);

  const filteredContacts = useMemo(() => {
    const searchValue = contactSearchText.trim().toLowerCase();

    if (searchValue.length === 0) {
      return contacts;
    }

    return contacts.filter((contact) => {
      return (
        contact.name.toLowerCase().includes(searchValue) ||
        contact.role.toLowerCase().includes(searchValue) ||
        contact.teamName.toLowerCase().includes(searchValue)
      );
    });
  }, [contactSearchText]);

  function openGroupChat(group: ChatGroup) {
    setActiveChat({
      type: "group",
      groupId: group.id,
    });
    setDraftText("");
    setNewMessageIsOpen(false);
    setContactSearchText("");
  }

  function openDirectChat(contact: Contact) {
    setActiveChat({
      type: "direct",
      contactId: contact.id,
      conversationId: getDirectConversationId(contact.id),
    });
    setDraftText("");
    setNewMessageIsOpen(false);
    setContactSearchText("");
  }

  function closeChat() {
    setActiveChat(null);
    setDraftText("");
  }

  function sendMessage() {
    const trimmedText = draftText.trim();

    if (activeConversationId === undefined || trimmedText.length === 0) {
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
    const chatTitle =
      activeChat.type === "group"
        ? `${activeGroup?.teamName ?? "Team"} Team Chat`
        : activeContact?.name ?? "Bireysel Mesaj";

    const chatSubtitle =
      activeChat.type === "group"
        ? `${activeGroup?.memberCount ?? 0} üye`
        : activeContact
          ? `${activeContact.role} · ${activeContact.teamName}`
          : "Bireysel mesaj";

    return (
      <KeyboardAvoidingView
        style={styles.chatScreen}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.chatHeaderWrapper}>
          <AppHeader
            title={chatTitle}
            subtitle={chatSubtitle}
            mode="back"
            onBackPress={closeChat}
          />
        </View>

        <ScrollView
          style={styles.messagesScroll}
          contentContainerStyle={styles.messagesContent}
        >
          {visibleMessages.length > 0 ? (
            visibleMessages.map((message) => {
              const isMyMessage = message.senderName === CURRENT_USER_NAME;

              return (
                <View
                  key={message.id}
                  style={[
                    styles.messageBubble,
                    isMyMessage
                      ? styles.myMessageBubble
                      : styles.otherMessageBubble,
                  ]}
                >
                  <View style={styles.messageTopRow}>
                    <Text style={styles.messageSender}>{message.senderName}</Text>
                    <Text style={styles.messageTime}>
                      {formatMessageTime(message.createdAt)}
                    </Text>
                  </View>

                  <Text style={styles.messageRole}>{message.senderRole}</Text>
                  <Text style={styles.messageText}>{message.text}</Text>
                </View>
              );
            })
          ) : (
            <View style={styles.emptyChatCard}>
              <Text style={styles.emptyChatTitle}>Henüz mesaj yok</Text>
              <Text style={styles.emptyChatText}>
                Bu konuşmada ilk mesajı sen gönderebilirsin.
              </Text>
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

          <Pressable
            onPress={sendMessage}
            style={({ pressed }) => [
              styles.sendButton,
              pressed ? styles.pressed : null,
            ]}
          >
            <Text style={styles.sendButtonText}>➤</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.screenContent}
      >
        <View style={styles.container}>
          <AppHeader
            title="Mesajlar"
            subtitle="Takım grupları ve bireysel mesajlar"
            mode="menu"
            onMenuPress={() => setDrawerIsOpen(true)}
          />

          <View style={styles.newMessageButtonRow}>
            <Pressable
              onPress={() =>
                setNewMessageIsOpen((currentValue) => !currentValue)
              }
              style={({ pressed }) => [
                styles.newMessageButton,
                pressed ? styles.pressed : null,
              ]}
            >
              <Text style={styles.newMessageButtonText}>
                {newMessageIsOpen ? "Close" : "+ New Message"}
              </Text>
            </Pressable>
          </View>

          {newMessageIsOpen ? (
            <View style={styles.newMessagePanel}>
              <View style={styles.newMessageHeader}>
                <View style={styles.newMessageTextArea}>
                  <Text style={styles.newMessageTitle}>Yeni bireysel mesaj</Text>
                  <Text style={styles.newMessageSubtitle}>
                    Kişiyi seç, direkt konuşmaya başla.
                  </Text>
                </View>

                <Pressable
                  onPress={() => {
                    setNewMessageIsOpen(false);
                    setContactSearchText("");
                  }}
                  style={({ pressed }) => [
                    styles.closeSmallButton,
                    pressed ? styles.pressed : null,
                  ]}
                >
                  <Text style={styles.closeSmallButtonText}>×</Text>
                </Pressable>
              </View>

              <TextInput
                value={contactSearchText}
                onChangeText={setContactSearchText}
                placeholder="İsim, rol veya takım ara..."
                placeholderTextColor={theme.colors.text.muted}
                style={styles.contactSearchInput}
              />

              <ScrollView
                nestedScrollEnabled
                keyboardShouldPersistTaps="handled"
                style={styles.contactPickerScroll}
                contentContainerStyle={styles.contactPickerContent}
              >
                {filteredContacts.length > 0 ? (
                  filteredContacts.map((contact) => {
                    const directConversationId = getDirectConversationId(contact.id);
                    const lastMessage = getLastMessage(
                      directConversationId,
                      messages
                    );

                    return (
                      <Pressable
                        key={contact.id}
                        onPress={() => openDirectChat(contact)}
                        style={({ pressed }) => [
                          styles.contactRow,
                          pressed ? styles.pressed : null,
                        ]}
                      >
                        <View style={styles.contactAvatar}>
                          <Text style={styles.contactAvatarText}>
                            {getContactInitials(contact.name)}
                          </Text>
                        </View>

                        <View style={styles.contactInfo}>
                          <Text style={styles.contactName}>{contact.name}</Text>
                          <Text style={styles.contactMeta}>
                            {contact.role} · {contact.teamName}
                          </Text>

                          {lastMessage ? (
                            <Text
                              style={styles.contactLastMessage}
                              numberOfLines={1}
                            >
                              {lastMessage.text}
                            </Text>
                          ) : null}
                        </View>

                        <Text style={styles.contactAction}>Chat</Text>
                      </Pressable>
                    );
                  })
                ) : (
                  <View style={styles.emptyContactsCard}>
                    <Text style={styles.emptyContactsText}>Kişi bulunamadı.</Text>
                  </View>
                )}
              </ScrollView>
            </View>
          ) : null}

          <View style={styles.groupsSection}>
            <Text style={styles.sectionTitle}>Takım Grupları</Text>

            {chatGroups.map((group) => {
              const lastMessage = getLastMessage(group.id, messages);

              return (
                <Pressable
                  key={group.id}
                  onPress={() => openGroupChat(group)}
                  style={({ pressed }) => [
                    styles.groupCard,
                    pressed ? styles.pressed : null,
                  ]}
                >
                  <View style={styles.groupAvatar}>
                    <Text style={styles.groupAvatarText}>
                      {group.teamName
                        .split(" ")
                        .map((part) => part[0])
                        .join("")
                        .slice(0, 2)}
                    </Text>
                  </View>

                  <View style={styles.groupInfo}>
                    <View style={styles.groupTopRow}>
                      <Text style={styles.groupTitle}>
                        {group.teamName} {group.name}
                      </Text>
                      <Text style={styles.groupArrow}>›</Text>
                    </View>

                    <Text style={styles.groupDescription}>{group.description}</Text>

                    <Text style={styles.lastMessage} numberOfLines={1}>
                      {lastMessage
                        ? `${lastMessage.senderName}: ${lastMessage.text}`
                        : "Henüz mesaj yok."}
                    </Text>

                    <Text style={styles.groupMeta}>{group.memberCount} üye</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>

      <AppDrawer
        visible={drawerIsOpen}
        onClose={() => setDrawerIsOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background.app,
  },
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background.app,
  },
  screenContent: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing["2xl"],
    paddingBottom: theme.spacing["2xl"],
  },
  container: {
    width: "100%",
    maxWidth: 980,
    alignSelf: "center",
  },
  newMessageButtonRow: {
    alignItems: "flex-start",
    marginBottom: theme.spacing.xl,
  },
  newMessageButton: {
    backgroundColor: theme.colors.brand.primary,
    borderRadius: theme.radius.full,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    ...theme.shadows.sm,
  },
  newMessageButtonText: {
    color: theme.colors.text.inverse,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.black,
  },
  newMessagePanel: {
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.radius["2xl"],
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    padding: theme.spacing.xl,
    marginBottom: theme.spacing["2xl"],
    ...theme.shadows.sm,
  },
  newMessageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  newMessageTextArea: {
    flex: 1,
  },
  newMessageTitle: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes.xl,
    fontWeight: theme.fontWeights.black,
  },
  newMessageSubtitle: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
    marginTop: theme.spacing.xs,
  },
  closeSmallButton: {
    width: 34,
    height: 34,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.background.subtle,
    alignItems: "center",
    justifyContent: "center",
  },
  closeSmallButtonText: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes.xl,
    fontWeight: theme.fontWeights.black,
    marginTop: -2,
  },
  contactSearchInput: {
    backgroundColor: theme.colors.background.subtle,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    borderRadius: theme.radius.lg,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
    marginBottom: theme.spacing.md,
  },
  contactPickerScroll: {
    maxHeight: 204,
  },
  contactPickerContent: {
    gap: theme.spacing.sm,
  },
  contactRow: {
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
  contactAvatar: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.brand.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  contactAvatarText: {
    color: theme.colors.text.brand,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.black,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.black,
  },
  contactMeta: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.semibold,
    marginTop: theme.spacing.xs,
  },
  contactLastMessage: {
    color: theme.colors.text.muted,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.semibold,
    marginTop: theme.spacing.xs,
  },
  contactAction: {
    color: theme.colors.text.brand,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.black,
  },
  emptyContactsCard: {
    backgroundColor: theme.colors.background.subtle,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    padding: theme.spacing.lg,
  },
  emptyContactsText: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
  },
  groupsSection: {
    gap: theme.spacing.lg,
  },
  sectionTitle: {
    color: theme.colors.text.inverse,
    fontSize: theme.fontSizes["2xl"],
    fontWeight: theme.fontWeights.black,
    marginBottom: theme.spacing.sm,
  },
  groupCard: {
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.radius["2xl"],
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    padding: theme.spacing.xl,
    flexDirection: "row",
    gap: theme.spacing.lg,
    ...theme.shadows.sm,
  },
  groupAvatar: {
    width: 52,
    height: 52,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.brand.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  groupAvatarText: {
    color: theme.colors.text.brand,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.black,
  },
  groupInfo: {
    flex: 1,
  },
  groupTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  groupTitle: {
    flex: 1,
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes.xl,
    fontWeight: theme.fontWeights.black,
  },
  groupArrow: {
    color: theme.colors.text.brand,
    fontSize: theme.fontSizes["3xl"],
    fontWeight: theme.fontWeights.black,
  },
  groupDescription: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
    marginTop: theme.spacing.xs,
  },
  lastMessage: {
    color: theme.colors.text.muted,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
    marginTop: theme.spacing.md,
  },
  groupMeta: {
    color: theme.colors.text.brand,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.extrabold,
    marginTop: theme.spacing.sm,
  },
  chatScreen: {
    flex: 1,
    backgroundColor: theme.colors.background.app,
  },
  chatHeaderWrapper: {
    paddingHorizontal: theme.spacing["2xl"],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.default,
  },
  messagesScroll: {
    flex: 1,
  },
  messagesContent: {
    padding: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  messageBubble: {
    borderRadius: theme.radius.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    ...theme.shadows.sm,
  },
  otherMessageBubble: {
    backgroundColor: theme.colors.background.surface,
    borderColor: theme.colors.border.default,
    alignSelf: "flex-start",
    maxWidth: "88%",
  },
  myMessageBubble: {
    backgroundColor: theme.colors.brand.primarySoft,
    borderColor: theme.colors.brand.primarySoft,
    alignSelf: "flex-end",
    maxWidth: "88%",
  },
  messageTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xs,
  },
  messageSender: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.black,
  },
  messageTime: {
    color: theme.colors.text.muted,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.extrabold,
  },
  messageRole: {
    color: theme.colors.text.brand,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.extrabold,
    marginBottom: theme.spacing.sm,
  },
  messageText: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
    lineHeight: theme.lineHeights.md,
  },
  emptyChatCard: {
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    padding: theme.spacing.xl,
  },
  emptyChatTitle: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.black,
    marginBottom: theme.spacing.xs,
  },
  emptyChatText: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
  },
  composer: {
    backgroundColor: theme.colors.background.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.default,
    padding: theme.spacing.lg,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: theme.spacing.md,
  },
  composerInput: {
    flex: 1,
    minHeight: 46,
    maxHeight: 110,
    backgroundColor: theme.colors.background.subtle,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    borderRadius: theme.radius.xl,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
    textAlignVertical: "top",
  },
  sendButton: {
    width: 46,
    height: 46,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.brand.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonText: {
    color: theme.colors.text.inverse,
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.black,
  },
  pressed: {
    opacity: 0.84,
    transform: [{ scale: 0.99 }],
  },
});