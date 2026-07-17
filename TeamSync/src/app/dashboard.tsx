import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { theme } from "@/constants/theme";
import { initialTeamSyncData } from "@/data/initialTeamSyncData";
import { useTranslation } from "@/localization";
import { teamSyncService } from "@/services/team