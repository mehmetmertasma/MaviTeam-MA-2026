import { router } from "expo-router";

import { AppBackButton } from "@/components/AppBackButton";
import { AppScreenLayout } from "@/components/AppScreenLayout";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { theme } from "@/constants/theme";
import { useTranslation } from "@/localization";
import { StyleSheet, Text, View } from "react-native";

type LegalSection = { title: string; body: string };

const LAST_UPDATED = "1 Ağustos 2026 / August 1, 2026";
const CONTACT_EMAIL = "support@maviteam.com";

function getCopy(language: "tr" | "en") {
  if (language === "en") {
    return {
      eyebrow: "Legal",
      title: "Terms of Service",
      subtitle: `Last updated: ${LAST_UPDATED}`,
      intro:
        "These Terms govern your use of MaviTeam. By creating an account or using the app, you agree to these Terms. If you're using MaviTeam on behalf of a club, you're confirming you have the authority to accept these Terms for that club.",
      sections: [
        {
          title: "1. The service",
          body: "MaviTeam is a club management platform that helps sports clubs organize teams, schedules, attendance, announcements, messaging, and payment tracking. MaviTeam does not currently process real payment transactions — payment records in the app track amounts and status only; any actual money changes hands outside the app, between your club and its members.",
        },
        {
          title: "2. Your account",
          body: "You must provide accurate registration information and keep your password secure. You're responsible for activity that happens under your account. Tell us immediately if you suspect unauthorized access.",
        },
        {
          title: "3. Roles and permissions",
          body: "Your access to features depends on your role (club admin, coach, parent, or athlete) as set by your club. Club admins and coaches can view and manage more member data than parents and athletes, in line with what's needed to run the club — see our Privacy Policy for how that's enforced.",
        },
        {
          title: "4. Club admin responsibilities",
          body: "If you administer a club on MaviTeam, you're responsible for the lawfulness of the data you and your coaches add about members (including minors), for obtaining any consents your local law requires, and for removing members who should no longer have access.",
        },
        {
          title: "5. Acceptable use",
          body: "Don't use MaviTeam to harass or harm others, don't attempt to access data outside your role's permissions, don't attempt to disrupt or reverse-engineer the service, and don't post content you don't have the right to share.",
        },
        {
          title: "6. Intellectual property",
          body: "MaviTeam and its branding belong to us. Content you post (messages, announcements, replays you link) remains yours, but you grant us the right to store and display it within the app as part of providing the service.",
        },
        {
          title: "7. Availability and changes",
          body: "We aim to keep the service available and reliable, but we don't guarantee uninterrupted access. We may update or discontinue features as the product evolves.",
        },
        {
          title: "8. Limitation of liability",
          body: "MaviTeam is provided \"as is.\" To the extent permitted by law, we aren't liable for indirect or consequential damages arising from your use of the app, including disputes between clubs and their members over payments tracked (but not processed) in the app.",
        },
        {
          title: "9. Termination",
          body: "You can stop using MaviTeam and request account deletion at any time. We may suspend or terminate accounts that violate these Terms or that we reasonably believe pose a risk to other users or the service.",
        },
        {
          title: "10. Governing law",
          body: "These Terms are governed by the laws of Türkiye, without regard to conflict-of-law principles, unless local law requires otherwise for your jurisdiction.",
        },
        {
          title: "11. Changes to these Terms",
          body: "If we make material changes, we'll update the date above and, where appropriate, notify you in the app.",
        },
        {
          title: "12. Contact",
          body: `Questions about these Terms can be sent to ${CONTACT_EMAIL}.`,
        },
      ] satisfies LegalSection[],
    };
  }

  return {
    eyebrow: "Yasal",
    title: "Kullanım Koşulları",
    subtitle: `Son güncelleme: ${LAST_UPDATED}`,
    intro:
      "Bu Kullanım Koşulları, MaviTeam'i kullanımınızı düzenler. Bir hesap oluşturarak veya uygulamayı kullanarak bu Koşulları kabul etmiş olursunuz. MaviTeam'i bir kulüp adına kullanıyorsanız, bu Koşulları o kulüp adına kabul etme yetkiniz olduğunu onaylamış olursunuz.",
    sections: [
      {
        title: "1. Hizmet",
        body: "MaviTeam; spor kulüplerinin takımlarını, programını, yoklamasını, duyurularını, mesajlaşmasını ve ödeme takibini organize etmesine yardımcı olan bir kulüp yönetim platformudur. MaviTeam şu anda gerçek ödeme işlemleri gerçekleştirmemektedir — uygulamadaki ödeme kayıtları yalnızca tutar ve durumu takip eder; gerçek para hareketi uygulama dışında, kulübünüz ile üyeleri arasında gerçekleşir.",
      },
      {
        title: "2. Hesabınız",
        body: "Kayıt sırasında doğru bilgi vermeli ve şifrenizi güvende tutmalısınız. Hesabınız altında gerçekleşen faaliyetlerden siz sorumlusunuz. Yetkisiz erişimden şüphelenirseniz bize derhal bildirin.",
      },
      {
        title: "3. Roller ve yetkiler",
        body: "Özelliklere erişiminiz, kulübünüz tarafından belirlenen rolünüze (kulüp yöneticisi, koç, veli veya sporcu) bağlıdır. Kulüp yöneticileri ve koçlar, kulübü yönetmek için gereken ölçüde, veli ve sporculardan daha fazla üye verisini görüntüleyip yönetebilir — bunun nasıl uygulandığını Gizlilik Politikamızda bulabilirsiniz.",
      },
      {
        title: "4. Kulüp yöneticisi sorumlulukları",
        body: "MaviTeam üzerinde bir kulübü yönetiyorsanız; siz ve koçlarınızın üyeler (reşit olmayanlar dahil) hakkında eklediği verilerin hukuka uygunluğundan, yerel mevzuatınızın gerektirdiği izinlerin alınmasından ve artık erişimi olmaması gereken üyelerin kaldırılmasından siz sorumlusunuz.",
      },
      {
        title: "5. Kabul edilebilir kullanım",
        body: "MaviTeam'i başkalarını taciz etmek veya zarar vermek için kullanmayın, rolünüzün izin verdiği yetkinin dışındaki verilere erişmeye çalışmayın, hizmeti aksatmaya veya tersine mühendislik yapmaya çalışmayın ve paylaşma hakkınız olmayan içerikleri paylaşmayın.",
      },
      {
        title: "6. Fikri mülkiyet",
        body: "MaviTeam ve markası bize aittir. Paylaştığınız içerikler (mesajlar, duyurular, bağladığınız video linkleri) size ait kalır; ancak bunları hizmeti sunmanın bir parçası olarak uygulama içinde saklama ve gösterme hakkını bize verirsiniz.",
      },
      {
        title: "7. Kullanılabilirlik ve değişiklikler",
        body: "Hizmeti erişilebilir ve güvenilir tutmayı hedefliyoruz, ancak kesintisiz erişim garanti etmiyoruz. Ürün geliştikçe özellikleri güncelleyebilir veya kaldırabiliriz.",
      },
      {
        title: "8. Sorumluluğun sınırlandırılması",
        body: "MaviTeam \"olduğu gibi\" sunulur. Yasaların izin verdiği ölçüde, uygulamayı kullanımınızdan kaynaklanan dolaylı zararlardan — uygulama içinde takip edilen ancak işlenmeyen ödemeler konusunda kulüpler ile üyeleri arasındaki anlaşmazlıklar dahil — sorumlu değiliz.",
      },
      {
        title: "9. Fesih",
        body: "MaviTeam'i kullanmayı istediğiniz zaman durdurabilir ve hesabınızın silinmesini talep edebilirsiniz. Bu Koşulları ihlal eden veya diğer kullanıcılar ya da hizmet için makul bir risk oluşturduğuna inandığımız hesapları askıya alabilir veya sonlandırabiliriz.",
      },
      {
        title: "10. Uygulanacak hukuk",
        body: "Bu Koşullar, bulunduğunuz yargı alanının yerel mevzuatı aksini gerektirmedikçe, kanunlar ihtilafı kurallarına bakılmaksızın Türkiye Cumhuriyeti kanunlarına tabidir.",
      },
      {
        title: "11. Bu Koşullardaki değişiklikler",
        body: "Önemli bir değişiklik yaparsak yukarıdaki tarihi güncelleriz ve gerekli görüldüğünde uygulama içinden sizi bilgilendiririz.",
      },
      {
        title: "12. İletişim",
        body: `Bu Koşullar hakkındaki sorularınızı ${CONTACT_EMAIL} adresine iletebilirsiniz.`,
      },
    ] satisfies LegalSection[],
  };
}

export default function TermsOfServiceScreen() {
  const { language } = useTranslation();
  const copy = getCopy(language === "en" ? "en" : "tr");

  return (
    <AppScreenLayout variant="standard">
      <AppBackButton fallbackHref="/" onPress={() => (router.canGoBack() ? router.back() : router.replace("/" as never))} />
      <PageHeader eyebrow={copy.eyebrow} title={copy.title} subtitle={copy.subtitle} />

      <Card style={styles.introCard}>
        <Text style={styles.introText}>{copy.intro}</Text>
      </Card>

      {copy.sections.map((section) => (
        <Card key={section.title} style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <Text style={styles.sectionBody}>{section.body}</Text>
        </Card>
      ))}

      <View style={styles.footerSpacer} />
    </AppScreenLayout>
  );
}

const styles = StyleSheet.create({
  introCard: { marginBottom: theme.spacing["2xl"] },
  introText: {
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.regular,
    color: theme.colors.text.secondary,
    lineHeight: theme.lineHeights.xl,
  },
  sectionCard: { marginBottom: theme.spacing.lg },
  sectionTitle: {
    fontSize: theme.fontSizes.xl,
    fontWeight: theme.fontWeights.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  sectionBody: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.regular,
    color: theme.colors.text.secondary,
    lineHeight: theme.lineHeights.lg,
  },
  footerSpacer: { height: theme.spacing["2xl"] },
});
