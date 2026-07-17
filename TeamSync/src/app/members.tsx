import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { theme } from "@/constants/theme";
import { authService } from "@/services/authService";
import { firestoreMemberManagementService } from "@/services/firestoreMemberManagementService";
