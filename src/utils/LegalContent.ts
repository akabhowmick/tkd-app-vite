export interface LegalListItem {
  label: string;
  detail: string;
}

export interface LegalSectionData {
  title: string;
  content?: string[];
  intro?: string;
  list?: (string | LegalListItem)[];
  footer?: string;
  contact?: { email: string };
  privacyLink?: boolean;
}

// ─── Privacy Policy Content ──────────────────────────────────────────────────

export const PRIVACY_POLICY_SECTIONS: LegalSectionData[] = [
  {
    title: "Overview",
    content: [
      `TaekwonTrack ("we", "our", or "us") is a school and student management platform built for martial arts schools and their administrators. This Privacy Policy explains what information we collect, how we use it, and the choices you have around your data.`,
      `By using TaekwonTrack, you agree to the practices described in this policy. If you do not agree, please discontinue use of the platform.`,
    ],
  },
  {
    title: "Information We Collect",
    intro: "We collect the following types of information:",
    list: [
      {
        label: "Account information",
        detail: "your name, email address, and password when you register.",
      },
      {
        label: "Student records",
        detail:
          "names, email addresses, and phone numbers of students added by school administrators.",
      },
      {
        label: "School information",
        detail: "school name and associated metadata provided during onboarding.",
      },
      {
        label: "Usage data",
        detail:
          "how you interact with the platform, including pages visited and actions taken, used to improve the product.",
      },
      {
        label: "Authentication data",
        detail:
          "if you sign in with Google, we receive your name and email from Google as permitted by your Google account settings.",
      },
    ],
  },
  {
    title: "How We Use Your Information",
    intro: "We use the information we collect to:",
    list: [
      "Provide and operate the TaekwonTrack platform",
      "Manage school and student records on behalf of administrators",
      "Authenticate users and maintain account security",
      "Respond to support requests and communicate service updates",
      "Improve and develop new features based on usage patterns",
    ],
    footer: "We do not sell your personal information to third parties.",
  },
  {
    title: "Student Data",
    content: [
      `TaekwonTrack handles student data on behalf of school administrators. Administrators are responsible for ensuring they have appropriate consent to add student information to the platform. We process student data only as directed by the school administrator and do not use it for any independent purpose.`,
      `We take extra care with student information and apply the same security standards to student records as we do to all other data on the platform.`,
    ],
  },
  {
    title: "Third-Party Services",
    intro: "TaekwonTrack uses the following third-party services to operate:",
    list: [
      {
        label: "Supabase",
        detail:
          "authentication and database hosting. Your data is stored securely on Supabase infrastructure.",
      },
      {
        label: "Google OAuth",
        detail:
          "optional sign-in method. If used, Google shares your name and email with us in accordance with Google's own privacy policy.",
      },
    ],
    footer:
      "We encourage you to review the privacy policies of these services. We are not responsible for their data practices.",
  },
  {
    title: "Data Retention",
    content: [
      `We retain your account and school data for as long as your account is active. If you delete your account, we will remove your personal data within 30 days, except where we are required to retain it for legal or operational reasons.`,
    ],
  },
  {
    title: "Your Rights",
    intro: "You have the right to:",
    list: [
      "Access the personal data we hold about you",
      "Request correction of inaccurate data",
      "Request deletion of your account and associated data",
      "Withdraw consent for data processing where applicable",
    ],
    footer: "To exercise any of these rights, please contact us at the email below.",
  },
  {
    title: "Security",
    content: [
      `We use industry-standard practices to protect your data, including encrypted connections (HTTPS), secure authentication, and access controls. No system is completely secure, and we cannot guarantee absolute security, but we take reasonable steps to protect your information.`,
    ],
  },
  {
    title: "Children's Privacy",
    content: [
      `TaekwonTrack is a platform for school administrators, not for direct use by children. Student records may include minors, but those records are managed exclusively by authorized adult administrators. We do not knowingly collect information directly from children under 13.`,
    ],
  },
  {
    title: "Changes to This Policy",
    content: [
      `We may update this policy from time to time. When we do, we'll update the date at the top of this page. Continued use of TaekwonTrack after changes means you accept the updated policy.`,
    ],
  },
  {
    title: "Contact Us",
    contact: { email: "privacy@taekwontrack.com" },
  },
];

// ─── Terms of Service Content ─────────────────────────────────────────────────

export const TERMS_OF_SERVICE_SECTIONS: LegalSectionData[] = [
  {
    title: "Agreement to Terms",
    content: [
      `By creating an account or using TaekwonTrack ("the platform", "we", "us"), you agree to these Terms of Service. If you are using TaekwonTrack on behalf of a school or organization, you represent that you have the authority to bind that organization to these terms.`,
      `If you do not agree to these terms, please do not use the platform.`,
    ],
  },
  {
    title: "What TaekwonTrack Provides",
    content: [
      `TaekwonTrack is a school and student management platform designed for martial arts schools. It allows administrators to manage student records, organize school data, and handle day-to-day administrative tasks in one place.`,
      `We reserve the right to modify, suspend, or discontinue any part of the platform at any time. We will make reasonable efforts to notify users of significant changes.`,
    ],
  },
  {
    title: "Your Account",
    content: [
      `You are responsible for maintaining the security of your account credentials. Do not share your password with others. You are responsible for all activity that occurs under your account.`,
      `You must provide accurate information when creating your account. Accounts created with false information may be suspended.`,
      `You must be at least 18 years old to create an account and use TaekwonTrack.`,
    ],
  },
  {
    title: "Acceptable Use",
    intro: "You agree not to:",
    list: [
      "Use the platform for any unlawful purpose or in violation of any regulations",
      "Add student or user data without appropriate authorization or consent",
      "Attempt to gain unauthorized access to any part of the platform or its infrastructure",
      "Use the platform to transmit harmful, abusive, or fraudulent content",
      "Reverse engineer, copy, or redistribute any part of TaekwonTrack",
      "Use automated tools to scrape or extract data from the platform",
    ],
  },
  {
    title: "Student and User Data",
    content: [
      `As an administrator, you are responsible for ensuring you have the appropriate legal basis to add and manage student information within the platform. This includes obtaining any necessary consents from students or their guardians where required by applicable law.`,
    ],
    privacyLink: true,
  },
  {
    title: "Payments",
    content: [
      `TaekwonTrack does not currently process payments through the platform. This section will be updated if and when paid features are introduced. Any future billing terms will be clearly communicated before you are charged.`,
    ],
  },
  {
    title: "Intellectual Property",
    content: [
      `TaekwonTrack and its original content, features, and functionality are owned by us and are protected by applicable intellectual property laws. You may not use our name, logo, or branding without prior written permission.`,
      `Your data remains yours. We claim no ownership over the school or student records you create within the platform.`,
    ],
  },
  {
    title: "Disclaimers",
    content: [
      `TaekwonTrack is provided "as is" without warranties of any kind, express or implied. We do not guarantee the platform will be error-free, uninterrupted, or free of security vulnerabilities. You use the platform at your own risk.`,
    ],
  },
  {
    title: "Limitation of Liability",
    content: [
      `To the fullest extent permitted by law, TaekwonTrack shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the platform, including loss of data, revenue, or business opportunities.`,
    ],
  },
  {
    title: "Termination",
    content: [
      `We reserve the right to suspend or terminate your account if you violate these terms or engage in conduct that we determine is harmful to the platform or other users. You may delete your account at any time by contacting us.`,
      `Upon termination, your right to use the platform ceases immediately. Data deletion will follow the terms outlined in our Privacy Policy.`,
    ],
  },
  {
    title: "Governing Law",
    content: [
      `These terms are governed by the laws of the United States. Any disputes arising from these terms or your use of TaekwonTrack will be resolved in accordance with applicable law.`,
    ],
  },
  {
    title: "Changes to These Terms",
    content: [
      `We may update these terms from time to time. We'll update the date at the top of this page and, for material changes, notify you via email or an in-app notice. Continued use of TaekwonTrack after changes constitutes acceptance of the updated terms.`,
    ],
  },
  {
    title: "Contact Us",
    contact: { email: "legal@taekwontrack.com" },
  },
];
