import { useEffect } from "react";
import type { PropsWithChildren } from "react";
import { Stack, router, usePathname } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Text, View } from "react-native";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";

import { AppGlobalNavigation } from "@/components/AppGlobalNavigation";
import { AuthProvider, useAuthContext } from "@/providers/AuthProvider";
import { LanguageProvider, useTranslation } from "@/localization";
import { firestoreTeamSyncService } from "@/services/firestoreTeamSyncService";

export const unstable_settings = {
  initialRouteName: "index",
};

const APP_BACKGROUND_COLOR = "#0f172a";
const GLOBAL_NAV_TOP