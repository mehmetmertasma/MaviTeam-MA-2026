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

<<<<<<< Updated upstream
type AudienceType =
  | "team"
  | "coaches"
  | "athletes"
  | "parents"
  | "admins"
  | "direct";
=======
type Contact = {
  id: string;
  name: string;
  role: MessageRole;
  team: string;
};
>>>>>>> Stashed changes

type DemoTeam = {
  id: string;
<<<<<<< Updated upstream
=======
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: MessageRole;
  text: string;
  time: string;
};

type ProfileData = {
>>>>>>> Stashed changes
  name: string;
  clubId: string;
};

<<<<<<< Updated upstream
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
=======
const MESSAGES_STORAGE_KEY = "teamsync_private_messages_data";
const PROFILE_STORAGE_KEY = "teamsync_profile_data";

const TEAM_CHAT_ID = "team-chat";
const INITIAL_VISIBLE_MESSAGE_LIMIT = 6;
const LOAD_MORE_MESSAGE_COUNT = 6;

const startingProfileData: ProfileData = {
  name: "Mert Asma",
  email: "mertasma7580@gmail.com",
  club: "İstanbul Voleybol Kulübü",
  team: "U16 Erkek",
  role: "Kulüp yöneticisi",
  season: "2026 Bahar",
  membership: "Kulüp öder, veli/sporcu ücretsiz",
};

const demoContacts: Contact[] = [
  {
    id: "admin-mert",
    name: "Admin Mert",
    role: "admin",
    team: "Kulüp Yönetimi",
  },
  {
    id: "coach-emre",
    name: "Coach Emre",
    role: "coach",
    team: "U16 Erkek",
>>>>>>> Stashed changes
  },
  {
    id: "parent-ayse",
    name: "Ayşe Veli",
    role: "parent",
<<<<<<< Updated upstream
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
=======
    team: "U16 Erkek",
>>>>>>> Stashed changes
  },
  {
    id: "athlete-mert",
    name: "Mert Asma",
    role: "athlete",
<<<<<<< Updated upstream
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
=======
    team: "U16 Erkek",
  },
  {
    id: "athlete-efe",
    name: "Efe Asma",
    role: "athlete",
    team: "U16 Erkek",
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
    id: "message-1",
    clubId: CLUB_ID,
    teamId: "team-u17-boys",
    audienceType: "team",
=======
    id: "1",
    conversationId: TEAM_CHAT_ID,
>>>>>>> Stashed changes
    senderId: "coach-emre",
    senderName: "Coach Emre",
    senderRole: "coach",
    text: "Bugünkü antrenman 18:30’da başlayacak. Lütfen 15 dakika erken gelin.",
    createdAt: "2026-06-26T14:30:00.000Z",
  },
  {
<<<<<<< Updated upstream
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
=======
    id: "2",
    conversationId: TEAM_CHAT_ID,
    senderId: "admin-mert",
    senderName: "Admin Mert",
    senderRole: "admin",
    text: "Salon girişinde kulüp kartlarınızı göstermeniz gerekiyor.",
    time: "09:40",
  },
  {
    id: "3",
    conversationId: getDirectConversationId("coach-emre", "parent-ayse"),
>>>>>>> Stashed changes
    senderId: "parent-ayse",
    senderName: "Ayşe Veli",
    senderRole: "parent",
    recipientUserId: "coach-emre",
    text: "Coach, Mert bugün okul etkinliği yüzünden 10 dakika geç kalabilir.",
    createdAt: "2026-06-27T13:15:00.000Z",
  },
  {
<<<<<<< Updated upstream
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
=======
    id: "4",
    conversationId: getDirectConversationId("coach-emre", "parent-ayse"),
    senderId: "coach-emre",
    senderName: "Coach Emre",
    senderRole: "coach",
    text: "Merhaba, maç pazar günü 14:00 gibi görünüyor. Netleşince duyuru atacağım.",
    time: "10:24",
  },
  {
    id: "5",
    conversationId: getDirectConversationId("coach-emre", "athlete-mert"),
    senderId: "athlete-mert",
    senderName: "Mert Asma",
    senderRole: "athlete",
    text: "Coach, bugün antrenmana gelebiliyorum.",
    time: "10:35",
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
function formatMessageTime(createdAt: string) {
  const date = new Date(createdAt);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleString("tr-TR", {
    month: "short",
    day: "numeric",
=======
function getDirectConversationId(firstUserId: string, secondUserId: string) {
  return [firstUserId, secondUserId].sort().join("__");
}

function getCurrentTime() {
  const now = new Date();

  return now.toLocaleTimeString("tr-TR", {
>>>>>>> Stashed changes
    hour: "2-digit",
    minute: "2-digit",
  });
}

<<<<<<< Updated upstream
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
=======
function canMessageContact(activeUser: Contact, contact: Contact) {
  if (activeUser.id === contact.id) {
    return false;
  }

  if (activeUser.role === "admin") {
    return true;
  }

  if (activeUser.role === "coach") {
    return (
      contact.role === "admin" ||
      contact.role === "parent" ||
      contact.role === "athlete"
    );
  }

  if (activeUser.role === "parent") {
    return contact.role === "admin" || contact.role === "coach";
  }

  return contact.role === "admin" || contact.role === "coach";
}

function normalizeSavedMessages(savedMessages: Message[]) {
  return savedMessages.filter(
    (message) =>
      typeof message.id === "string" &&
      typeof message.conversationId === "string" &&
      typeof message.senderId === "string" &&
      typeof message.senderName === "string" &&
      typeof message.text === "string"
  );
}

export default function MessagesScreen() {
  const [activeUser, setActiveUser] = useState<Contact>(demoContacts[1]);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(
    null
  );
  const [messages, setMessages] = useState<Message[]>(startingMessages);
  const [profileData, setProfileData] =
    useState<ProfileData>(startingProfileData);
  const [newMessage, setNewMessage] = useState("");
  const [visibleMessageLimit, setVisibleMessageLimit] = useState(
    INITIAL_VISIBLE_MESSAGE_LIMIT
  );
>>>>>>> Stashed changes
  const [statusMessage, setStatusMessage] = useState(
    "Mesajlar local storage ile kaydedilecek."
  );

<<<<<<< Updated upstream
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
=======
  const messageableContacts = useMemo(() => {
    return demoContacts.filter((contact) => canMessageContact(activeUser, contact));
  }, [activeUser]);

  const selectedContact = useMemo(() => {
    if (selectedContactId === null) {
      return null;
    }

    return demoContacts.find((contact) => contact.id === selectedContactId) ?? null;
  }, [selectedContactId]);

  const activeConversationId =
    selectedContact === null
      ? TEAM_CHAT_ID
      : getDirectConversationId(activeUser.id, selectedContact.id);

  const activeConversationTitle =
    selectedContact === null
      ? "Team Chat"
      : `${activeUser.name} ↔ ${selectedContact.name}`;

  const activeConversationDescription =
    selectedContact === null
      ? "Bu alan takım geneli mesajlar içindir. Buradaki mesajları herkes görebilir."
      : "Bu özel mesajı sadece gönderen kişi ve seçilen kişi görebilir.";

  const filteredMessages = useMemo(() => {
    return messages.filter((message) => {
      if (selectedContact === null) {
        return message.conversationId === TEAM_CHAT_ID;
      }

      return message.conversationId === activeConversationId;
    });
  }, [activeConversationId, messages, selectedContact]);
>>>>>>> Stashed changes

  const canSendCurrentMessage =
    draftText.trim().length > 0 &&
    canSendAudience(currentUser, selectedAudienceType, selectedTeamId) &&
    (selectedAudienceType !== "direct" || selectedDirectRecipient !== undefined);

<<<<<<< Updated upstream
  useEffect(() => {
    let screenIsActive = true;

=======
  function changeActiveUser(nextUser: Contact) {
    setActiveUser(nextUser);
    setSelectedContactId(null);
    setVisibleMessageLimit(INITIAL_VISIBLE_MESSAGE_LIMIT);
    setStatusMessage(`${nextUser.name} olarak mesaj ekranı açıldı.`);
  }

  function openTeamChat() {
    setSelectedContactId(null);
    setVisibleMessageLimit(INITIAL_VISIBLE_MESSAGE_LIMIT);
    setStatusMessage("Team Chat açıldı. Buradaki mesajları herkes görebilir.");
  }

  function openDirectMessage(contactId: string) {
    const contact = demoContacts.find((demoContact) => demoContact.id === contactId);

    setSelectedContactId(contactId);
    setVisibleMessageLimit(INITIAL_VISIBLE_MESSAGE_LIMIT);

    if (contact) {
      setStatusMessage(`${contact.name} ile özel mesaj açıldı.`);
    }
  }

  useEffect(() => {
>>>>>>> Stashed changes
    async function loadSavedMessages() {
      try {
        const savedMessages = await AsyncStorage.getItem(MESSAGES_STORAGE_KEY);
        const parsedMessages = parseSavedMessages(savedMessages);

        if (screenIsActive) {
          setMessages(parsedMessages);
          setStatusMessage("Kaydedilmiş mesajlar yüklendi.");
        }
<<<<<<< Updated upstream
=======

        const parsedMessages = JSON.parse(savedMessages) as Message[];
        const normalizedMessages = normalizeSavedMessages(parsedMessages);

        if (normalizedMessages.length === 0) {
          setMessages(startingMessages);
          setStatusMessage("Eski mesaj formatı temizlendi. Demo mesajlar yüklendi.");
          return;
        }

        setMessages(normalizedMessages);
        setStatusMessage("Kaydedilmiş mesajlar yüklendi.");
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
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
=======
    const messageToAdd: Message = {
      id: Date.now().toString(),
      conversationId: activeConversationId,
      senderId: activeUser.id,
      senderName: activeUser.name,
      senderRole: activeUser.role,
      text: trimmedMessage,
      time: getCurrentTime(),
>>>>>>> Stashed changes
    };

    const nextMessages = sortMessages([...messages, newMessage]);

    setDraftText("");
    await saveMessages(nextMessages);
  }

  async function resetDemoMessages() {
    try {
      await AsyncStorage.removeItem(MESSAGES_STORAGE_KEY);

<<<<<<< Updated upstream
      setMessages(initialMessages);
      setDraftText("");
      setSelectedDirectRecipientId(undefined);
      setRecipientSearchText("");
      setRecipientPickerIsOpen(false);
      setStatusMessage("Demo mesajlar sıfırlandı.");
=======
      setMessages(startingMessages);
      setNewMessage("");
      setSelectedContactId(null);
      setVisibleMessageLimit(INITIAL_VISIBLE_MESSAGE_LIMIT);
      setStatusMessage("Mesajlar demo haline sıfırlandı.");
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
              Grup mesajları ve küçük dropdown ile direct message.
=======
              Team Chat veya seçili kişiye özel mesaj gönder.
>>>>>>> Stashed changes
            </Text>
          </View>
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>Takım iletişimi</Text>

<<<<<<< Updated upstream
          <Text style={styles.heroTitle}>Messages</Text>

          <Text style={styles.heroSubtitle}>
            Kullanıcılar açık açık alt alta listelenmez. Direct Message için
            önce dropdown açılır, sonra isim aranır ve küçük listeden seçim
            yapılır.
=======
          <Text style={styles.heroTitle}>Private Messages</Text>

          <Text style={styles.heroSubtitle}>
            Şu an demo kullanıcı: {activeUser.name}. Profil adın kayıtlı:{" "}
            {profileData.name}. Team Chat herkese açıktır. Direct Message ise
            sadece seçilen kişiyle görünür.
>>>>>>> Stashed changes
          </Text>
        </View>

        <View style={styles.section}>
<<<<<<< Updated upstream
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
=======
          <Text style={styles.sectionTitle}>Demo kullanıcı seçimi</Text>

          <Text style={styles.sectionSubtitle}>
            Şimdilik gerçek login sistemi yok. Buradan farklı kullanıcı gibi
            davranıp mesaj gizliliğini test ediyoruz.
          </Text>

          <View style={styles.userGrid}>
            {demoContacts.map((contact) => {
              const isActive = activeUser.id === contact.id;

              return (
                <Pressable
                  key={contact.id}
                  onPress={() => changeActiveUser(contact)}
                  style={[
                    styles.userCard,
                    isActive && styles.userCardActive,
                  ]}
                >
                  <View style={styles.userTopRow}>
                    <View style={styles.avatar}>
                      <Text
                        style={[
                          styles.avatarText,
                          isActive && styles.avatarTextActive,
                        ]}
                      >
                        {contact.name
                          .split(" ")
                          .map((namePart) => namePart[0])
                          .join("")
                          .slice(0, 2)}
                      </Text>
                    </View>

                    <View style={styles.userInfo}>
                      <Text
                        style={[
                          styles.userName,
                          isActive && styles.userNameActive,
                        ]}
                      >
                        {contact.name}
                      </Text>

                      <Text
                        style={[
                          styles.userMeta,
                          isActive && styles.userMetaActive,
                        ]}
                      >
                        {getRoleLabel(contact.role)} · {contact.team}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kime mesaj atacaksın?</Text>

          <Text style={styles.sectionSubtitle}>
            Team Chat herkese gider. Aşağıdan kişi seçersen mesaj sadece sen ve
            o kişi arasında kalır.
          </Text>

          <Pressable
            onPress={openTeamChat}
            style={[
              styles.recipientCard,
              selectedContact === null && styles.recipientCardActive,
            ]}
          >
            <Text
              style={[
                styles.recipientTitle,
                selectedContact === null && styles.recipientTitleActive,
              ]}
            >
              Team Chat
            </Text>

            <Text
              style={[
                styles.recipientDescription,
                selectedContact === null && styles.recipientDescriptionActive,
              ]}
            >
              Takım geneli mesaj. Herkes görebilir.
            </Text>
          </Pressable>

          <View style={styles.recipientList}>
            {messageableContacts.map((contact) => {
              const isSelected = selectedContactId === contact.id;

              return (
                <Pressable
                  key={contact.id}
                  onPress={() => openDirectMessage(contact.id)}
                  style={[
                    styles.recipientCard,
                    isSelected && styles.recipientCardActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.recipientTitle,
                      isSelected && styles.recipientTitleActive,
                    ]}
                  >
                    {contact.name}
                  </Text>

                  <Text
                    style={[
                      styles.recipientDescription,
                      isSelected && styles.recipientDescriptionActive,
                    ]}
                  >
                    {getRoleLabel(contact.role)} · {contact.team} · Private
                    Message
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{activeConversationTitle}</Text>

          <Text style={styles.sectionSubtitle}>
            {activeConversationDescription}
          </Text>

          <View style={styles.messageCountBox}>
            <Text style={styles.messageCountText}>
              {filteredMessages.length} mesajdan {visibleMessages.length} tanesi
              gösteriliyor.
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
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
=======
          <View style={styles.messageList}>
            {visibleMessages.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>Henüz mesaj yok</Text>

                <Text style={styles.emptyText}>
                  Bu konuşmada görünen ilk mesajı sen gönderebilirsin.
                </Text>
              </View>
            ) : (
              visibleMessages.map((message) => {
                const isOwnMessage = message.senderId === activeUser.id;
>>>>>>> Stashed changes

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
<<<<<<< Updated upstream
            Hedef: {" "}
            {selectedAudienceType === "direct"
              ? selectedDirectRecipient?.name ?? "Kişi seçilmedi"
              : selectedAudience?.title}
=======
            Mesaj şu konuşmaya gönderilecek: {activeConversationTitle}
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
            Gerçek sistemde bu demo kullanıcı seçici olmayacak. Auth ile giriş
            yapan kullanıcı kimse, Firestore sadece onun clubId, teamId, role ve
            direct participant izinlerine göre mesajları gösterecek.
=======
            Gerçek sistemde her direct message için özel bir conversationId
            olacak. Firestore sadece o konuşmanın participant listesinde olan
            kullanıcıya mesajları gösterecek. Böylece bir veli başka velinin
            özel mesajını göremeyecek.
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
  dropdownButton: {
=======
  userGrid: {
    gap: theme.spacing.md,
  },
  userCard: {
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
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
=======
  userCardActive: {
    backgroundColor: theme.colors.brand.primary,
    borderColor: theme.colors.brand.primary,
  },
  userTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.brand.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: theme.colors.text.brand,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.black,
  },
  avatarTextActive: {
    color: theme.colors.text.brand,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.black,
>>>>>>> Stashed changes
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.black,
  },
<<<<<<< Updated upstream
  teamNameActive: {
    color: theme.colors.text.brand,
  },
  audienceGrid: {
    gap: theme.spacing.md,
  },
  audienceCard: {
=======
  userNameActive: {
    color: theme.colors.text.inverse,
  },
  userMeta: {
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.semibold,
    color: theme.colors.text.secondary,
  },
  userMetaActive: {
    color: theme.colors.text.inverse,
  },
  recipientList: {
    gap: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  recipientCard: {
    backgroundColor: theme.colors.background.subtle,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
  },
  recipientCardActive: {
    backgroundColor: theme.colors.brand.primarySoft,
    borderColor: theme.colors.brand.primarySoft,
  },
  recipientTitle: {
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.black,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  recipientTitleActive: {
    color: theme.colors.text.brand,
  },
  recipientDescription: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
    color: theme.colors.text.secondary,
    lineHeight: theme.lineHeights.md,
  },
  recipientDescriptionActive: {
    color: theme.colors.text.secondary,
  },
  messageCountBox: {
>>>>>>> Stashed changes
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