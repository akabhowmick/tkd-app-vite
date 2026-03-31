import React from "react";
import { Link } from "react-router-dom";
import { LegalPageLayout } from "../components/LegalPageLayout";
import { TERMS_OF_SERVICE_SECTIONS } from "../utils/LegalContent";

const LegalSection: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <div className="mb-8">
    <h2 className="text-base font-semibold text-gray-900 mb-3">{title}</h2>
    <div className="text-sm text-gray-600 leading-relaxed flex flex-col gap-2">{children}</div>
  </div>
);

const TermsOfService: React.FC = () => (
  <LegalPageLayout
    title="Terms of Service"
    footerLinks={[
      { to: "/login", label: "Back to Login", primary: true },
      { to: "/privacy", label: "Privacy Policy" },
    ]}
  >
    {TERMS_OF_SERVICE_SECTIONS.map((section) => (
      <LegalSection key={section.title} title={section.title}>
        {"content" in section && section.content?.map((p, i) => <p key={i}>{p}</p>)}

        {"intro" in section && section.intro && <p>{section.intro}</p>}

        {"list" in section && section.list && (
          <ul className="list-disc list-inside flex flex-col gap-1 pl-1">
            {section.list.map((item, i) =>
              typeof item === "string" ? (
                <li key={i}>{item}</li>
              ) : (
                <li key={i}>
                  <span className="font-medium text-gray-700">
                    {(item as { label: string; detail: string }).label}
                  </span>{" "}
                  -- {(item as { label: string; detail: string }).detail}
                </li>
              ),
            )}
          </ul>
        )}

        {"footer" in section && section.footer && <p>{String(section.footer)}</p>}

        {/* The "Student and User Data" section has an inline Privacy Policy link */}
        {"privacyLink" in section && section.privacyLink && (
          <p>
            You retain ownership of the data you input into TaekwonTrack. We process that data on
            your behalf to provide the service. See our{" "}
            <Link to="/privacy" className="text-blue-500 hover:underline">
              Privacy Policy
            </Link>{" "}
            for details on how we handle data.
          </p>
        )}

        {"contact" in section && section.contact && (
          <p>
            Questions about these Terms of Service? Reach out at{" "}
            <a href={`mailto:${section.contact.email}`} className="text-blue-500 hover:underline">
              {section.contact.email}
            </a>
            .
          </p>
        )}
      </LegalSection>
    ))}
  </LegalPageLayout>
);

export default TermsOfService;
