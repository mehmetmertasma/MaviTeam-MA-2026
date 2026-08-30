import { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { TextField } from "@/components/TextField";
import { theme } from "@/constants/theme";
import type { IyzicoSubMerchantInput } from "@/services/paymentGatewayService";

type IyzicoSubMerchantModalProps = {
  isSaving: boolean;
  errorMessage: string;
  onSave: (input: IyzicoSubMerchantInput) => void;
  onClose: () => void;
  language: "tr" | "en";
};

const EMPTY_FORM: IyzicoSubMerchantInput = {
  name: "",
  contactName: "",
  contactSurname: "",
  email: "",
  gsmNumber: "",
  address: "",
  iban: "",
  identityNumber: "",
};

function getCopy(language: "tr" | "en") {
  const en = language === "en";

  return {
    title: en ? "Connect your iyzico account" : "iyzico hesabını bağla",
    subtitle: en
      ? "iyzico has no hosted setup page for this, so we need these business details directly. Personal (individual) sub-merchants only for now."
      : "iyzico bunun için barındırılan bir kurulum sayfası sunmuyor, bu yüzden bu işletme bilgilerine doğrudan ihtiyacımız var. Şimdilik yalnızca şahıs (bireysel) alt üye işyeri destekleniyor.",
    closeAccessibilityLabel: en ? "Close" : "Kapat",
    nameLabel: en ? "Business / club name" : "İşletme / kulüp adı",
    contactNameLabel: en ? "Contact first name" : "Yetkili adı",
    contactSurnameLabel: en ? "Contact last name" : "Yetkili soyadı",
    emailLabel: en ? "Email" : "E-posta",
    gsmNumberLabel: en ? "Phone" : "Telefon",
    addressLabel: en ? "Address" : "Adres",
    ibanLabel: en ? "IBAN" : "IBAN",
    identityNumberLabel: en ? "National ID (TC Kimlik No)" : "TC Kimlik No",
    requiredError: en ? "All fields are required." : "Tüm alanlar zorunlu.",
    save: en ? "Connect account" : "Hesabı bağla",
    saving: en ? "Connecting..." : "Bağlanıyor...",
    cancel: en ? "Cancel" : "Vazgeç",
  };
}

export function IyzicoSubMerchantModal({ isSaving, errorMessage, onSave, onClose, language }: IyzicoSubMerchantModalProps) {
  const copy = getCopy(language);
  const [form, setForm] = useState<IyzicoSubMerchantInput>(EMPTY_FORM);
  const [validationError, setValidationError] = useState("");

  function updateField(field: keyof IyzicoSubMerchantInput, value: string) {
    setForm((currentForm) => ({ ...currentForm, [field]: value }));
  }

  function handleSave() {
    const hasEmptyField = Object.values(form).some((value) => value.trim() === "");

    if (hasEmptyField) {
      setValidationError(copy.requiredError);
      return;
    }

    setValidationError("");
    onSave(form);
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

            <TextField label={copy.nameLabel} value={form.name} onChangeText={(value) => updateField("name", value)} containerStyle={styles.field} />
            <View style={styles.formGrid}>
              <TextField
                label={copy.contactNameLabel}
                value={form.contactName}
                onChangeText={(value) => updateField("contactName", value)}
                containerStyle={styles.formField}
              />
              <TextField
                label={copy.contactSurnameLabel}
                value={form.contactSurname}
                onChangeText={(value) => updateField("contactSurname", value)}
                containerStyle={styles.formField}
              />
            </View>
            <TextField
              label={copy.emailLabel}
              value={form.email}
              onChangeText={(value) => updateField("email", value)}
              autoCapitalize="none"
              keyboardType="email-address"
              containerStyle={styles.field}
            />
            <TextField
              label={copy.gsmNumberLabel}
              value={form.gsmNumber}
              onChangeText={(value) => updateField("gsmNumber", value)}
              keyboardType="phone-pad"
              containerStyle={styles.field}
            />
            <TextField label={copy.addressLabel} value={form.address} onChangeText={(value) => updateField("address", value)} containerStyle={styles.field} />
            <TextField
              label={copy.identityNumberLabel}
              value={form.identityNumber}
              onChangeText={(value) => updateField("identityNumber", value)}
              keyboardType="number-pad"
              maxLength={11}
              containerStyle={styles.field}
            />
            <TextField
              label={copy.ibanLabel}
              value={form.iban}
              onChangeText={(value) => updateField("iban", value.toUpperCase())}
              autoCapitalize="characters"
              containerStyle={styles.field}
            />

            {(validationError || errorMessage) !== "" ? <Text style={styles.errorText}>{validationError || errorMessage}</Text> : null}

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

export default IyzicoSubMerchantModal;

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
  formGrid: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.lg },
  formField: { flex: 1, minWidth: 180, marginBottom: theme.spacing.lg },
  errorText: { color: theme.colors.text.danger, fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.medium, marginBottom: theme.spacing.md },
  actionRow: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm },
  actionButton: { flexGrow: 1, minWidth: 120 },
  pressed: { opacity: 0.84, transform: [{ scale: 0.99 }] },
});
