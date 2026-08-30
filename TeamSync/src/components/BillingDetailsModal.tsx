import { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { TextField } from "@/components/TextField";
import { theme } from "@/constants/theme";
import type { BillingDetails } from "@/types/teamSync";

type BillingDetailsModalProps = {
  initialValues?: BillingDetails;
  isSaving: boolean;
  onSave: (details: BillingDetails) => void;
  onClose: () => void;
  language: "tr" | "en";
};

// iyzico's checkout API requires the payer's national ID, phone, and
// address on every online payment -- this is collected once here and
// reused (see UserProfile.billingDetails) instead of asked for again.
function isValidNationalId(value: string) {
  return /^[0-9]{11}$/.test(value.trim());
}

function getCopy(language: "tr" | "en") {
  const en = language === "en";

  return {
    title: en ? "Billing details" : "Fatura bilgileri",
    subtitle: en
      ? "Required once before paying online -- the payment provider needs this to verify who is paying."
      : "Online ödeme yapmadan önce bir kez gerekli -- ödeme sağlayıcısı ödemeyi kimin yaptığını doğrulamak için bunu istiyor.",
    closeAccessibilityLabel: en ? "Close billing details" : "Fatura bilgilerini kapat",
    nationalIdLabel: en ? "National ID (TC Kimlik No)" : "TC Kimlik No",
    nationalIdPlaceholder: en ? "11-digit ID number" : "11 haneli kimlik numarası",
    nationalIdError: en ? "Enter a valid 11-digit national ID." : "Geçerli 11 haneli bir TC kimlik numarası gir.",
    phoneLabel: en ? "Phone" : "Telefon",
    phonePlaceholder: en ? "E.g. +905551112233" : "Örn. +905551112233",
    addressLabel: en ? "Address" : "Adres",
    addressPlaceholder: en ? "Street, district" : "Sokak, mahalle",
    cityLabel: en ? "City" : "Şehir",
    cityPlaceholder: en ? "E.g. Istanbul" : "Örn. İstanbul",
    requiredError: en ? "All fields are required." : "Tüm alanlar zorunlu.",
    save: en ? "Save and continue" : "Kaydet ve devam et",
    saving: en ? "Saving..." : "Kaydediliyor...",
    cancel: en ? "Cancel" : "Vazgeç",
  };
}

export function BillingDetailsModal({ initialValues, isSaving, onSave, onClose, language }: BillingDetailsModalProps) {
  const copy = getCopy(language);
  const [nationalId, setNationalId] = useState(initialValues?.nationalId ?? "");
  const [phone, setPhone] = useState(initialValues?.phone ?? "");
  const [address, setAddress] = useState(initialValues?.address ?? "");
  const [city, setCity] = useState(initialValues?.city ?? "");
  const [errorMessage, setErrorMessage] = useState("");

  function handleSave() {
    if (phone.trim() === "" || address.trim() === "" || city.trim() === "") {
      setErrorMessage(copy.requiredError);
      return;
    }

    if (!isValidNationalId(nationalId)) {
      setErrorMessage(copy.nationalIdError);
      return;
    }

    setErrorMessage("");
    onSave({ nationalId: nationalId.trim(), phone: phone.trim(), address: address.trim(), city: city.trim() });
  }

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel={copy.closeAccessibilityLabel}>
        <Pressable style={styles.panel} onPress={(pressEvent) => pressEvent.stopPropagation()}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.header}>
              <View style={styles.headerText}>
                <Text style={styles.title}>{copy.title}</Text>
                <Text style={styles.subtitle}>{copy.subtitle}</Text>
              </View>
              <Pressable
                onPress={onClose}
                style={({ pressed }) => [styles.closeButton, pressed ? styles.pressed : null]}
                accessibilityLabel={copy.closeAccessibilityLabel}
              >
                <Text style={styles.closeButtonText}>×</Text>
              </Pressable>
            </View>

            <TextField
              label={copy.nationalIdLabel}
              value={nationalId}
              onChangeText={setNationalId}
              placeholder={copy.nationalIdPlaceholder}
              keyboardType="number-pad"
              maxLength={11}
              containerStyle={styles.field}
            />
            <TextField
              label={copy.phoneLabel}
              value={phone}
              onChangeText={setPhone}
              placeholder={copy.phonePlaceholder}
              keyboardType="phone-pad"
              containerStyle={styles.field}
            />
            <TextField
              label={copy.addressLabel}
              value={address}
              onChangeText={setAddress}
              placeholder={copy.addressPlaceholder}
              containerStyle={styles.field}
            />
            <TextField
              label={copy.cityLabel}
              value={city}
              onChangeText={setCity}
              placeholder={copy.cityPlaceholder}
              containerStyle={styles.field}
            />

            {errorMessage !== "" ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

            <View style={styles.actionRow}>
              <AppButton title={isSaving ? copy.saving : copy.save} disabled={isSaving} onPress={handleSave} style={styles.actionButton} />
              <AppButton title={copy.cancel} variant="ghost" disabled={isSaving} onPress={onClose} style={styles.actionButton} />
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default BillingDetailsModal;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing.xl,
    backgroundColor: theme.colors.overlay,
  },
  panel: {
    width: "100%",
    maxWidth: 480,
    maxHeight: "88%",
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.brand.primarySoft,
    ...theme.shadows.lg,
  },
  scrollContent: { padding: theme.spacing.lg },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  headerText: { flex: 1, minWidth: 0 },
  title: { color: theme.colors.text.primary, fontSize: theme.fontSizes.xl, fontWeight: theme.fontWeights.semibold },
  subtitle: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.regular, marginTop: theme.spacing.xxs },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.background.subtle,
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonText: { color: theme.colors.text.primary, fontSize: theme.fontSizes.xl, fontWeight: theme.fontWeights.semibold, marginTop: -2 },
  field: { marginBottom: theme.spacing.lg },
  errorText: { color: theme.colors.text.danger, fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.medium, marginBottom: theme.spacing.md },
  actionRow: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm },
  actionButton: { flexGrow: 1, minWidth: 120 },
  pressed: { opacity: 0.84, transform: [{ scale: 0.99 }] },
});
