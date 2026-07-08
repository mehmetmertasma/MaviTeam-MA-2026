export type Language = "tr" | "en";

export const defaultLanguage: Language = "tr";

export const supportedLanguages: {
  code: Language;
  label: string;
  shortLabel: string;
}[] = [
  { code: "tr", label: "Türkçe", shortLabel: "TR" },
  { code: "en", label: "English", shortLabel: "EN" },
];

const tr = {
  common: {
    appName: "MaviTeam",
    continue: "Devam et",
    back: "Geri",
    cancel: "Vazgeç",
    save: "Kaydet",
    create: "Oluştur",
    update: "Güncelle",
    delete: "Sil",
    remove: "Kaldır",
    join: "Katıl",
    close: "Kapat",
    edit: "Düzenle",
    loading: "Yükleniyor...",
    refresh: "Yenile",
    requiredField: "Bu alan zorunludur.",
    comingSoon: "Yakında",
    clubName: "Kulüp adı",
    invitationCode: "Davet kodu",
    volleyball: "Voleybol",
    noData: "Henüz kayıt yok",
    success: "İşlem başarıyla tamamlandı.",
    error: "Bir sorun oluştu. Lütfen tekrar deneyin.",
  },

  language: {
    title: "Dil",
    subtitle: "Uygulama dilini seçin.",
    turkish: "Türkçe",
    english: "İngilizce",
    changed: "Dil tercihi güncellendi.",
  },

  home: {
    title: "Kulübünüzü tek yerden yönetin",
    subtitle:
      "MaviTeam, spor kulüplerinin takım, antrenman, maç, ödeme ve iletişim süreçlerini daha düzenli yönetmesi için tasarlandı.",
    primaryAction: "Kulüp oluştur",
    secondaryAction: "Kulübe katıl",
    dashboardAction: "Kontrol panelini görüntüle",
    featuresTitle: "Kulübünüz için güçlü bir başlangıç",
    features: [
      "Takım ve sporcu yönetimi",
      "Antrenman ve maç planlama",
      "Kulüp içi duyuru ve mesajlaşma",
      "Yoklama, uygunluk ve ödeme takibi",
    ],
  },

  auth: {
    loginTitle: "Hesabınıza giriş yapın",
    loginSubtitle:
      "Kulübünüzün yönetim paneline erişmek için e-posta ve şifrenizle giriş yapın.",
    registerTitle: "MaviTeam hesabınızı oluşturun",
    registerSubtitle:
      "Kulübünüzü yönetmek veya mevcut bir kulübe katılmak için hesabınızı oluşturun.",
    verifyEmailTitle: "E-postanızı doğrulayın",
    verifyEmailSubtitle:
      "Hesabınızı güvenli şekilde kullanabilmek için e-posta adresinize gönderilen doğrulama bağlantısını onaylayın.",
    fullNameLabel: "Ad soyad",
    fullNamePlaceholder: "Örn. Mert Asma",
    emailLabel: "E-posta",
    emailPlaceholder: "ornek@email.com",
    passwordLabel: "Şifre",
    confirmPasswordLabel: "Şifreyi onayla",
    forgotPassword: "Şifremi unuttum",
    loginButton: "Giriş yap",
    registerButton: "Hesap oluştur",
    logoutButton: "Çıkış yap",
    resendVerification: "Doğrulama e-postasını tekrar gönder",
    checkVerification: "Doğrulamayı kontrol et",
    validation: {
      fullNameRequired: "Lütfen ad soyad bilgisini girin.",
      emailRequired: "Lütfen e-posta adresinizi girin.",
      emailInvalid: "Lütfen geçerli bir e-posta adresi girin.",
      passwordRequired: "Lütfen şifrenizi girin.",
      passwordTooShort: "Şifre en az 6 karakter olmalı.",
      passwordMismatch: "Şifreler eşleşmiyor.",
    },
  },

  createClub: {
    title: "Yeni kulüp oluştur",
    subtitle:
      "Kulübünüz için MaviTeam çalışma alanını hazırlayın. Takım, antrenman ve organizasyon süreçlerini buradan yönetebilirsiniz.",
    clubNameLabel: "Kulüp adı",
    clubNamePlaceholder: "Örn. İstanbul Yıldızları SK",
    sportLabel: "Branş",
    sportPlaceholder: "Örn. Voleybol",
    cityLabel: "Şehir",
    cityPlaceholder: "Örn. İstanbul",
    invitationCodePreview: "Kulüp davet kodu",
    submitButton: "Kulübü oluştur",
    validation: {
      clubNameRequired: "Lütfen kulüp adını girin.",
      sportRequired: "Lütfen branş bilgisini girin.",
      cityRequired: "Lütfen şehir bilgisini girin.",
    },
    messages: {
      creating: "Kulüp oluşturuluyor...",
      created: "Kulüp başarıyla oluşturuldu.",
      failed: "Kulüp oluşturulurken bir sorun oluştu.",
    },
  },

  joinClub: {
    title: "Kulübe katıl",
    subtitle:
      "Kulüp yöneticinizden aldığınız davet kodunu girerek MaviTeam çalışma alanına katılabilirsiniz.",
    invitationCodeLabel: "Davet kodu",
    invitationCodePlaceholder: "Örn. MAVI2026",
    submitButton: "Kulübe katıl",
    validation: {
      invitationCodeRequired: "Lütfen davet kodunu girin.",
      invitationCodeInvalid: "Lütfen geçerli bir davet kodu girin.",
    },
    messages: {
      joining: "Katılım isteğiniz gönderiliyor...",
      requestSent: "Katılım isteğiniz kulüp yöneticisine gönderildi.",
      invalidCode: "Bu davet koduna bağlı bir kulüp bulunamadı.",
      failed: "Katılım isteği gönderilirken bir sorun oluştu.",
    },
  },

  dashboard: {
    title: "Kontrol paneli",
    subtitle: "Kulübünüzün günlük operasyonlarını hızlıca takip edin.",
    welcome: "Hoş geldin",
    stats: {
      athletes: "Sporcu",
      teams: "Takım",
      events: "Etkinlik",
      attendance: "Katılım",
      activeMembers: "Aktif üye",
      pendingMembers: "Bekleyen üye",
      unpaidPayments: "Bekleyen ödeme",
    },
    sections: {
      quickActions: "Hızlı işlemler",
      upcomingEvents: "Yaklaşan etkinlikler",
      clubOverview: "Kulüp özeti",
      attentionNeeded: "Dikkat gerekenler",
    },
    actions: {
      addAthlete: "Sporcu ekle",
      createTraining: "Antrenman planla",
      createAnnouncement: "Duyuru yayınla",
      viewSchedule: "Programı görüntüle",
      manageTeams: "Takımları yönet",
      manageApprovals: "Üye onayları",
      openMessages: "Mesajları aç",
      managePayments: "Ödemeleri yönet",
      takeAttendance: "Yoklama al",
      updateAvailability: "Uygunluk bildir",
      viewReplays: "Video kayıtları",
      viewStatistics: "İstatistikler",
    },
    exampleEvents: {
      training: "A Takım antrenmanı",
      match: "Hazırlık maçı",
      meeting: "Veli bilgilendirme toplantısı",
      tournament: "Hafta sonu turnuvası",
    },
    exampleEventMeta: {
      training: "Bugün, 18:30",
      match: "Yarın, 20:00",
      meeting: "Cuma, 19:00",
      tournament: "Pazar, 10:00",
    },
  },

  profile: {
    title: "Profil",
    subtitle: "Hesap ve kulüp bilgilerinizi yönetin.",
    heroLabel: "Hesap merkezi",
    editProfile: "Profili düzenle",
    accountSummary: "Profil özeti",
    clubInfo: "Kulüp bilgileri",
    fullName: "Ad soyad",
    email: "E-posta",
    club: "Kulüp",
    team: "Takım",
    clubCode: "Kulüp kodu",
    notifications: "Bildirimler",
    languageSettings: "Dil ayarları",
    logout: "Çıkış yap",
    messages: {
      loaded: "Profil bilgileri yüklendi.",
      updated: "Profil bilgileri güncellendi.",
      failedToLoad: "Profil bilgileri yüklenirken bir sorun oluştu.",
      failedToUpdate: "Profil kaydedilirken bir sorun oluştu.",
      signingOut: "Güvenli çıkış yapılıyor...",
    },
  },
} as const;

type TranslationDictionary = typeof tr;

const en: TranslationDictionary = {
  common: {
    appName: "MaviTeam",
    continue: "Continue",
    back: "Back",
    cancel: "Cancel",
    save: "Save",
    create: "Create",
    update: "Update",
    delete: "Delete",
    remove: "Remove",
    join: "Join",
    close: "Close",
    edit: "Edit",
    loading: "Loading...",
    refresh: "Refresh",
    requiredField: "This field is required.",
    comingSoon: "Coming soon",
    clubName: "Club name",
    invitationCode: "Invitation code",
    volleyball: "Volleyball",
    noData: "No records yet",
    success: "Action completed successfully.",
    error: "Something went wrong. Please try again.",
  },

  language: {
    title: "Language",
    subtitle: "Choose your app language.",
    turkish: "Turkish",
    english: "English",
    changed: "Language preference updated.",
  },

  home: {
    title: "Manage your club from one place",
    subtitle:
      "MaviTeam helps sports clubs manage teams, practices, matches, payments, and communication with more structure.",
    primaryAction: "Create club",
    secondaryAction: "Join club",
    dashboardAction: "View dashboard",
    featuresTitle: "A strong start for your club",
    features: [
      "Team and athlete management",
      "Practice and match scheduling",
      "Club announcements and messaging",
      "Attendance, availability, and payment tracking",
    ],
  },

  auth: {
    loginTitle: "Sign in to your account",
    loginSubtitle:
      "Use your email and password to access your club management dashboard.",
    registerTitle: "Create your MaviTeam account",
    registerSubtitle:
      "Create an account to manage your club or join an existing club.",
    verifyEmailTitle: "Verify your email",
    verifyEmailSubtitle:
      "Confirm the verification link sent to your email address to keep your account secure.",
    fullNameLabel: "Full name",
    fullNamePlaceholder: "E.g. Mert Asma",
    emailLabel: "Email",
    emailPlaceholder: "example@email.com",
    passwordLabel: "Password",
    confirmPasswordLabel: "Confirm password",
    forgotPassword: "Forgot password",
    loginButton: "Sign in",
    registerButton: "Create account",
    logoutButton: "Sign out",
    resendVerification: "Resend verification email",
    checkVerification: "Check verification",
    validation: {
      fullNameRequired: "Please enter your full name.",
      emailRequired: "Please enter your email address.",
      emailInvalid: "Please enter a valid email address.",
      passwordRequired: "Please enter your password.",
      passwordTooShort: "Password must be at least 6 characters.",
      passwordMismatch: "Passwords do not match.",
    },
  },

  createClub: {
    title: "Create a new club",
    subtitle:
      "Set up your MaviTeam workspace and start managing teams, practices, and club operations in one place.",
    clubNameLabel: "Club name",
    clubNamePlaceholder: "E.g. Istanbul Stars SC",
    sportLabel: "Sport",
    sportPlaceholder: "E.g. Volleyball",
    cityLabel: "City",
    cityPlaceholder: "E.g. Istanbul",
    invitationCodePreview: "Club invitation code",
    submitButton: "Create club",
    validation: {
      clubNameRequired: "Please enter a club name.",
      sportRequired: "Please enter a sport.",
      cityRequired: "Please enter a city.",
    },
    messages: {
      creating: "Creating club...",
      created: "Club created successfully.",
      failed: "Something went wrong while creating the club.",
    },
  },

  joinClub: {
    title: "Join a club",
    subtitle:
      "Enter the invitation code from your club manager to join your MaviTeam workspace.",
    invitationCodeLabel: "Invitation code",
    invitationCodePlaceholder: "E.g. MAVI2026",
    submitButton: "Join club",
    validation: {
      invitationCodeRequired: "Please enter an invitation code.",
      invitationCodeInvalid: "Please enter a valid invitation code.",
    },
    messages: {
      joining: "Sending your join request...",
      requestSent: "Your join request has been sent to the club admin.",
      invalidCode: "No club was found for this invitation code.",
      failed: "Something went wrong while sending your join request.",
    },
  },

  dashboard: {
    title: "Dashboard",
    subtitle: "Track your club’s daily operations at a glance.",
    welcome: "Welcome",
    stats: {
      athletes: "Athletes",
      teams: "Teams",
      events: "Events",
      attendance: "Attendance",
      activeMembers: "Active members",
      pendingMembers: "Pending members",
      unpaidPayments: "Pending payments",
    },
    sections: {
      quickActions: "Quick actions",
      upcomingEvents: "Upcoming events",
      clubOverview: "Club overview",
      attentionNeeded: "Needs attention",
    },
    actions: {
      addAthlete: "Add athlete",
      createTraining: "Schedule practice",
      createAnnouncement: "Publish announcement",
      viewSchedule: "View schedule",
      manageTeams: "Manage teams",
      manageApprovals: "Member approvals",
      openMessages: "Open messages",
      managePayments: "Manage payments",
      takeAttendance: "Take attendance",
      updateAvailability: "Update availability",
      viewReplays: "Video library",
      viewStatistics: "Statistics",
    },
    exampleEvents: {
      training: "First Team practice",
      match: "Friendly match",
      meeting: "Parent information meeting",
      tournament: "Weekend tournament",
    },
    exampleEventMeta: {
      training: "Today, 18:30",
      match: "Tomorrow, 20:00",
      meeting: "Friday, 19:00",
      tournament: "Sunday, 10:00",
    },
  },

  profile: {
    title: "Profile",
    subtitle: "Manage your account and club information.",
    heroLabel: "Account center",
    editProfile: "Edit profile",
    accountSummary: "Profile summary",
    clubInfo: "Club information",
    fullName: "Full name",
    email: "Email",
    club: "Club",
    team: "Team",
    clubCode: "Club code",
    notifications: "Notifications",
    languageSettings: "Language settings",
    logout: "Sign out",
    messages: {
      loaded: "Profile information loaded.",
      updated: "Profile information updated.",
      failedToLoad: "Something went wrong while loading profile information.",
      failedToUpdate: "Something went wrong while saving your profile.",
      signingOut: "Signing out securely...",
    },
  },
};

export const translations: Record<Language, TranslationDictionary> = {
  tr,
  en,
};

export const t = translations[defaultLanguage];

export type Translations = typeof translations;
export type TranslationKeys = keyof TranslationDictionary;
