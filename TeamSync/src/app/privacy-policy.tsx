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
const CONTACT_EMAIL = "privacy@maviteam.com";

function getCopy(language: "tr" | "en") {
  if (language === "en") {
    return {
      eyebrow: "Legal",
      title: "Privacy Policy",
      subtitle: `Last updated: ${LAST_UPDATED}`,
      intro:
        "This Privacy Policy explains what personal data MaviTeam collects through the app, why we collect it, who we share it with, and the rights you have over it. MaviTeam is a club management platform for sports clubs, coaches, parents, and athletes.",
      sections: [
        {
          title: "1. Who controls this data",
          body: "MaviTeam is the data controller for information processed through the app. If your club has its own legal entity, your club is the data controller for club-specific records (rosters, attendance, payments) and MaviTeam acts as its data processor, since each club's data is isolated from every other club in our systems.",
        },
        {
          title: "2. Data we collect",
          body: "Account data: full name, email address, and password (stored securely by Firebase Authentication, never in plain text). Club data: club name, city, sport, and a join code. Membership data: your role (club admin, coach, parent, or athlete), team assignments, and membership status. Activity data: schedule events and practice/match attendance records, announcements, in-app messages (direct and group), and payment status entries (amount and paid/unpaid/late — we do not process card numbers or bank details anywhere in the app). Technical data: authentication session tokens and basic app usage needed to keep the service working.",
        },
        {
          title: "3. Why we collect it",
          body: "To create and secure your account, to let your club organize teams, schedules, attendance, announcements, messaging, and payment tracking, to send you account verification and important service emails, and to enforce that each club's data stays isolated from other clubs and that only appropriately authorized roles (e.g. coaches and club admins) can view or edit sensitive records.",
        },
        {
          title: "4. Who we share it with",
          body: "We use Google Firebase (Authentication, Cloud Firestore, Storage, Cloud Functions, Hosting) to run the app's backend, and Resend to deliver verification emails. Both act as data processors under contract and do not use your data for their own purposes. We do not sell your personal data, and we do not share it with advertisers.",
        },
        {
          title: "5. Children's data",
          body: "MaviTeam is used by youth sports clubs, and some athlete accounts may belong to minors. Clubs and parents are responsible for ensuring a minor's account is created and managed appropriately, with parental awareness. We do not knowingly collect more data from a minor than is needed to participate in their club's activities (name, team assignment, attendance, and schedule visibility), and we do not use children's data for marketing.",
        },
        {
          title: "6. How long we keep data",
          body: "We keep your data for as long as your account and your club's workspace remain active. If you delete your account or your club is closed, we remove or anonymize personal data within a reasonable period, except where we're required to retain records for legal or security reasons.",
        },
        {
          title: "7. Your rights",
          body: "Under Turkey's Personal Data Protection Law (KVKK) and comparable data protection laws, you can ask us whether we process your data, request a copy of it, ask us to correct inaccurate data, ask us to delete it, and object to processing you believe is unlawful. To exercise any of these rights, contact us using the details below.",
        },
        {
          title: "8. Security",
          body: "Access to club data is enforced through server-side security rules: every record is scoped to its club, and further restricted by role and team so that, for example, a parent can only see their own team's attendance, never another team's or another club's.",
        },
        {
          title: "9. Changes to this policy",
          body: "If we make material changes to this policy, we'll update the date above and, where appropriate, notify you in the app.",
        },
        {
          title: "10. Contact",
          body: `Questions about this policy or your data can be sent to ${CONTACT_EMAIL}.`,
        },
      ] satisfies LegalSection[],
    };
  }

  return {
    eyebrow: "Yasal",
    title: "Gizlilik Politikası",
    subtitle: `Son güncelleme: ${LAST_UPDATED}`,
    intro:
      "Bu Gizlilik Politikası, MaviTeam'in uygulama üzerinden hangi kişisel verileri topladığını, neden topladığını, kimlerle paylaştığını ve bu veriler üzerindeki haklarınızı açıklar. MaviTeam; spor kulüpleri, koçlar, veliler ve sporcular için bir kulüp yönetim platformudur.",
    sections: [
      {
        title: "1. Veri sorumlusu kimdir",
        body: "Uygulama üzerinden işlenen bilgiler için veri sorumlusu MaviTeam'dir. Kulübünüzün ayrı bir tüzel kişiliği varsa, kulübe özel kayıtlar (üye listesi, yoklama, ödemeler) için veri sorumlusu kulübünüzdür; MaviTeam bu durumda veri işleyen sıfatıyla hareket eder, zira her kulübün verisi sistemlerimizde diğer kulüplerden izole tutulur.",
      },
      {
        title: "2. Topladığımız veriler",
        body: "Hesap verileri: ad soyad, e-posta adresi ve şifre (Firebase Authentication tarafından güvenli şekilde saklanır, hiçbir zaman düz metin olarak tutulmaz). Kulüp verileri: kulüp adı, şehir, spor branşı ve katılım kodu. Üyelik verileri: rolünüz (kulüp yöneticisi, koç, veli veya sporcu), takım ataması ve üyelik durumu. Faaliyet verileri: program etkinlikleri ve antrenman/maç yoklama kayıtları, duyurular, uygulama içi mesajlar (bireysel ve grup), ödeme durumu kayıtları (tutar ve ödendi/ödenmedi/gecikti — uygulama hiçbir yerde kart numarası veya banka bilgisi işlemez). Teknik veriler: oturum açma token'ları ve hizmetin çalışması için gerekli temel kullanım bilgileri.",
      },
      {
        title: "3. Neden topluyoruz",
        body: "Hesabınızı oluşturmak ve güvenliğini sağlamak, kulübünüzün takımları, programı, yoklamayı, duyuruları, mesajlaşmayı ve ödeme takibini organize etmesini sağlamak, size hesap doğrulama ve önemli hizmet e-postaları göndermek ve her kulübün verisinin diğer kulüplerden izole kalmasını, hassas kayıtları yalnızca yetkili rollerin (örn. koç ve kulüp yöneticisi) görebilmesini sağlamak için.",
      },
      {
        title: "4. Kimlerle paylaşıyoruz",
        body: "Uygulamanın arka planını çalıştırmak için Google Firebase (Authentication, Cloud Firestore, Storage, Cloud Functions, Hosting), doğrulama e-postalarını göndermek için ise Resend hizmetini kullanıyoruz. Her ikisi de sözleşme kapsamında veri işleyen sıfatıyla hareket eder ve verilerinizi kendi amaçları için kullanmaz. Kişisel verilerinizi satmıyoruz ve reklamcılarla paylaşmıyoruz.",
      },
      {
        title: "5. Çocuklara ait veriler",
        body: "MaviTeam gençlik spor kulüpleri tarafından kullanılır ve bazı sporcu hesapları reşit olmayan kullanıcılara ait olabilir. Reşit olmayan bir kullanıcının hesabının uygun şekilde ve veli bilgisi dahilinde oluşturulup yönetilmesinden kulüpler ve veliler sorumludur. Bir sporcunun kulüp faaliyetlerine katılımı için gerekenden (ad, takım ataması, yoklama ve program görünürlüğü) daha fazla veriyi bilerek toplamıyoruz ve çocuklara ait verileri pazarlama amacıyla kullanmıyoruz.",
      },
      {
        title: "6. Verileri ne kadar süre saklıyoruz",
        body: "Verilerinizi hesabınız ve kulübünüzün çalışma alanı aktif olduğu sürece saklarız. Hesabınızı silerseniz veya kulübünüz kapatılırsa, yasal veya güvenlik gerekçesiyle saklamamız gerekenler dışında kişisel verileri makul bir süre içinde sileriz veya anonim hale getiririz.",
      },
      {
        title: "7. Haklarınız",
        body: "6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) ve benzeri veri koruma mevzuatı kapsamında; verilerinizin işlenip işlenmediğini öğrenme, bir kopyasını talep etme, yanlış verilerin düzeltilmesini isteme, silinmesini isteme ve hukuka aykırı bulduğunuz bir işleme itiraz etme hakkına sahipsiniz. Bu haklardan herhangi birini kullanmak için aşağıdaki iletişim bilgilerinden bize ulaşabilirsiniz.",
      },
      {
        title: "8. Güvenlik",
        body: "Kulüp verilerine erişim sunucu tarafı güvenlik kurallarıyla zorunlu kılınır: her kayıt kendi kulübüne bağlıdır ve ayrıca rol ile takıma göre kısıtlanır; örneğin bir veli yalnızca kendi takımının yoklamasını görebilir, başka bir takımın veya başka bir kulübün verisini asla göremez.",
      },
      {
        title: "9. Bu politikadaki değişiklikler",
        body: "Bu politikada önemli bir değişiklik yaparsak yukarıdaki tarihi güncelleriz ve gerekli görüldüğünde uygulama içinden sizi bilgilendiririz.",
      },
      {
        title: "10. İletişim",
        body: `Bu politika veya verileriniz hakkındaki sorularınızı ${CONTACT_EMAIL} adresine iletebilirsiniz.`,
      },
    ] satisfies LegalSection[],
  };
}

export default function PrivacyPolicyScreen() {
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
