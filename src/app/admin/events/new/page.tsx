import { AdminPageHeader } from "@/components/admin/ui";
import { EventForm } from "@/components/admin/event-form";

export const metadata = { title: "New event" };

export default function NewEventPage() {
  return (
    <>
      <AdminPageHeader
        title="New event"
        description="It stays a draft until you tick publish, so you can write it now and release it later."
        backHref="/admin/events"
        backLabel="Events"
      />
      <EventForm />
    </>
  );
}
