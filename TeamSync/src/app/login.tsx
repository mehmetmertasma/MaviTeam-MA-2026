import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { AppBackButton } from "@/components/AppBackButton";
import { AppButton } from "@/components/AppButton";
import { ScreenCard } from "@/components/ScreenCard";
import { theme } from "@/constants/theme";
import { useTranslation } from "@/localization";
import { authService, getAuthErrorMessage } from "@/services/authService";

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

      setStatusMessage(t.auth.loginSuccess