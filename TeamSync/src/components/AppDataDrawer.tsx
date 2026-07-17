import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { theme } from "@/constants/theme";
import { useTranslation } from "@/localization";
import { authService } from "@/services/authService";
import { teamSyncService } from "@/services/teamSyncService";
import type { TeamSyncAppData, UserRole } from "@/types/team