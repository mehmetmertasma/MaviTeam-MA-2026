import AsyncStorage from "@react-native-async-storage/async-storage";
import { Link } from "expo-router";
import { useEffect, useMemo, useState } from "react";
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

type MessageRole = "admin" | "coach" | "parent" | "athlete";

type MessageRoom = "team-chat" | "coach-chat" | "admin-support";

type Message = {
  id: string;
  roomId?: MessageRoom;
  senderName: string;
  senderRole: MessageRole;
  text: string;
  time: string;
};

type ProfileData = {
  name: string;
  email: string;
  club: string;
  team: string;
  role: string;
  season: string;
  membership: string;
};

type RoleOption = {
  id: MessageRole;
  title: string;
  tag: string;
  description: string;
};

type RoomOption = {
  id: MessageRoom;
  title: string;
  description: string;
  visibleFor: MessageRole[];
};

const MESSAGES_STORAGE_KEY = "teamsync_messages_data";
const PROFILE_STORAGE_KEY = "teamsync_profile_data";

const INITIAL_VISIBLE_MESSAGE_LIMIT = 5;
const LOAD_MORE_MESSAGE_COUNT = 5;

const startingProfileData: ProfileData = {
  name: "Mert Asma",
  email: "mertasma7580@gmail.com",
  club: "İstanbul Voleybol Kulübü",
  team: "U16 Erkek",
  role: "Kulüp yöneticisi",
  season: "2026 Bahar",
  membership: "Kulüp öder, veli/sporcu ücretsiz",
};

const roleOptions: RoleOption[] = [
  {
    id: "admin",
    title: "Kulüp Yöneticisi",
    tag: "Admin",
    description: "Kulüp genelindeki mesajları ve iletişimi takip eder.",
  },
  {
    id: "coach",
    title: "Koç",
    tag: "Coach",
    description: "Sporcu ve velilerle takım iletişimini yönetir.",
  },
  {
    id: "parent",
    title: "Veli",
    tag: "Parent",
    description: "Koç ve kulüp yönetimiyle iletişim kurar.",
  },
  {
    id: "athlete",
    title: "Sporcu",
    tag: "Athlete",
    description: "Koça soru sorabilir veya durumunu bildirebilir.",
  },
];

const roomOptions: RoomOption[] = [
  {
    id: "team-chat",
    title: "Team Chat",
    description: "Takım geneli konuşma alanı.",
    visibleFor: ["admin", "coach", "parent", "athlete"],
  },
  {
    id: "coach-chat",
    title: "Coach Chat",
    description: "Koç, sporcu ve veli iletişimi.",
    visibleFor: ["admin", "coach", "parent", "athlete"],
  },
  {
    id: "admin-support",
    title: "Admin Support",
    description: "Kulüp yönetimi ile destek konuşması.",
    visibleFor: ["admin", "coach", "parent"],
  },
];

const startingMessages: Message[] = [
  {
    id: "1",
    roomId: "team-chat",
    senderName: "Coach Emre",
    senderRole: "coach",
    text: "Bugünkü antrenman 18:30’da başlayacak. Lütfen 15 dakika erken gelin.",
    time: "09:15",
  },
  {
    id: "2",
    roomId: "team-chat",
    senderName: "Mert Asma",
    senderRole: "athlete",
    text: "Coach, bugün antrenmana gelebiliyorum.",
    time: "10:02",
  },
  {
    id: "3",
    roomId: "team-chat",
    senderName: "Coach Emre",
    senderRole: "coach",
    text: "Maç formasını çantaya koymayı unutmayın.",
    time: "10:25",
  },
  {
    id: "4",
    roomId: "team-chat",
    senderName: "Admin Mert",
    senderRole: "admin",
    text: "Salon girişinde kulüp kartlarınızı göstermeniz gerekiyor.",
    time: "10:40",
  },
  {
    id: "5",
    roomId: "team-chat",
    senderName: "Coach Emre",
    senderRole: "coach",
    text: "Bugün servis ve savunma drill çalışacağız.",
    time: "11:00",
  },
  {
    id: "6",
    roomId: "team-chat",
    senderName: "Mert Asma",
    senderRole: "athlete",
    text: "Tamam coach, görüşürüz.",
    time: "11:10",
  },
  {
    id: "7",
    roomId: "coach-chat",
    senderName: "Ayşe Veli",
    senderRole: "parent",
    text: "Merhaba hocam, hafta sonu maç saati belli oldu mu?",
    time: "10:18",
  },
  {
    id: "8",
    roomId: "admin-support",
    senderName: "Admin Mert",
    senderRole: "admin",
    text: "Ödeme veya üyelik soruları için buradan kulüp yönetimine yazabilirsiniz.",
    time: "11:05",
  },
];

function getRoleLabel(role: MessageRole) {
  if (role === "admin") {
    return "Admin";
  }

  if (role === "coach") {
    return "Coach";
  }

  if (role === "parent") {
    return "Parent";
  }

  return "Athlete";
}

function getFirstName(name: string) {
  const trimmedName = name.trim();

  if (trimmedName.length === 0) {
    return "Kullanıcı";
  }

  return trimmedName.split(" ")[0];
}

function getSenderName(role: MessageRole, profileData: ProfileData) {
  const firstName = getFirstName(profileData.name);

  if (role === "admin") {
    return `Admin ${firstName}`;
  }

  if (role === "coach") {
    return `Coach ${firstName}`;
  }

  if (role === "parent") {
    return `Veli ${firstName}`;
  }

  return profileData.name;
}

function getCurrentTime() {
  const now = new Date();

  return now.toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getMessageRoom(message: Message) {
  return message.roomId ?? "team-chat";
}

export default function MessagesScreen() {
  const [activeRole, setActiveRole] = useState<MessageRole>("coach");
  const [activeRoom, setActiveRoom] = useState<MessageRoom>("team-chat");
  const [messages, setMessages] = useState<Message[]>(startingMessages);
  const [profileData, setProfileData] =
    useState<ProfileData>(startingProfileData);
  const [newMessage, setNewMessage] = useState("");
  const [visibleMessageLimit, setVisibleMessageLimit] = useState(
    INITIAL_VISIBLE_MESSAGE_LIMIT
  );
  const [statusMessage, setStatusMessage] = useState(
    "Mesajlar local storage ile kaydedilecek."
  );

  const currentRole = roleOptions.find((role) => role.id === activeRole);

  const visibleRooms = useMemo(() => {
    return roomOptions.filter((room) => room.visibleFor.includes(activeRole));
  }, [activeRole]);

  const currentRoom = roomOptions.find((room) => room.id === activeRoom);

  const senderName = getSenderName(activeRole, profileData);

  const filteredMessages = useMemo(() => {
    const roomMessages = messages.filter(
      (message) => getMessageRoom(message) === activeRoom
    );

    if (activeRole === "admin" || activeRole === "coach") {
      return roomMessages;
    }

    return roomMessages.filter(
      (message) =>
        message.senderRole === activeRole ||
        message.senderRole === "coach" ||
        message.senderRole === "admin"
    );
  }, [activeRole, activeRoom, messages]);

  const visibleMessages = useMemo(() => {
    return filteredMessages.slice(-visibleMessageLimit);
  }, [filteredMessages, visibleMessageLimit]);

  const hasOlderMessages = filteredMessages.length > visibleMessageLimit;

  useEffect(() => {
    const activeRoomIsVisible = visibleRooms.some(
      (room) => room.id === activeRoom
    );

    if (!activeRoomIsVisible && visibleRooms.length > 0) {
      setActiveRoom(visibleRooms[0].id);
    }
  }, [activeRole, activeRoom, visibleRooms]);

  useEffect(() => {
    setVisibleMessageLimit(INITIAL_VISIBLE_MESSAGE_LIMIT);
  }, [activeRole, activeRoom]);

  useEffect(() => {
    async function loadSavedMessages() {
      try {
        const savedMessages = await AsyncStorage.getItem(MESSAGES_STORAGE_KEY);

        if (savedMessages === null) {
          return;
        }

        const parsedMessages = JSON.parse(savedMessages) as Message[];

        setMessages(parsedMessages);
        setStatusMessage("Kaydedilmiş mesajlar yüklendi.");
      } catch {
        setStatusMessage("Mesajlar yüklenirken bir sorun oluştu.");
      }
    }

    async function loadSavedProfile() {
      try {
        const savedProfile = await AsyncStorage.getItem(PROFILE_STORAGE_KEY);

        if (savedProfile === null) {
          return;
        }

        const parsedProfile = JSON.parse(savedProfile) as ProfileData;

        setProfileData(parsedProfile);
      } catch {
        setProfileData(startingProfileData);
      }
    }

    loadSavedMessages();
    loadSavedProfile();
  }, []);

  async function saveMessages(updatedMessages: Message[]) {
    try {
      await AsyncStorage.setItem(
        MESSAGES_STORAGE_KEY,
        JSON.stringify(updatedMessages)
      );

      setMessages(updatedMessages);
      setStatusMessage("Mesajlar kaydedildi.");
    } catch {
      setStatusMessage("Mesaj kaydedilirken bir sorun oluştu.");
    }
  }

  async function sendMessage() {
    const trimmedMessage = newMessage.trim();

    if (trimmedMessage.length === 0) {
      setStatusMessage("Boş mesaj gönderilemez.");
      return;
    }

    const messageToAdd: Message = {
      id: Date.now().toString(),
      roomId: activeRoom,
      senderName,
      senderRole: activeRole,
      text: trimmedMessage,
      time: getCurrentTime(),
    };

    const updatedMessages = [...messages, messageToAdd];

    setNewMessage("");
    await saveMessages(updatedMessages);
  }

  function loadOlderMessages() {
    setVisibleMessageLimit(
      (currentLimit) => currentLimit + LOAD_MORE_MESSAGE_COUNT
    );
  }

  async function resetMessages() {
    try {
      await AsyncStorage.removeItem(MESSAGES_STORAGE_KEY);

      setMessages(startingMessages);
      setNewMessage("");
      setActiveRoom("team-chat");
      setVisibleMessageLimit(INITIAL_VISIBLE_MESSAGE_LIMIT);
      setStatusMessage("Mesajlar demo haline sıfırlandı.");
    } catch {
      setStatusMessage("Mesajlar sıfırlanırken bir sorun oluştu.");
    }
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.screen}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.logo}>TeamSync</Text>

          <View>
            <Text style={styles.welcome}>Mesajlar</Text>
            <Text style={styles.subtitle}>
              Koç, veli, sporcu ve kulüp yönetimi arasında takım iletişimi.
            </Text>
          </View>
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>Takım iletişimi</Text>

          <Text style={styles.heroTitle}>Chat Rooms</Text>

          <Text style={styles.heroSubtitle}>
            Mesajlar konuşma odalarına ayrıldı. Yeni mesaj gönderirken kayıtlı
            profil adın kullanılır: {senderName}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Demo rol seçimi</Text>

          <Text style={styles.sectionSubtitle}>
            Şimdilik gerçek giriş sistemi yok. Bu bölümle mesaj ekranını farklı
            rollerle test ediyoruz.
          </Text>

          <View style={styles.roleGrid}>
            {roleOptions.map((role) => {
              const isActive = activeRole === role.id;

              return (
                <Pressable
                  key={role.id}
                  onPress={() => setActiveRole(role.id)}
                  style={[
                    styles.roleCard,
                    isActive && styles.roleCardActive,
                  ]}
                >
                  <View style={styles.roleHeader}>
                    <Text
                      style={[
                        styles.roleTitle,
                        isActive && styles.roleTitleActive,
                      ]}
                    >
                      {role.title}
                    </Text>

                    <Text
                      style={[
                        styles.roleTag,
                        isActive && styles.roleTagActive,
                      ]}
                    >
                      {role.tag}
                    </Text>
                  </View>

                  <Text
                    style={[
                      styles.roleDescription,
                      isActive && styles.roleDescriptionActive,
                    ]}
                  >
                    {role.description}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Konuşma odaları</Text>

          <Text style={styles.sectionSubtitle}>
            Şu anki rol: {currentRole?.title}. Bu role uygun odalar aşağıda
            görünüyor.
          </Text>

          <View style={styles.roomGrid}>
            {visibleRooms.map((room) => {
              const isActive = activeRoom === room.id;

              return (
                <Pressable
                  key={room.id}
                  onPress={() => setActiveRoom(room.id)}
                  style={[
                    styles.roomCard,
                    isActive && styles.roomCardActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.roomTitle,
                      isActive && styles.roomTitleActive,
                    ]}
                  >
                    {room.title}
                  </Text>

                  <Text
                    style={[
                      styles.roomDescription,
                      isActive && styles.roomDescriptionActive,
                    ]}
                  >
                    {room.description}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{currentRoom?.title}</Text>

          <Text style={styles.sectionSubtitle}>
            {currentRoom?.description}
          </Text>

          <View style={styles.messageCountBox}>
            <Text style={styles.messageCountText}>
              {filteredMessages.length} mesajdan {visibleMessages.length} tanesi
              gösteriliyor.
            </Text>
          </View>

          {hasOlderMessages ? (
            <AppButton
              title="Daha eski mesajları yükle"
              variant="ghost"
              accessibilityLabel="Daha eski mesajları yükle"
              style={styles.loadMoreButton}
              onPress={loadOlderMessages}
            />
          ) : null}

          <View style={styles.messageList}>
            {visibleMessages.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>Henüz mesaj yok</Text>
                <Text style={styles.emptyText}>
                  Bu odada görünen ilk mesajı sen gönderebilirsin.
                </Text>
              </View>
            ) : (
              visibleMessages.map((message) => {
                const isOwnMessage = message.senderRole === activeRole;

                return (
                  <View
                    key={message.id}
                    style={[
                      styles.messageCard,
                      isOwnMessage && styles.ownMessageCard,
                    ]}
                  >
                    <View style={styles.messageHeader}>
                      <Text style={styles.senderName}>
                        {message.senderName}
                      </Text>

                      <Text style={styles.messageTime}>{message.time}</Text>
                    </View>

                    <Text style={styles.senderRole}>
                      {getRoleLabel(message.senderRole)}
                    </Text>

                    <Text style={styles.messageText}>{message.text}</Text>
                  </View>
                );
              })
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Yeni mesaj</Text>

          <Text style={styles.sectionSubtitle}>
            Mesaj şu odaya gönderilecek: {currentRoom?.title}
          </Text>

          <TextInput
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Mesajını yaz..."
            placeholderTextColor={theme.colors.text.muted}
            multiline
            style={styles.input}
          />

          <AppButton
            title="Mesaj gönder"
            variant="secondary"
            accessibilityLabel="Yeni mesaj gönder"
            style={styles.sendButton}
            onPress={sendMessage}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kaydetme durumu</Text>

          <Text style={styles.sectionSubtitle}>{statusMessage}</Text>

          <View style={styles.resetButtonWrapper}>
            <AppButton
              title="Demo mesajları sıfırla"
              variant="ghost"
              accessibilityLabel="Demo mesajları sıfırla"
              onPress={resetMessages}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Gelecek Firebase mantığı</Text>

          <Text style={styles.sectionSubtitle}>
            Daha sonra Firebase’de ilk açılışta sadece son 30-50 mesajı
            çekeceğiz. Eski mesajlar kullanıcı isterse yüklenecek. Bu, gereksiz
            Firestore read maliyetini azaltır.
          </Text>
        </View>

        <Link href="/dashboard" asChild>
          <AppButton
            title="Dashboard'a dön"
            variant="secondary"
            accessibilityLabel="Dashboard ekranına dön"
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
  welcome: {
    fontSize: theme.fontSizes["5xl"],
    fontWeight: theme.fontWeights.black,
    color: theme.colors.text.inverse,
    lineHeight: theme.lineHeights["5xl"],
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: theme.fontSizes.lg,
    color: theme.colors.text.inverse,
    opacity: 0.76,
    fontWeight: theme.fontWeights.semibold,
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
    marginBottom: theme.spacing.md,
  },
  sectionSubtitle: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
    color: theme.colors.text.secondary,
    lineHeight: theme.lineHeights.md,
    marginBottom: theme.spacing.xl,
  },
  roleGrid: {
    gap: theme.spacing.md,
  },
  roleCard: {
    backgroundColor: theme.colors.background.subtle,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
  },
  roleCardActive: {
    backgroundColor: theme.colors.brand.primary,
    borderColor: theme.colors.brand.primary,
  },
  roleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  roleTitle: {
    flex: 1,
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.black,
    color: theme.colors.text.primary,
  },
  roleTitleActive: {
    color: theme.colors.text.inverse,
  },
  roleTag: {
    backgroundColor: theme.colors.brand.primarySoft,
    color: theme.colors.text.brand,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.black,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.full,
  },
  roleTagActive: {
    backgroundColor: theme.colors.background.surface,
    color: theme.colors.text.brand,
  },
  roleDescription: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
    color: theme.colors.text.secondary,
    lineHeight: theme.lineHeights.md,
  },
  roleDescriptionActive: {
    color: theme.colors.text.inverse,
  },
  roomGrid: {
    gap: theme.spacing.md,
  },
  roomCard: {
    backgroundColor: theme.colors.background.subtle,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
  },
  roomCardActive: {
    backgroundColor: theme.colors.brand.primarySoft,
    borderColor: theme.colors.brand.primarySoft,
  },
  roomTitle: {
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.black,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  roomTitleActive: {
    color: theme.colors.text.brand,
  },
  roomDescription: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
    color: theme.colors.text.secondary,
    lineHeight: theme.lineHeights.md,
  },
  roomDescriptionActive: {
    color: theme.colors.text.secondary,
  },
  messageCountBox: {
    backgroundColor: theme.colors.background.subtle,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    marginBottom: theme.spacing.md,
  },
  messageCountText: {
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.extrabold,
    color: theme.colors.text.secondary,
  },
  loadMoreButton: {
    alignSelf: "flex-start",
    marginBottom: theme.spacing.lg,
  },
  messageList: {
    gap: theme.spacing.md,
  },
  messageCard: {
    backgroundColor: theme.colors.background.subtle,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
  },
  ownMessageCard: {
    backgroundColor: theme.colors.brand.primarySoft,
    borderColor: theme.colors.brand.primarySoft,
  },
  messageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xs,
  },
  senderName: {
    flex: 1,
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.black,
    color: theme.colors.text.primary,
  },
  messageTime: {
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.extrabold,
    color: theme.colors.text.muted,
  },
  senderRole: {
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.extrabold,
    color: theme.colors.text.brand,
    marginBottom: theme.spacing.sm,
  },
  messageText: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
    color: theme.colors.text.secondary,
    lineHeight: theme.lineHeights.md,
  },
  emptyCard: {
    backgroundColor: theme.colors.background.subtle,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
  },
  emptyTitle: {
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.black,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  emptyText: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
    color: theme.colors.text.secondary,
    lineHeight: theme.lineHeights.md,
  },
  input: {
    minHeight: 110,
    backgroundColor: theme.colors.background.subtle,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    borderRadius: theme.radius.lg,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
    color: theme.colors.text.primary,
    textAlignVertical: "top",
  },
  sendButton: {
    marginTop: theme.spacing.lg,
    alignSelf: "flex-start",
  },
  resetButtonWrapper: {
    marginTop: theme.spacing.lg,
    alignSelf: "flex-start",
  },
  backButton: {
    marginBottom: theme.spacing["2xl"],
  },
});