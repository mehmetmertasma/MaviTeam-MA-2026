import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { AppBackButton } from "@/components/AppBackButton";
import { AppButton } from "@/components/AppButton";
import { ScreenCard } from "@/components/ScreenCard";
import { theme } from "@/constants/theme";
import { useTranslation } from "@/localization";
import { authService, getAuthErrorMessage } from "@/services/authService";
import { firestoreTeamSyncService } from "@/services/firestoreTeamSyncService";

function isValidEmail(value: string) {
  const trimmedValue = value.trim();
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  return emailPattern.test(trimmedValue);
}

export default function LoginScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const firebaseIsReady = authService.isConfigured();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState(
    firebaseIsReady ? t.auth.firebaseReadyLogin : t.auth.firebaseMissingLogin
  );
  const [error, setError] = useState("");

  function clearErrorOnChange() {
    if (error !== "") {
      setError("");
    }
  }

  async function handleLogin() {
    const trimmedEmail = email.trim().toLowerCase();

    if (!firebaseIsReady) {
      setError(t.auth.validation.firebaseMissing);
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      setError(t.auth.validation.emailInvalid);
      return;
    }

    if (password.trim() === "") {
      setError(t.auth.validation.passwordRequired);
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");
      setStatusMessage(t.auth.loginInProgress);

      await authService.loginWithEmail({ email: trimmedEmail, password });
      const refreshedUser = await authService.refreshCurrentUser();

      await firestoreTeamSyncService.ensureUserProfile({
        user: refreshedUser,
        role: "clubAdmin",
        status: "emailVerified",
      });

      const workspace = await firestoreTeamSyncService.getCurrentWorkspace(refreshedUser);
      setStatusMessage(t.auth.loginSuccess);

      if (workspace === null || workspace.club === null) {
        router.replace("/create-club" as never);
        return;
      }

      if (workspace.currentUser.status === "pending") {
        router.replace("/join-request-sent" as never);
        return;
      }

      router.replace("/dashboard" as never);
    } catch (loginError) {
      setError(getAuthErrorMessage(loginError));
      setStatusMessage(t.auth.loginFailed);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handlePasswordReset() {
    const trimmedEmail = email.trim().toLowerCase();

    if (!firebaseIsReady) {
      setError(t.auth.validation.firebaseMissing);
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      setError(t.auth.validation.resetEmailRequired);
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");
      await authService.sendPasswordReset(trimmedEmail);
      setStatusMessage(t.auth.resetLinkSent);
    } catch (resetError) {
      setError(getAuthErrorMessage(resetError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.screen}>
      <ScreenCard style={styles.card}>
        <AppBackButton fallbackHref="/" />

        <Text style={styles.logo}>{t.common.appName}</Text>
        <Text style={styles.badge}>{t.auth.loginBadge}</Text>

        <Text style={styles.title}>{t.auth.loginTitle}</Text>

        <Text style={styles.subtitle}>{t.auth.loginSubtitle}</Text>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>{t.auth.loginBadge}</Text>
          <Text style={styles.infoText}>{statusMessage}</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t.auth.emailLabel}</Text>
            <TextInput
              style={styles.input}
              placeholder