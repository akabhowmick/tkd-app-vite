import React from "react";
import { PRIVACY_POLICY_SECTIONS } from "../utils/LegalContent";
import { LegalPageLayout, Section } from "../components/LegalPageLayout";

const PrivacyPolicy: React.FC = () => (
  <LegalPageLayout
    title="Privacy Policy"
    footerLinks={[
      { to: "/login", label: "Back to Login", primary: true },
      { to: "/terms", label: "Terms of Service" },
    ]}
  >
    {PRIVACY_POLICY_SECTIONS.map((section) => (
      <Section key={section.title} title={section.title}>
        {"content" in section && section.content?.map((p, i) => <p key={i}>{p}</p>)}

        {"intro" in section && section.intro && <p>{section.intro}</p>}

        {"list" in section && section.list && (
          <ul className="list-disc list-inside flex flex-col gap-1 pl-1">
            {section.list.map((item, i) =>
              typeof item === "string" ? (
                <li key={i}>{item}</li>
              ) : (
                <li key={i}>
                  <span className="font-medium text-gray-700">{item.label}</span> -- {item.detail}
                </li>
              ),
            )}
          </ul>
        )}

        {"footer" in section && section.footer && <p>{section.footer}</p>}

        {"contact" in section && section.contact && (
          <p>
            If you have questions about this Privacy Policy or how we handle your data, please reach
            out at{" "}
            <a href={`mailto:${section.contact.email}`} className="text-blue-500 hover:underline">
              {section.contact.email}
            </a>
            .
          </p>
        )}
      </Section>
    ))}
  </LegalPageLayout>
);

export default PrivacyPolicy;
