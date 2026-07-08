export type Language = "tr" | "en";

export const defaultLanguage: Language = "tr";

export const translations = {
  tr: {
    common: {
      appName: "MaviTeam",
      continue: "Devam et",
      back: "Geri",
      cancel: "Vazgeç",
      save: "Kaydet",
      create: "Oluştur",
      join: "Katıl",
      loading: "Yükleniyor...",
      requiredField: "Bu alan zorunludur.",
      comingSoon: "Yakında",
      clubName: "Kulüp adı",
      invitationCode: "Davet kodu",
      volleyball: "Voleybol",
    },
    home: {
      title: "Kulübünüzü tek yerden yönetin",
      subtitle:
        "MaviTeam, spor kulüplerinin takım, antrenman, maç ve iletişim süreçlerini daha düzenli yönetmesi için tasarlandı.",
      primaryAction: "Kulüp oluştur",
      secondaryAction: "Kulübe katıl",
      dashboardAction: "Kontrol panelini görüntüle",
      featuresTitle: "Kulübünüz için güçlü bir başlangıç",
      features: [
        "Takım ve sporcu yönetimi",
        "Antrenman ve maç planlama",
        "Kulüp içi duyuru ve takip",
        "Web ve mobilde tutarlı deneyim",
      ],
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
      submitButton: "Kulübü oluştur",
      validation: {
        clubNameRequired: "Lütfen kulüp adını giriniz.",
        sportRequired: "Lütfen branş bilgisini giriniz.",
        cityRequired: "Lütfen şehir bilgisini giriniz.",
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
        invitationCodeRequired: "Lütfen davet kodunu giriniz.",
        invitationCodeInvalid: "Lütfen geçerli bir davet kodu giriniz.",
      },
    },
    dashboard: {
      title: "Kontrol paneli",
      subtitle: "Kulübünüzün günlük operasyonlarını hızlıca takip edin.",
      stats: {
        athletes: "Sporcu",
        teams: "Takım",
        events: "Etkinlik",
        attendance: "Katılım",
      },
      sections: {
        quickActions: "Hızlı işlemler",
        upcomingEvents: "Yaklaşan etkinlikler",
        clubOverview: "Kulüp özeti",
      },
      actions: {
        addAthlete: "Sporcu ekle",
        createTraining: "Antrenman planla",
        createAnnouncement: "Duyuru yayınla",
        viewSchedule: "Takvimi görüntüle",
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
  },
  en: {
    common: {
      appName: "MaviTeam",
      continue: "Continue",
      back: "Back",
      cancel: "Cancel",
      save: "Save",
      create: "Create",
      join: "Join",
      loading: "Loading...",
      requiredField: "This field is required.",
      comingSoon: "Coming soon",
      clubName: "Club name",
      invitationCode: "Invitation code",
      volleyball: "Volleyball",
    },
    home: {
      title: "Manage your club from one place",
      subtitle:
        "MaviTeam helps sports clubs manage teams, training sessions, matches, and communication with more structure.",
      primaryAction: "Create club",
      secondaryAction: "Join club",
      dashboardAction: "View dashboard",
      featuresTitle: "A strong start for your club",
      features: [
        "Team and athlete management",
        "Training and match scheduling",
        "Club announcements and tracking",
        "Consistent experience across web and mobile",
      ],
    },
    createClub: {
      title: "Create a new club",
      subtitle:
        "Set up your MaviTeam workspace and start managing teams, training sessions, and club operations in one place.",
      clubNameLabel: "Club name",
      clubNamePlaceholder: "E.g. Istanbul Stars SC",
      sportLabel: "Sport",
      sportPlaceholder: "E.g. Volleyball",
      cityLabel: "City",
      cityPlaceholder: "E.g. Istanbul",
      submitButton: "Create club",
      validation: {
        clubNameRequired: "Please enter a club name.",
        sportRequired: "Please enter a sport.",
        cityRequired: "Please enter a city.",
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
    },
    dashboard: {
      title: "Dashboard",
      subtitle: "Track your club’s daily operations at a glance.",
      stats: {
        athletes: "Athletes",
        teams: "Teams",
        events: "Events",
        attendance: "Attendance",
      },
      sections: {
        quickActions: "Quick actions",
        upcomingEvents: "Upcoming events",
        clubOverview: "Club overview",
      },
      actions: {
        addAthlete: "Add athlete",
        createTraining: "Schedule training",
        createAnnouncement: "Publish announcement",
        viewSchedule: "View schedule",
      },
      exampleEvents: {
        training: "First Team training",
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
  },
} as const;

export type Translations = typeof translations;