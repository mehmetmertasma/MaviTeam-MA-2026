import { useEffect } from "react";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import type { User } from "firebase/auth";

import { firestoreTeamSyncService } from "@/services/firestoreTeamSyncService";

// Foreground notifications don't show a banner unless a handler is set --
// this runs once at module load, not per-render.
if (Platform.OS !== "web") {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

// Registers this device's Expo push token against the signed-in user's own
// Firestore profile (see firestoreTeamSyncService.registerPushToken) so the
// Cloud Function triggers (onChatMessageCreated etc.) can look tokens up by
// user id. Push isn't part of the web target or Expo Go on iOS (SDK 53+
// dropped remote push there) -- both are skipped rather than left to fail.
export function usePushNotificationRegistration(firebaseUser: User | null) {
  useEffect(() => {
    if (firebaseUser === null || !firebaseUser.emailVerified || Platform.OS === "web" || !Device.isDevice) {
      return;
    }

    const signedInUser = firebaseUser;
    let isActive = true;

    async function register() {
      try {
        if (Platform.OS === "android") {
          await Notifications.setNotificationChannelAsync("default", {
            name: "default",
            importance: Notifications.AndroidImportance.DEFAULT,
          });
        }

        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== "granted") {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus !== "granted" || !isActive) {
          return;
        }

        const { data: expoPushToken } = await Notifications.getExpoPushTokenAsync();

        if (!isActive) {
          return;
        }

        await firestoreTeamSyncService.registerPushToken(signedInUser, expoPushToken);
      } catch (registrationError) {
        console.warn("[usePushNotificationRegistration] Could not register push token.", registrationError);
      }
    }

    register();

    return () => {
      isActive = false;
    };
  }, [firebaseUser]);
}
