import type { Metadata } from "next";
import { PageHeader, SectionLabel } from "@/components/ui";
import { CONTACT_EMAIL, society } from "@/lib/content";

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "What the Cambridge University Urdu Society does with your details, and how to have them removed.",
};

const sections = [
  {
    heading: "What we hold",
    body: [
      "Joining the society happens on the Cambridge SU's own site, under the SU's privacy notice. From the membership list the SU gives us, we hold your name, email address and - if you gave it - your CRSid, so we can tell you what is on.",
      "If you book a place at an event, we hold your name, email and the number of places, so we can run the door list. Anything you write in the notes field is seen only by the committee.",
      "If you join the mailing list, we hold your email address and the date you confirmed it.",
    ],
  },
  {
    heading: "What we do not do",
    body: [
      "We do not sell or share your details with anyone outside the society. We do not run advertising trackers on this site.",
      "We do not add anyone to the mailing list without them confirming it from their own inbox first.",
    ],
  },
  {
    heading: "Who can see it",
    body: [
      "Only the current committee, through a sign-in restricted to a list of named addresses. Access is removed when a committee member leaves their role.",
      "Our data is stored with Neon (database) and Vercel (hosting), and email is sent through Resend. All three hold data in line with UK GDPR.",
    ],
  },
  {
    heading: "How long we keep it",
    body: [
      "Event bookings are deleted a year after the event. Membership records are kept while you are a member and for one year afterwards. Mailing list entries are kept until you unsubscribe.",
    ],
  },
  {
    heading: "Your rights",
    body: [
      "You can ask to see what we hold about you, correct it, or have it deleted. Every mailing list email has a one-click unsubscribe link.",
      `For anything else, write to ${CONTACT_EMAIL} and a committee member will deal with it within a month.`,
    ],
  },
];

export default function PrivacyPage() {
  return (
    <>
      <PageHeader
        title="What we do with your details."
        intro={`${society.name} is a small student society. We hold as little about you as we can, and only to run the society.`}
      />

      <section>
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 lg:py-20">
          <div className="max-w-2xl space-y-14">
            {sections.map((section) => (
              <div key={section.heading}>
                <SectionLabel as="h2" className="text-ink-muted">
                  {section.heading}
                </SectionLabel>
                <div className="mt-6 space-y-4">
                  {section.body.map((paragraph) => (
                    <p
                      key={paragraph.slice(0, 40)}
                      className="leading-relaxed text-ink"
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
