import { ButtonLink, PageHeader, Urdu } from "@/components/ui";

export default function NotFound() {
  return (
    <PageHeader
      title="This page has wandered off."
      intro="The link may be old, or we may have moved something. The term card and the gallery are both a good place to pick up the thread."
    >
      <div className="flex flex-wrap items-center gap-6">
        <ButtonLink href="/">Back to the beginning</ButtonLink>
        <ButtonLink href="/events" variant="outline">
          See what&rsquo;s on
        </ButtonLink>
        <Urdu className="text-2xl text-gold-deep">محفل</Urdu>
      </div>
    </PageHeader>
  );
}
