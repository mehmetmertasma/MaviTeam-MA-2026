import AsyncStorage from "@react-native-async-storage/async-storage";

import { initialTeamSyncData } from "@/data/initialTeamSyncData";
import { authService } from "@/services/authService";
import { firestoreTeamSyncService } from "@/services/firestoreTeamSyncService";
import type {
  Announcement,
  AttendanceRecord,
  AttendanceStatus,
  ChatGroup,
  ChatMessage,
  Club,
