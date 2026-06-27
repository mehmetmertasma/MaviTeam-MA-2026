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

type UserRole = "admin" | "coach" | "parent" | "athlete";

type AudienceType =
  | "team"
  | "coaches"
  | "athletes"
  | "parents"
  | "admins"
  | "direct";

type DemoTeam = {
  id: string;
  name: string;
  clubId: string;
};

type DemoUser = {
  id: string;
  name: string;
  role: UserRole;
  clubId: string;
  teamIds: string[];
};

type DemoMessage = {
  id: string;
  clubId: string;
  teamId: string;
  audienceType: AudienceType;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  recipientUserId?: string;
  text: string;
  createdAt: string;
};

type AudienceOption = {
  type: AudienceType;
  title: string;
  subtitle: string;
};

const MESSAGES_STORAGE_KEY = "teamsync_messages_dropdown_v1";
const CLUB_ID = "club-istanbul-volleyball";

const defaultTeam: DemoTeam = {
  id: "team-u17-boys",
  name: "U17 Erkek",
  clubId: CLUB_ID,
};

const demoTeams: DemoTeam[] = [
  defaultTeam,
  {
    id: "team-u14-girls",
    name: "U14 Kız",
    clubId: CLUB_ID,
  },
  {
    id: "team-u18-elite",
    name: "U18 Elite",
    clubId: CLUB_ID,
  },
];

const defaultUser: DemoUser = {
  id: "coach-emre",
  name: "Coach Emre",
  role: "coach",
  clubId: CLUB_ID,
  teamIds: ["team-u17-boys", "team-u18-elite"],
};

const demoUsers: DemoUser[] = [
  defaultUser,
  {
    id: "admin-mert",
    name: "Admin Mert",
    role: "admin",
    clubId: CLUB_ID,
    teamIds: ["team-u17-boys", "team-u14-girls", "team-u18-elite"],
  },
  {
    id: "coach-aylin",
    name: "Coach Aylin",
    role: "coach",
    clubId: CLUB_ID,
    teamIds: ["team-u14-girls"],
  },
  {
    id: "coach-daniel",
    name: "Coach Daniel",
    role: "coach",
    clubId: CLUB_ID,
    teamIds: ["team-u18-elite"],
  },
  {
    id: "parent-ayse",
    name: "Ayşe Veli",
    role: "parent",
    clubId: CLUB_ID,
    teamIds: ["team-u17-boys"],
  },
  {
    id: "parent-mehmet",
    name: "Mehmet Veli",
    role: "parent",
    clubId: CLUB_ID,
    teamIds: ["team-u14-girls"],
  },
  {
    id: "parent-seda",
    name: "Seda Veli",
    role: "parent",
    clubId: CLUB_ID,
    teamIds: ["team-u18-elite"],
  },
  {
    id: "athlete-mert",
    name: "Mert Asma",
    role: "athlete",
    clubId: CLUB_ID,
    teamIds: ["team-u17-boys"],
  },
  {
    id: "athlete-efe",
    name: "Efe Demir",
    role: "athlete",
    clubId: CLUB_ID,
    teamIds: ["team-u17-boys"],
  },
  {
    id: "athlete-zeynep",
    name: "Zeynep Kaya",
    role: "athlete",
    clubId: CLUB_ID,
    teamIds: ["team-u14-girls"],
  },
  {
    id: "athlete-arda",
    name: "Arda Yılmaz",
    role: "athlete",
    clubId: CLUB_ID,
    teamIds: ["team-u18-elite"],
  },
];

const audienceOptions: AudienceOption[] = [
  {
    type: "team",
    title: "Team Chat",
    subtitle: "Seçili takımdaki herkes görür.",
  },
  {
    type: "coaches",
    title: "Coaches",
    subtitle: "Seçili takımın koç grubu.",
  },
  {
    type: "athletes",
    title: "Athletes",
    subtitle: "Seçili takımın sporcuları.",
  },
  {
    type: "parents",
    title: "Parents",
    subtitle: "Seçili takımın velileri.",
  },
  {
    type: "admins",
    title: "Club Admin",
    subtitle: "Kulüp yöneticileri.",
  },
  {
    type: "direct",
    title: "Direct Message",
    subtitle: "Bir kişiye özel mesaj.",
  },
];

function sortMessages(messages: DemoMessage[]) {
  return [...messages].sort(
    (firstMessage, secondMessage) =>
      new Date(firstMessage.createdAt).getTime() -
      new Date(secondMessage.createdAt).getTime()
  );
}

const initialMessages: DemoMessage[] = sortMessages([
  {
    id: "message-1",
    clubId: CLUB_ID,
    teamId: "team-u17-boys",
    audienceType: "team",
    senderId: "coach-emre",
    senderName: "Coach Emre",
    senderRole: "coach",
    text: "Bugünkü antrenman 18:30’da başlayacak. Lütfen 15 dakika erken gelin.",
    createdAt: "2026-06-26T14:30:00.000Z",
  },
  {
    id: "message-2",
    clubId: CLUB_ID,
    teamId: "team-u17-boys",
    audienceType: "parents",
    senderId: "coach-emre",
    senderName: "Coach Emre",
    senderRole: "coach",
    text: "Veliler için hatırlatma: hafta sonu maç ulaşım planı yarın paylaşılacak.",
    createdAt: "2026-06-26T15:10:00.000Z",
  },
  {
    id: "message-3",
    clubId: CLUB_ID,
    teamId: "team-u17-boys",
    audienceType: "athletes",
    senderId: "coach-emre",
    senderName: "Coach Emre",
    senderRole: "coach",
    text: "Sporcular, yarın servis ve savunma drill çalışacağız.",
    createdAt: "2026-06-26T16:05:00.000Z",
  },
  {
    id: "message-4",
    clubId: CLUB_ID,
    teamId: "team-u17-boys",
    audienceType: "coaches",
    senderId: "admin-mert",
    senderName: "Admin Mert",
    senderRole: "admin",
    text: "U17 koçları, maç kadrosunu cuma gününe kadar sisteme girin.",
    createdAt: "2026-06-26T17:20:00.000Z",
  },
  {
    id: "message-5",
    clubId: CLUB_ID,
    teamId: "team-u17-boys",
    audienceType: "direct",
    senderId: "parent-ayse",
    senderName: "Ayşe Veli",
    senderRole: "parent",
    recipientUserId: "coach-emre",
    text: "Coach, Mert bugün okul etkinliği yüzünden 10 dakika geç kalabilir.",
    createdAt: "2026-06-27T13:15:00.000Z",
  },
  {
    id: "message-6",
    clubId: CLUB_ID,
    teamId: "team-u17-boys",
    audienceType: "direct",
    senderId: "coach-emre",
    senderName: "Coach Emre",
    senderRole: "coach",
    recipientUserId: "parent-ayse",
    text: "Tamam, sorun değil. Geldiğinde direkt ısınmaya katılsın.",
    createdAt: "2026-06-27T13:22:00.000Z",
  },
]);

function getRoleLabel(role: UserRole) {
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

function formatMessageTime(createdAt: string) {
  const date = new Date(createdAt);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleString("tr-TR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getUserById(userId: string) {
  return demoUsers.find((user) => user.id === userId) ?? defaultUser;
}

function getTeamsForUser(user: DemoUser) {
  if (user.role === "admin") {
    return demoTeams.filter((team) => team.clubId === user.clubId);
  }

  return demoTeams.filter(
    (team) => team.clubId === user.clubId && user.teamIds.includes(team.id)
  );
}

function getTeamNamesForUser(user: DemoUser) {
  return getTeamsForUser(user)
    .map((team) => team.name)
    .join(", ");
}

function userCanAccessTeam(user: DemoUser, teamId: string) {
  if (user.role === "admin") {
    return true;
  }

  return user.teamIds.includes(teamId);
}

function canDirectMessageUser(sender: DemoUser, recipient: DemoUser) {
  if (sender.id === recipient.id) {
    return false;
  }

  if (sender.clubId !== recipient.clubId) {
    return false;
  }

  if (sender.role === "admin" || sender.role === "coach") {
    return true;
  }

  return recipient.role === "admin" || recipient.role === "coach";
}

function getDirectMessageCandidates(currentUser: DemoUser) {
  return demoUsers.filter((user) => canDirectMessageUser(currentUser, user));
}

function canSendAudience(
  user: DemoUser,
  audienceType: AudienceType,
  selectedTeamId: string
) {
  if (audienceType === "direct") {
    return getDirectMessageCandidates(user).length > 0;
  }

  if (!userCanAccessTeam(user, selectedTeamId)) {
    return false;
  }

  if (user.role === "admin" || user.role === "coach") {
    return true;
  }

  if (audienceType === "team" || audienceType === "coaches") {
    return true;
  }

  if (audienceType === "parents") {
    return user.role === "parent";
  }

  if (audienceType === "athletes") {
    return user.role === "athlete";
  }

  return false;
}

function getFirstAllowedAudience(user: DemoUser, selectedTeamId: string) {
  return (
    audienceOptions.find((audience) =>
      canSendAudience(user, audience.type, selectedTeamId)
    )?.type ?? "team"
  );
}

function canUserReadMessage(user: DemoUser, message: DemoMessage) {
  if (user.clubId !== message.clubId) {
    return false;
  }

  if (message.audienceType === "direct") {
    return message.senderId === user.id || message.recipientUserId === user.id;
  }

  if (user.role === "admin") {
    return true;
  }

  if (message.senderId === user.id) {
    return true;
  }

  if (!userCanAccessTeam(user, message.teamId)) {
    return false;
  }

  if (user.role === "coach") {
    return true;
  }

  if (message.audienceType === "team") {
    return true;
  }

  if (message.audienceType === "coaches") {
    return user.role === "coach";
  }

  if (message.audienceType === "parents") {
    return user.role === "parent";
  }

  if (message.audienceType === "athletes") {
    return user.role === "athlete";
  }

  if (message.audienceType === "admins") {
    return user.role === "admin";
  }

  return false;
}

function isMessageInSelectedThread(
  message: DemoMessage,
  currentUser: DemoUser,
  selectedTeamId: string,
  selectedAudienceType: AudienceType,
  selectedDirectRecipientId?: string
) {
  if (selectedAudienceType === "direct") {
    if (message.audienceType !== "direct" || !selectedDirectRecipientId) {
      return false;
    }

    return (
      (message.senderId === currentUser.id &&
        message.recipientUserId === selectedDirectRecipientId) ||
      (message.senderId === selectedDirectRecipientId &&
        message.recipientUserId === currentUser.id)
    );
  }

  return (
    message.teamId === selectedTeamId &&
    message.audienceType === selectedAudienceType
  );
}

function isAudienceType(value: unknown): value is AudienceType {
  return (
    value === "team" ||
    value === "coaches" ||
    value === "athletes" ||
    value === "parents" ||
    value === "admins" ||
    value === "direct"
  );
}

function isUserRole(value: unknown): value is UserRole {
  return (
    value === "admin" ||
    value === "coach" ||
    value === "parent" ||
    value === "athlete"
  );
}

function isDemoMessage(value: unknown): value is DemoMessage {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const message = value as Partial<DemoMessage>;

  return (
    typeof message.id === "string" &&
    typeof message.clubId === "string" &&
    typeof message.teamId === "string" &&
    isAudienceType(message.audienceType) &&
    typeof message.senderId === "string" &&
    typeof message.senderName === "string" &&
    isUserRole(message.senderRole) &&
    typeof message.text === "string" &&
    typeof message.createdAt === "string"
  );
}

function parseSavedMessages(savedMessages: string | null) {
  if (savedMessages === null) {
    return initialMessages;
  }

  const parsedMessages = JSON.parse(savedMessages) as unknown;

  if (!Array.isArray(parsedMessages)) {
    return initialMessages;
  }

  const validMessages = parsedMessages.filter(isDemoMessage);

  if (validMessages.length === 0) {
    return initialMessages;
  }

  return sortMessages(validMessages);
}

function filterUsers(users: DemoUser[], searchText: string) {
  const normalizedSearchText = searchText.trim().toLowerCase();

  if (normalizedSearchText.length === 0) {
    return users;
  }

  return users.filter((user) => {
    const roleLabel = getRoleLabel(user.role).toLowerCase();
    const teamNames = getTeamNamesForUser(user).toLowerCase();

    return (
      user.name.toLowerCase().includes(normalizedSearchText) ||
      roleLabel.includes(normalizedSearchText) ||
      teamNames.includes(normalizedSearchText)
    );
  });
}

export default function MessagesScreen() {
  const [currentUserId, setCurrentUserId] = useState(defaultUser.id);
  const [selectedTeamId, setSelectedTeamId] = useState(defaultTeam.id);
  const [selectedAudienceType, setSelectedAudienceType] =
    useState<AudienceType>("team");
  const [selectedDirectRecipientId, setSelectedDirectRecipientId] =
    useState<string>();
  const [demoPickerIsOpen, setDemoPickerIsOpen] = useState(false);
  const [demoSearchText, setDemoSearchText] = useState("");
  const [recipientPickerIsOpen, setRecipientPickerIsOpen] = useState(false);
  const [recipientSearchText, setRecipientSearchText] = useState("");
  const [messages, setMessages] = useState<DemoMessage[]>(initialMessages);
  const [draftText, setDraftText] = useState("");
  const [statusMessage, setStatusMessage] = useState(
    "Mesajlar local storage ile kaydedilecek."
  );

  const currentUser = useMemo(() => {
    return getUserById(currentUserId);
  }, [currentUserId]);

  const currentUserTeams = useMemo(() => {
    return getTeamsForUser(currentUser);
  }, [currentUser]);

  const selectedTeam = useMemo(() => {
    return demoTeams.find((team) => team.id === selectedTeamId) ?? defaultTeam;
  }, [selectedTeamId]);

  const directMessageCandidates = useMemo(() => {
    return getDirectMessageCandidates(currentUser);
  }, [currentUser]);

  const filteredDemoUsers = useMemo(() => {
    return filterUsers(demoUsers, demoSearchText);
  }, [demoSearchText]);

  const filteredDirectMessageCandidates = useMemo(() => {
    return filterUsers(directMessageCandidates, recipientSearchText);
  }, [directMessageCandidates, recipientSearchText]);

  const selectedDirectRecipient = useMemo(() => {
    return directMessageCandidates.find(
      (user) => user.id === selectedDirectRecipientId
    );
  }, [directMessageCandidates, selectedDirectRecipientId]);

  const selectedAudience = audienceOptions.find(
    (audience) => audience.type === selectedAudienceType
  );

  const visibleThreadMessages = useMemo(() => {
    return messages
      .filter((message) => canUserReadMessage(currentUser, message))
      .filter((message) =>
        isMessageInSelectedThread(
          message,
          currentUser,
          selectedTeamId,
          selectedAudienceType,
          selectedDirectRecipientId
        )
      );
  }, [
    currentUser,
    messages,
    selectedAudienceType,
    selectedDirectRecipientId,
    selectedTeamId,
  ]);

  const canSendCurrentMessage =
    draftText.trim().length > 0 &&
    canSendAudience(currentUser, selectedAudienceType, selectedTeamId) &&
    (selectedAudienceType !== "direct" || selectedDirectRecipient !== undefined);

  useEffect(() => {
    let screenIsActive = true;

    async function loadSavedMessages() {
      try {
        const savedMessages = await AsyncStorage.getItem(MESSAGES_STORAGE_KEY);
        const parsedMessages = parseSavedMessages(savedMessages);

        if (screenIsActive) {
          setMessages(parsedMessages);
          setStatusMessage("Kaydedilmiş mesajlar yüklendi.");
        }
      } catch {
        if (screenIsActive) {
          setMessages(initialMessages);
          setStatusMessage("Mesajlar yüklenirken bir sorun oluştu.");
        }
      }
    }

    loadSavedMessages();

    return () => {
      screenIsActive = false;
    };
  }, []);

  function changeDemoUser(nextUserId: string) {
    const nextUser = getUserById(nextUserId);
    const nextUserTeams = getTeamsForUser(nextUser);
    const nextTeamId = nextUserTeams[0]?.id ?? defaultTeam.id;
    const nextAudienceType = getFirstAllowedAudience(nextUser, nextTeamId);

    setCurrentUserId(nextUser.id);
    setSelectedTeamId(nextTeamId);
    setSelectedAudienceType(nextAudienceType);
    setSelectedDirectRecipientId(undefined);
    setDemoSearchText("");
    setDemoPickerIsOpen(false);
    setRecipientSearchText("");
    setRecipientPickerIsOpen(false);
    setDraftText("");
    setStatusMessage(`${nextUser.name} olarak mesaj ekranı açıldı.`);
  }

  function changeSelectedTeam(nextTeamId: string) {
    const nextAudienceType = canSendAudience(
      currentUser,
      selectedAudienceType,
      nextTeamId
    )
      ? selectedAudienceType
      : getFirstAllowedAudience(currentUser, nextTeamId);

    setSelectedTeamId(nextTeamId);
    setSelectedAudienceType(nextAudienceType);
    setSelectedDirectRecipientId(undefined);
    setRecipientSearchText("");
    setRecipientPickerIsOpen(false);
    setDraftText("");
    setStatusMessage("Takım değiştirildi.");
  }

  function changeAudience(nextAudienceType: AudienceType) {
    if (!canSendAudience(currentUser, nextAudienceType, selectedTeamId)) {
      return;
    }

    setSelectedAudienceType(nextAudienceType);
    setSelectedDirectRecipientId(undefined);
    setRecipientSearchText("");
    setRecipientPickerIsOpen(false);
    setDraftText("");

    if (nextAudienceType === "direct") {
      setStatusMessage("Direct Message seçildi. Kişi seçmek için dropdown aç.");
      return;
    }

    const audienceTitle =
      audienceOptions.find((audience) => audience.type === nextAudienceType)
        ?.title ?? "Mesaj hedefi";

    setStatusMessage(`${audienceTitle} seçildi.`);
  }

  function changeDirectRecipient(nextRecipientId: string) {
    const recipient = directMessageCandidates.find(
      (user) => user.id === nextRecipientId
    );

    setSelectedDirectRecipientId(nextRecipientId);
    setRecipientSearchText("");
    setRecipientPickerIsOpen(false);
    setDraftText("");

    if (recipient) {
      setStatusMessage(`${recipient.name} ile özel mesaj açıldı.`);
    }
  }

  async function saveMessages(nextMessages: DemoMessage[]) {
    try {
      await AsyncStorage.setItem(
        MESSAGES_STORAGE_KEY,
        JSON.stringify(nextMessages)
      );

      setMessages(nextMessages);
      setStatusMessage("Mesaj kaydedildi.");
    } catch {
      setStatusMessage("Mesaj kaydedilirken bir sorun oluştu.");
    }
  }

  async function sendMessage() {
    const trimmedText = draftText.trim();

    if (!canSendCurrentMessage) {
      setStatusMessage("Mesaj göndermek için hedef ve mesaj gerekli.");
      return;
    }

    const newMessage: DemoMessage = {
      id: `message-${Date.now()}`,
      clubId: currentUser.clubId,
      teamId: selectedTeam.id,
      audienceType: selectedAudienceType,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderRole: currentUser.role,
      recipientUserId:
        selectedAudienceType === "direct"
          ? selectedDirectRecipient?.id
          : undefined,
      text: trimmedText,
      createdAt: new Date().toISOString(),
    };

    const nextMessages = sortMessages([...messages, newMessage]);

    setDraftText("");
    await saveMessages(nextMessages);
  }

  async function resetDemoMessages() {
    try {
      await AsyncStorage.removeItem(MESSAGES_STORAGE_KEY);

      setMessages(initialMessages);
      setDraftText("");
      setSelectedDirectRecipientId(undefined);
      setRecipientSearchText("");
      setRecipientPickerIsOpen(false);
      setStatusMessage("Demo mesajlar sıfırlandı.");
    } catch {
      setStatusMessage("Demo mesajlar sıfırlanırken bir sorun oluştu.");
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
              Grup mesajları ve küçük dropdown ile direct message.
            </Text>
          </View>
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>Takım iletişimi</Text>

          <Text style={styles.heroTitle}>Messages</Text>

          <Text style={styles.heroSubtitle}>
            Kullanıcılar açık açık alt alta listelenmez. Direct Message için
            önce dropdown açılır, sonra isim aranır ve küçük listeden seçim
            yapılır.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Demo kullanıcı</Text>

          <Text style={styles.sectionSubtitle}>
            Gerçek login gelene kadar rol testini küçük dropdown ile yapıyoruz.
          </Text>

          <Pressable
            onPress={() => setDemoPickerIsOpen((currentValue) => !currentValue)}
            style={({ pressed }) => [
              styles.dropdownButton,
              demoPickerIsOpen ? styles.dropdownButtonActive : null,
              pressed ? styles.cardPressed : null,
            ]}
          >
            <View style={styles.dropdownTextArea}>
              <Text style={styles.dropdownLabel}>Aktif kullanıcı</Text>
              <Text style={styles.dropdownValue}>{currentUser.name}</Text>
              <Text style={styles.dropdownMeta}>
                {getRoleLabel(currentUser.role)} · {getTeamNamesForUser(currentUser)}
              </Text>
            </View>

            <Text style={styles.dropdownArrow}>
              {demoPickerIsOpen ? "⌃" : "⌄"}
            </Text>
          </Pressable>

          {demoPickerIsOpen ? (
            <View style={styles.dropdownPanel}>
              <TextInput
                value={demoSearchText}
                onChangeText={setDemoSearchText}
                placeholder="Demo kullanıcı ara..."
                placeholderTextColor={theme.colors.text.muted}
                style={styles.compactSearchInput}
              />

              <ScrollView
                nestedScrollEnabled
                style={styles.compactPickerScroll}
                contentContainerStyle={styles.compactList}
                keyboardShouldPersistTaps="handled"
              >
                {filteredDemoUsers.map((user) => {
                  const isSelected = user.id === currentUser.id;

                  return (
                    <Pressable
                      key={user.id}
                      onPress={() => changeDemoUser(user.id)}
                      style={({ pressed }) => [
                        styles.compactRow,
                        isSelected ? styles.compactRowActive : null,
                        pressed ? styles.cardPressed : null,
                      ]}
                    >
                      <View style={styles.compactTextArea}>
                        <Text
                          style={[
                            styles.compactName,
                            isSelected ? styles.compactNameActive : null,
                          ]}
                        >
                          {user.name}
                        </Text>
                        <Text style={styles.compactMeta}>
                          {getRoleLabel(user.role)} · {getTeamNamesForUser(user)}
                        </Text>
                      </View>

                      <Text style={styles.compactAction}>
                        {isSelected ? "Active" : "Use"}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          ) : null}
        </View>

        {currentUserTeams.length > 1 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Takım seçimi</Text>

            <Text style={styles.sectionSubtitle}>
              Mesajlar seçili takıma göre filtrelenir.
            </Text>

            <View style={styles.teamGrid}>
              {currentUserTeams.map((team) => {
                const isSelected = team.id === selectedTeamId;

                return (
                  <Pressable
                    key={team.id}
                    onPress={() => changeSelectedTeam(team.id)}
                    style={({ pressed }) => [
                      styles.teamCard,
                      isSelected ? styles.teamCardActive : null,
                      pressed ? styles.cardPressed : null,
                    ]}
                  >
                    <Text
                      style={[
                        styles.teamName,
                        isSelected ? styles.teamNameActive : null,
                      ]}
                    >
                      {team.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kime mesaj atacaksın?</Text>

          <Text style={styles.sectionSubtitle}>
            Önce grup seçilir. Direct Message seçilirse kişi listesi sadece
            dropdown içinde görünür.
          </Text>

          <View style={styles.audienceGrid}>
            {audienceOptions.map((audience) => {
              const isSelected = selectedAudienceType === audience.type;
              const isAllowed = canSendAudience(
                currentUser,
                audience.type,
                selectedTeamId
              );

              return (
                <Pressable
                  key={audience.type}
                  disabled={!isAllowed}
                  onPress={() => changeAudience(audience.type)}
                  style={({ pressed }) => [
                    styles.audienceCard,
                    isSelected ? styles.audienceCardActive : null,
                    !isAllowed ? styles.audienceCardDisabled : null,
                    pressed && isAllowed ? styles.cardPressed : null,
                  ]}
                >
                  <Text
                    style={[
                      styles.audienceTitle,
                      isSelected ? styles.audienceTitleActive : null,
                      !isAllowed ? styles.disabledText : null,
                    ]}
                  >
                    {audience.title}
                  </Text>

                  <Text
                    style={[
                      styles.audienceSubtitle,
                      isSelected ? styles.audienceSubtitleActive : null,
                      !isAllowed ? styles.disabledText : null,
                    ]}
                  >
                    {isAllowed ? audience.subtitle : "Bu rol için kapalı."}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {selectedAudienceType === "direct" ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Direct Message</Text>

            <Text style={styles.sectionSubtitle}>
              Kişiler büyük liste olarak görünmez. Aşağıdaki dropdown içinde
              sadece 3 satırlık alan görünür, gerisini scroll edebilirsin.
            </Text>

            <Pressable
              onPress={() =>
                setRecipientPickerIsOpen((currentValue) => !currentValue)
              }
              style={({ pressed }) => [
                styles.dropdownButton,
                recipientPickerIsOpen ? styles.dropdownButtonActive : null,
                pressed ? styles.cardPressed : null,
              ]}
            >
              <View style={styles.dropdownTextArea}>
                <Text style={styles.dropdownLabel}>Kişi seç</Text>
                <Text style={styles.dropdownValue}>
                  {selectedDirectRecipient?.name ?? "Henüz kişi seçilmedi"}
                </Text>
                <Text style={styles.dropdownMeta}>
                  {selectedDirectRecipient
                    ? getRoleLabel(selectedDirectRecipient.role)
                    : "Aç, isim ara ve seç"}
                </Text>
              </View>

              <Text style={styles.dropdownArrow}>
                {recipientPickerIsOpen ? "⌃" : "⌄"}
              </Text>
            </Pressable>

            {recipientPickerIsOpen ? (
              <View style={styles.dropdownPanel}>
                <TextInput
                  value={recipientSearchText}
                  onChangeText={setRecipientSearchText}
                  placeholder="İsim ara..."
                  placeholderTextColor={theme.colors.text.muted}
                  style={styles.compactSearchInput}
                />

                <ScrollView
                  nestedScrollEnabled
                  style={styles.compactPickerScroll}
                  contentContainerStyle={styles.compactList}
                  keyboardShouldPersistTaps="handled"
                >
                  {filteredDirectMessageCandidates.length > 0 ? (
                    filteredDirectMessageCandidates.map((user) => {
                      const isSelected = user.id === selectedDirectRecipientId;

                      return (
                        <Pressable
                          key={user.id}
                          onPress={() => changeDirectRecipient(user.id)}
                          style={({ pressed }) => [
                            styles.compactRow,
                            isSelected ? styles.compactRowActive : null,
                            pressed ? styles.cardPressed : null,
                          ]}
                        >
                          <View style={styles.compactTextArea}>
                            <Text
                              style={[
                                styles.compactName,
                                isSelected ? styles.compactNameActive : null,
                              ]}
                            >
                              {user.name}
                            </Text>
                            <Text style={styles.compactMeta}>
                              {getRoleLabel(user.role)} · {getTeamNamesForUser(user)}
                            </Text>
                          </View>

                          <Text style={styles.compactAction}>
                            {isSelected ? "Selected" : "Choose"}
                          </Text>
                        </Pressable>
                      );
                    })
                  ) : (
                    <View style={styles.compactEmptyBox}>
                      <Text style={styles.compactEmptyText}>
                        Kişi bulunamadı. Başka bir isim dene.
                      </Text>
                    </View>
                  )}
                </ScrollView>

                {filteredDirectMessageCandidates.length > 3 ? (
                  <Text style={styles.compactResultHint}>
                    Daha fazla kişi var. Liste içinde scroll yap veya isim yaz.
                  </Text>
                ) : null}
              </View>
            ) : null}
          </View>
        ) : null}

        <View style={styles.section}>
          <View style={styles.threadHeader}>
            <View style={styles.threadHeaderText}>
              <Text style={styles.sectionTitle}>
                {selectedAudienceType === "direct"
                  ? selectedDirectRecipient?.name ?? "Direct Message"
                  : selectedAudience?.title ?? "Messages"}
              </Text>

              <Text style={styles.sectionSubtitle}>
                {selectedAudienceType === "direct"
                  ? "Bu konuşma sadece seçili iki kullanıcı arasında görünür."
                  : `${selectedTeam.name} · ${selectedAudience?.subtitle ?? ""}`}
              </Text>
            </View>

            <View style={styles.countPill}>
              <Text style={styles.countText}>{visibleThreadMessages.length}</Text>
            </View>
          </View>

          <View style={styles.messageList}>
            {selectedAudienceType === "direct" &&
            selectedDirectRecipient === undefined ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>Kişi seçilmedi</Text>
                <Text style={styles.emptyText}>
                  Direct Message için dropdown içinden kişi seçmelisin.
                </Text>
              </View>
            ) : visibleThreadMessages.length > 0 ? (
              visibleThreadMessages.map((message) => {
                const isOwnMessage = message.senderId === currentUser.id;

                return (
                  <View
                    key={message.id}
                    style={[
                      styles.messageCard,
                      isOwnMessage ? styles.ownMessageCard : null,
                    ]}
                  >
                    <View style={styles.messageHeader}>
                      <Text style={styles.senderName}>{message.senderName}</Text>
                      <Text style={styles.messageTime}>
                        {formatMessageTime(message.createdAt)}
                      </Text>
                    </View>

                    <Text style={styles.senderRole}>
                      {getRoleLabel(message.senderRole)}
                    </Text>
                    <Text style={styles.messageText}>{message.text}</Text>
                  </View>
                );
              })
            ) : (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>Henüz mesaj yok</Text>
                <Text style={styles.emptyText}>
                  Bu konuşmada ilk mesajı sen gönderebilirsin.
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Yeni mesaj</Text>
          <Text style={styles.sectionSubtitle}>
            Hedef: {" "}
            {selectedAudienceType === "direct"
              ? selectedDirectRecipient?.name ?? "Kişi seçilmedi"
              : selectedAudience?.title}
          </Text>

          <TextInput
            value={draftText}
            onChangeText={setDraftText}
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
              onPress={resetDemoMessages}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Gelecek Firebase mantığı</Text>
          <Text style={styles.sectionSubtitle}>
            Gerçek sistemde bu demo kullanıcı seçici olmayacak. Auth ile giriş
            yapan kullanıcı kimse, Firestore sadece onun clubId, teamId, role ve
            direct participant izinlerine göre mesajları gösterecek.
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
  dropdownButton: {
    backgroundColor: theme.colors.background.subtle,
    borderRadius: theme.radius.lg,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.md,
  },
  dropdownButtonActive: {
    backgroundColor: theme.colors.brand.primarySoft,
    borderColor: theme.colors.brand.primary,
  },
  dropdownTextArea: {
    flex: 1,
  },
  dropdownLabel: {
    color: theme.colors.text.muted,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.extrabold,
    marginBottom: theme.spacing.xs,
  },
  dropdownValue: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.black,
  },
  dropdownMeta: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.semibold,
    marginTop: theme.spacing.xs,
  },
  dropdownArrow: {
    color: theme.colors.text.brand,
    fontSize: theme.fontSizes["2xl"],
    fontWeight: theme.fontWeights.black,
  },
  dropdownPanel: {
    backgroundColor: theme.colors.background.subtle,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    padding: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  compactSearchInput: {
    backgroundColor: theme.colors.background.surface,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  compactPickerScroll: {
    maxHeight: 186,
  },
  compactList: {
    gap: theme.spacing.sm,
  },
  compactRow: {
    minHeight: 54,
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.md,
  },
  compactRowActive: {
    backgroundColor: theme.colors.brand.primarySoft,
    borderColor: theme.colors.brand.primary,
  },
  compactTextArea: {
    flex: 1,
  },
  compactName: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.black,
  },
  compactNameActive: {
    color: theme.colors.text.brand,
  },
  compactMeta: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.semibold,
    marginTop: theme.spacing.xs,
  },
  compactAction: {
    color: theme.colors.text.brand,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.black,
  },
  compactEmptyBox: {
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    padding: theme.spacing.md,
  },
  compactEmptyText: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.semibold,
  },
  compactResultHint: {
    color: theme.colors.text.muted,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.semibold,
    marginTop: theme.spacing.sm,
  },
  teamGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.md,
  },
  teamCard: {
    backgroundColor: theme.colors.background.subtle,
    borderRadius: theme.radius.lg,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
  },
  teamCardActive: {
    backgroundColor: theme.colors.brand.primarySoft,
    borderColor: theme.colors.brand.primarySoft,
  },
  teamName: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.black,
  },
  teamNameActive: {
    color: theme.colors.text.brand,
  },
  audienceGrid: {
    gap: theme.spacing.md,
  },
  audienceCard: {
    backgroundColor: theme.colors.background.subtle,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
  },
  audienceCardActive: {
    backgroundColor: theme.colors.brand.primarySoft,
    borderColor: theme.colors.brand.primarySoft,
  },
  audienceCardDisabled: {
    opacity: 0.42,
  },
  audienceTitle: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.black,
    marginBottom: theme.spacing.xs,
  },
  audienceTitleActive: {
    color: theme.colors.text.brand,
  },
  audienceSubtitle: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
    lineHeight: theme.lineHeights.md,
  },
  audienceSubtitleActive: {
    color: theme.colors.text.secondary,
  },
  disabledText: {
    color: theme.colors.text.muted,
  },
  cardPressed: {
    opacity: 0.84,
    transform: [{ scale: 0.99 }],
  },
  threadHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: theme.spacing.lg,
  },
  threadHeaderText: {
    flex: 1,
  },
  countPill: {
    alignSelf: "flex-start",
    backgroundColor: theme.colors.background.subtle,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
  },
  countText: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.black,
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