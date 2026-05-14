import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { I18nManager } from "react-native";

export type Lang = "ar" | "fr" | "en";

const translations = {
  ar: {
    app: { name: "NQL DZ", tagline: "نظام النقل الذكي الوطني" },
    common: {
      logout: "تسجيل الخروج", switchAccount: "تبديل الحساب", confirm: "تأكيد",
      cancel: "إلغاء", save: "حفظ", loading: "جاري التحميل...", error: "خطأ",
      success: "نجاح", balance: "الرصيد", dinar: "دج", submit: "إرسال",
      back: "رجوع", yes: "نعم", no: "لا", name: "الاسم", lastName: "اللقب",
      email: "البريد الإلكتروني", phone: "رقم الهاتف", password: "كلمة المرور",
      status: "الحالة", date: "التاريخ", amount: "المبلغ", type: "النوع",
      total: "الإجمالي", approve: "موافقة", reject: "رفض", pending: "في الانتظار",
      approved: "موافق عليه", rejected: "مرفوض", active: "نشط", inactive: "غير نشط",
      search: "بحث", filter: "تصفية", all: "الكل", create: "إنشاء", details: "التفاصيل",
      close: "إغلاق", retry: "إعادة المحاولة", noData: "لا توجد بيانات",
    },
    auth: {
      loginTitle: "تسجيل الدخول", registerTitle: "إنشاء حساب",
      loginBtn: "دخول", registerBtn: "إنشاء حساب",
      noAccount: "ليس لديك حساب؟", hasAccount: "لديك حساب بالفعل؟",
      loginHere: "سجّل دخولك", registerHere: "إنشاء حساب جديد",
      invalidCredentials: "البريد الإلكتروني أو كلمة المرور غير صحيحة",
      logoutConfirm: "هل تريد تسجيل الخروج؟",
      switchConfirm: "هل تريد تبديل الحساب؟",
      welcome: "مرحباً بك", signInToContinue: "سجّل دخولك للمتابعة",
    },
    language: {
      title: "اختر لغتك", subtitle: "Choose your language / Choisissez votre langue",
      arabic: "العربية", french: "الفرنسية", english: "الإنجليزية",
    },
    admin: {
      dashboard: "لوحة الإدارة", users: "المستخدمون", cards: "البطاقات",
      transactions: "المعاملات", withdrawals: "طلبات السحب",
      totalUsers: "إجمالي المستخدمين", totalDrivers: "السائقون",
      totalCustomers: "الزبائن", totalDistributors: "الموزعون",
      platformEarnings: "أرباح المنصة", pendingCards: "بطاقات معلقة",
      pendingWithdrawals: "طلبات سحب معلقة", todayEarnings: "أرباح اليوم",
      todayTransactions: "معاملات اليوم", createUser: "إنشاء حساب",
      createDriver: "إنشاء سائق", createDistributor: "إنشاء موزع",
      licenseNumber: "رقم الرخصة", topupBalance: "إضافة رصيد",
      topupAmount: "مبلغ الإضافة", resetPassword: "إعادة ضبط كلمة المرور",
      newPassword: "كلمة المرور الجديدة", selectRole: "اختر الدور",
      driver: "سائق", distributor: "موزع",
    },
    driver: {
      dashboard: "لوحة السائق", scan: "مسح QR", trips: "الرحلات",
      withdraw: "طلب سحب", profile: "ملفي",
      todayPassengers: "ركاب اليوم", todayEarnings: "أرباح اليوم",
      platformFee: "رسوم المنصة", totalTrips: "إجمالي الرحلات",
      scanTitle: "مسح بطاقة الزبون", scanInstruction: "ضع QR الزبون أمام الكاميرا",
      fareDeducted: "تم خصم قيمة الرحلة بنجاح", cardBalance: "رصيد البطاقة",
      driverEarning: "ربح السائق", insufficientBalance: "رصيد البطاقة غير كافٍ",
      invalidCard: "بطاقة غير صالحة", downloadReport: "تحميل تقرير PDF",
      withdrawTitle: "طلب سحب الأموال", minWithdraw: "الحد الأدنى 5000 دج",
      method: "طريقة السحب", cash: "نقداً", ccp: "تحويل CCP",
      ccpAccount: "رقم الحساب البريدي", withdrawSubmitted: "تم إرسال طلب السحب",
      noTrips: "لا توجد رحلات بعد", earnings: "الأرباح",
    },
    customer: {
      dashboard: "بطاقتي", myCard: "بطاقتي", createCard: "إنشاء بطاقة",
      transactions: "سجل المعاملات", profile: "ملفي",
      cardTypes: { standard: "بطاقة عادية", student: "بطاقة طالب", employee: "بطاقة موظف", special_needs: "ذوي احتياجات خاصة" },
      noCard: "ليس لديك بطاقة بعد", createCardTitle: "إنشاء بطاقة جديدة",
      selectType: "اختر نوع البطاقة", studentId: "رقم بطاقة الطالب",
      uploadStudentCert: "رفع الشهادة / بطاقة الطالب", uploadWorkCard: "رفع شهادة / بطاقة العمل",
      uploadDisabilityCert: "رفع بطاقة الحالة الخاصة", nationalId: "رقم التعريف الوطني",
      uploadNationalId: "رفع بطاقة التعريف الوطنية",
      uploadRequired: "هذا الرفع إلزامي",
      tapToUpload: "اضغط للرفع أو التصوير",
      uploaded: "تم الرفع ✓",
      photoSource: "مصدر الصورة",
      fromGallery: "من المعرض",
      fromCamera: "التقاط صورة",
      documentRequired: "يجب رفع جميع الوثائق المطلوبة",
      pendingApproval: "في انتظار موافقة الإدارة", cardActive: "البطاقة نشطة",
      changePassword: "تغيير كلمة المرور", currentPassword: "كلمة المرور الحالية",
      newPassword: "كلمة المرور الجديدة",
      fare: { standard: "50 دج", student: "35 دج", employee: "40 دج", special_needs: "40 دج" },
      showQR: "عرض QR", cardNumber: "رقم البطاقة", noTransactions: "لا توجد معاملات",
      topupCard: "شحن الرصيد",
      selectTopupMethod: "اختر طريقة الشحن",
      viaDistributor: "عبر الموزع",
      viaDistributorHint: "اعرض هذا الـ QR للموزع ليقوم بمسحه وشحن رصيدك",
      electronicPayment: "دفع إلكتروني",
      electronicPaymentHint: "شحن فوري عبر البطاقة البنكية",
      selectAmount: "اختر المبلغ",
      topupSuccess: "تم شحن الرصيد بنجاح",
      topupFailed: "فشل عملية الشحن",
      newBalance: "الرصيد الجديد",
      payNow: "ادفع الآن",
      processing: "جاري المعالجة...",
    },
    distributor: {
      dashboard: "لوحة الموزع", scan: "شحن بطاقة", transactions: "العمليات", profile: "ملفي",
      scanTitle: "مسح بطاقة الزبون", selectAmount: "اختر المبلغ",
      topupSuccess: "تم شحن البطاقة بنجاح", insufficientBalance: "رصيدك غير كافٍ",
      todayTopups: "شحنات اليوم", totalTopups: "إجمالي الشحنات",
    },
  },
  fr: {
    app: { name: "NQL DZ", tagline: "Système de Transport Intelligent National" },
    common: {
      logout: "Déconnexion", switchAccount: "Changer de compte", confirm: "Confirmer",
      cancel: "Annuler", save: "Enregistrer", loading: "Chargement...", error: "Erreur",
      success: "Succès", balance: "Solde", dinar: "DA", submit: "Soumettre",
      back: "Retour", yes: "Oui", no: "Non", name: "Prénom", lastName: "Nom",
      email: "E-mail", phone: "Téléphone", password: "Mot de passe",
      status: "Statut", date: "Date", amount: "Montant", type: "Type",
      total: "Total", approve: "Approuver", reject: "Rejeter", pending: "En attente",
      approved: "Approuvé", rejected: "Rejeté", active: "Actif", inactive: "Inactif",
      search: "Rechercher", filter: "Filtrer", all: "Tout", create: "Créer", details: "Détails",
      close: "Fermer", retry: "Réessayer", noData: "Aucune donnée",
    },
    auth: {
      loginTitle: "Connexion", registerTitle: "Créer un compte",
      loginBtn: "Se connecter", registerBtn: "Créer un compte",
      noAccount: "Pas de compte ?", hasAccount: "Déjà un compte ?",
      loginHere: "Se connecter", registerHere: "Créer un compte",
      invalidCredentials: "E-mail ou mot de passe incorrect",
      logoutConfirm: "Voulez-vous vous déconnecter ?",
      switchConfirm: "Voulez-vous changer de compte ?",
      welcome: "Bienvenue", signInToContinue: "Connectez-vous pour continuer",
    },
    language: {
      title: "Choisissez votre langue", subtitle: "اختر لغتك / Choose your language",
      arabic: "Arabe", french: "Français", english: "Anglais",
    },
    admin: {
      dashboard: "Tableau de bord", users: "Utilisateurs", cards: "Cartes",
      transactions: "Transactions", withdrawals: "Retraits",
      totalUsers: "Total utilisateurs", totalDrivers: "Chauffeurs",
      totalCustomers: "Clients", totalDistributors: "Distributeurs",
      platformEarnings: "Revenus plateforme", pendingCards: "Cartes en attente",
      pendingWithdrawals: "Retraits en attente", todayEarnings: "Revenus aujourd'hui",
      todayTransactions: "Transactions aujourd'hui", createUser: "Créer un compte",
      createDriver: "Créer chauffeur", createDistributor: "Créer distributeur",
      licenseNumber: "N° de permis", topupBalance: "Recharger le solde",
      topupAmount: "Montant à recharger", resetPassword: "Réinitialiser le mot de passe",
      newPassword: "Nouveau mot de passe", selectRole: "Choisir le rôle",
      driver: "Chauffeur", distributor: "Distributeur",
    },
    driver: {
      dashboard: "Tableau de bord", scan: "Scanner QR", trips: "Trajets",
      withdraw: "Retrait", profile: "Profil",
      todayPassengers: "Passagers aujourd'hui", todayEarnings: "Gains aujourd'hui",
      platformFee: "Frais plateforme", totalTrips: "Total trajets",
      scanTitle: "Scanner la carte client", scanInstruction: "Placez le QR client devant la caméra",
      fareDeducted: "Tarif déduit avec succès", cardBalance: "Solde de la carte",
      driverEarning: "Gain chauffeur", insufficientBalance: "Solde insuffisant",
      invalidCard: "Carte invalide", downloadReport: "Télécharger PDF",
      withdrawTitle: "Demande de retrait", minWithdraw: "Minimum 5000 DA",
      method: "Méthode de retrait", cash: "Espèces", ccp: "Virement CCP",
      ccpAccount: "N° de compte postal", withdrawSubmitted: "Demande envoyée",
      noTrips: "Aucun trajet pour l'instant", earnings: "Gains",
    },
    customer: {
      dashboard: "Ma carte", myCard: "Ma carte", createCard: "Créer une carte",
      transactions: "Historique", profile: "Profil",
      cardTypes: { standard: "Carte standard", student: "Carte étudiant", employee: "Carte employé", special_needs: "Carte handicapé" },
      noCard: "Vous n'avez pas encore de carte", createCardTitle: "Créer une nouvelle carte",
      selectType: "Choisissez le type", studentId: "N° carte étudiant",
      uploadStudentCert: "Certificat / carte étudiant", uploadWorkCard: "Certificat / carte de travail",
      uploadDisabilityCert: "Carte de handicap", nationalId: "N° identité nationale",
      uploadNationalId: "Télécharger la carte d'identité",
      uploadRequired: "Ce téléchargement est obligatoire",
      tapToUpload: "Appuyer pour télécharger ou photographier",
      uploaded: "Téléchargé ✓",
      photoSource: "Source de la photo",
      fromGallery: "Depuis la galerie",
      fromCamera: "Prendre une photo",
      documentRequired: "Tous les documents obligatoires doivent être téléchargés",
      pendingApproval: "En attente d'approbation", cardActive: "Carte active",
      changePassword: "Changer le mot de passe", currentPassword: "Mot de passe actuel",
      newPassword: "Nouveau mot de passe",
      fare: { standard: "50 DA", student: "35 DA", employee: "40 DA", special_needs: "40 DA" },
      showQR: "Afficher QR", cardNumber: "N° de carte", noTransactions: "Aucune transaction",
      topupCard: "Recharger la carte",
      selectTopupMethod: "Choisir la méthode",
      viaDistributor: "Via distributeur",
      viaDistributorHint: "Montrez ce QR au distributeur pour qu'il recharge votre carte",
      electronicPayment: "Paiement électronique",
      electronicPaymentHint: "Rechargement immédiat par carte bancaire",
      selectAmount: "Choisir le montant",
      topupSuccess: "Carte rechargée avec succès",
      topupFailed: "Échec du rechargement",
      newBalance: "Nouveau solde",
      payNow: "Payer maintenant",
      processing: "Traitement en cours...",
    },
    distributor: {
      dashboard: "Tableau de bord", scan: "Recharger carte", transactions: "Opérations", profile: "Profil",
      scanTitle: "Scanner la carte client", selectAmount: "Choisir le montant",
      topupSuccess: "Carte rechargée avec succès", insufficientBalance: "Solde insuffisant",
      todayTopups: "Recharges aujourd'hui", totalTopups: "Total recharges",
    },
  },
  en: {
    app: { name: "NQL DZ", tagline: "National Smart Transit System" },
    common: {
      logout: "Logout", switchAccount: "Switch Account", confirm: "Confirm",
      cancel: "Cancel", save: "Save", loading: "Loading...", error: "Error",
      success: "Success", balance: "Balance", dinar: "DZD", submit: "Submit",
      back: "Back", yes: "Yes", no: "No", name: "First Name", lastName: "Last Name",
      email: "Email", phone: "Phone", password: "Password",
      status: "Status", date: "Date", amount: "Amount", type: "Type",
      total: "Total", approve: "Approve", reject: "Reject", pending: "Pending",
      approved: "Approved", rejected: "Rejected", active: "Active", inactive: "Inactive",
      search: "Search", filter: "Filter", all: "All", create: "Create", details: "Details",
      close: "Close", retry: "Retry", noData: "No data available",
    },
    auth: {
      loginTitle: "Sign In", registerTitle: "Create Account",
      loginBtn: "Sign In", registerBtn: "Create Account",
      noAccount: "Don't have an account?", hasAccount: "Already have an account?",
      loginHere: "Sign In", registerHere: "Create Account",
      invalidCredentials: "Invalid email or password",
      logoutConfirm: "Do you want to logout?",
      switchConfirm: "Do you want to switch account?",
      welcome: "Welcome", signInToContinue: "Sign in to continue",
    },
    language: {
      title: "Choose Your Language", subtitle: "اختر لغتك / Choisissez votre langue",
      arabic: "Arabic", french: "French", english: "English",
    },
    admin: {
      dashboard: "Admin Dashboard", users: "Users", cards: "Cards",
      transactions: "Transactions", withdrawals: "Withdrawals",
      totalUsers: "Total Users", totalDrivers: "Drivers",
      totalCustomers: "Customers", totalDistributors: "Distributors",
      platformEarnings: "Platform Earnings", pendingCards: "Pending Cards",
      pendingWithdrawals: "Pending Withdrawals", todayEarnings: "Today's Earnings",
      todayTransactions: "Today's Transactions", createUser: "Create Account",
      createDriver: "Create Driver", createDistributor: "Create Distributor",
      licenseNumber: "License Number", topupBalance: "Top Up Balance",
      topupAmount: "Top Up Amount", resetPassword: "Reset Password",
      newPassword: "New Password", selectRole: "Select Role",
      driver: "Driver", distributor: "Distributor",
    },
    driver: {
      dashboard: "Dashboard", scan: "Scan QR", trips: "Trips",
      withdraw: "Withdraw", profile: "Profile",
      todayPassengers: "Today's Passengers", todayEarnings: "Today's Earnings",
      platformFee: "Platform Fee", totalTrips: "Total Trips",
      scanTitle: "Scan Customer Card", scanInstruction: "Place customer QR in front of camera",
      fareDeducted: "Fare deducted successfully", cardBalance: "Card Balance",
      driverEarning: "Driver Earning", insufficientBalance: "Insufficient card balance",
      invalidCard: "Invalid card", downloadReport: "Download PDF Report",
      withdrawTitle: "Withdrawal Request", minWithdraw: "Minimum 5000 DZD",
      method: "Withdrawal Method", cash: "Cash", ccp: "CCP Transfer",
      ccpAccount: "Postal Account Number", withdrawSubmitted: "Withdrawal request submitted",
      noTrips: "No trips yet", earnings: "Earnings",
    },
    customer: {
      dashboard: "My Card", myCard: "My Card", createCard: "Create Card",
      transactions: "Transactions", profile: "Profile",
      cardTypes: { standard: "Standard Card", student: "Student Card", employee: "Employee Card", special_needs: "Special Needs Card" },
      noCard: "You don't have a card yet", createCardTitle: "Create New Card",
      selectType: "Select Card Type", studentId: "Student Card Number",
      uploadStudentCert: "School Certificate / Student Card", uploadWorkCard: "Work Certificate / Work Card",
      uploadDisabilityCert: "Special Needs Card", nationalId: "National ID Number",
      uploadNationalId: "Upload National ID Card",
      uploadRequired: "This upload is mandatory",
      tapToUpload: "Tap to upload or take photo",
      uploaded: "Uploaded ✓",
      photoSource: "Photo Source",
      fromGallery: "From Gallery",
      fromCamera: "Take Photo",
      documentRequired: "All required documents must be uploaded",
      pendingApproval: "Awaiting Admin Approval", cardActive: "Card Active",
      changePassword: "Change Password", currentPassword: "Current Password",
      newPassword: "New Password",
      fare: { standard: "50 DZD", student: "35 DZD", employee: "40 DZD", special_needs: "40 DZD" },
      showQR: "Show QR", cardNumber: "Card Number", noTransactions: "No transactions yet",
      topupCard: "Top Up Card",
      selectTopupMethod: "Select Top-Up Method",
      viaDistributor: "Via Distributor",
      viaDistributorHint: "Show this QR to the distributor to top up your card",
      electronicPayment: "Electronic Payment",
      electronicPaymentHint: "Instant top-up via bank card",
      selectAmount: "Select Amount",
      topupSuccess: "Card topped up successfully",
      topupFailed: "Top-up failed",
      newBalance: "New Balance",
      payNow: "Pay Now",
      processing: "Processing...",
    },
    distributor: {
      dashboard: "Dashboard", scan: "Top Up Card", transactions: "Operations", profile: "Profile",
      scanTitle: "Scan Customer Card", selectAmount: "Select Amount",
      topupSuccess: "Card topped up successfully", insufficientBalance: "Insufficient balance",
      todayTopups: "Today's Top Ups", totalTopups: "Total Top Ups",
    },
  },
};

export type Translations = typeof translations.ar;

interface LanguageContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Translations;
  isRTL: boolean;
  isLoaded: boolean;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: "ar",
  setLang: () => {},
  t: translations.ar,
  isRTL: true,
  isLoaded: false,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ar");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem("nql_language").then((stored) => {
      if (stored && (stored === "ar" || stored === "fr" || stored === "en")) {
        setLangState(stored as Lang);
      }
      setIsLoaded(true);
    });
  }, []);

  const setLang = async (l: Lang) => {
    setLangState(l);
    await AsyncStorage.setItem("nql_language", l);
  };

  const isRTL = lang === "ar";
  const t = translations[lang];

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, isRTL, isLoaded }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
