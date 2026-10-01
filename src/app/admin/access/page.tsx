import {
  AdminPageHeader,
  AdminTable,
  Badge,
  Td,
  Th,
} from "@/components/admin/ui";
import { DangerConfirm } from "@/components/admin/danger-confirm";
import {
  Field,
  FormMessage,
  Input,
  Select,
  SubmitButton,
} from "@/components/form";
import { requireOwner } from "@/lib/auth/guard";
import { listAdmins } from "@/lib/admin/queries";
import { formatEventDateWithYear } from "@/lib/format";
import { env } from "@/lib/env";
import { addAdmin, changeAdminRole, removeAdmin } from "./actions";

export const metadata = { title: "Access" };

type PageProps = {
  searchParams: Promise<{ error?: string; ok?: string }>;
};

const ERROR_COPY: Record<string, string> = {
  Invalid: "Please give a valid email address and role.",
  Duplicate: "That address is already on the list.",
  LastOwner:
    "That is the last owner. Make someone else an owner first, otherwise nobody would be able to manage access.",
  Unexpected: "Something went wrong at our end. Please try again in a moment.",
};

const OK_COPY: Record<string, string> = {
  added: "Added. They can sign in at /login straight away.",
  removed: "Removed. Any session they still have stops working immediately.",
  role: "Role updated.",
};

export default async function AdminAccessPage({ searchParams }: PageProps) {
  // Owner-only: editors can run the society, but changing who holds the keys
  // is the one thing that can lock everyone out.
  const owner = await requireOwner();
  const { error, ok } = await searchParams;

  const allowlist = await listAdmins();
  const ownerCount = allowlist.filter((row) => row.role === "owner").length;

  return (
    <>
      <AdminPageHeader
        title="Access"
        description="Who can sign in to these committee pages. Checked on every request, so removing someone takes effect at once - even if they are signed in."
      />

      {error ? (
        <div className="mb-6">
          <FormMessage tone="error">
            {ERROR_COPY[error] ?? ERROR_COPY.Unexpected}
          </FormMessage>
        </div>
      ) : null}

      {ok ? (
        <div className="mb-6">
          <FormMessage tone="success">
            {OK_COPY[ok] ?? "Saved."}
          </FormMessage>
        </div>
      ) : null}

      {/* Sign-in needs Raven credentials, so an address added while they are
          missing cannot actually be used. Say so on the page that adds it. */}
      {!env.ravenEnabled ? (
        <div className="mb-6">
          <FormMessage tone="error">
            This deployment has no Raven credentials, so nobody can sign in yet -
            including anyone added below. Set AUTH_GOOGLE_ID and
            AUTH_GOOGLE_SECRET to switch sign-in on.
          </FormMessage>
        </div>
      ) : null}

      <AdminTable
        head={
          <>
            <Th>Email</Th>
            <Th>Name</Th>
            <Th>Role</Th>
            <Th>Last signed in</Th>
            <Th>Added by</Th>
            <Th className="text-right">Actions</Th>
          </>
        }
      >
        {allowlist.map((row) => {
          const isSelf = row.email === owner.email;
          // The rule the actions enforce, mirrored here so the control is not
          // offered at all rather than failing on submit.
          const isLastOwner = row.role === "owner" && ownerCount === 1;

          return (
            <tr key={row.id}>
              <Td className="break-all">
                <span className="font-medium">{row.email}</span>
                {isSelf ? (
                  <span className="mt-0.5 block text-[0.65rem] tracking-[0.16em] text-ink-muted uppercase">
                    You
                  </span>
                ) : null}
              </Td>

              <Td className="text-ink-muted">{row.name ?? "-"}</Td>

              <Td>
                {isLastOwner ? (
                  <div className="flex flex-col gap-1">
                    <Badge tone="good">Owner</Badge>
                    <span className="text-[0.65rem] text-ink-muted">
                      Last owner
                    </span>
                  </div>
                ) : (
                  <form
                    action={changeAdminRole}
                    className="flex items-center gap-2"
                  >
                    <input type="hidden" name="id" value={row.id} />
                    <label className="sr-only" htmlFor={`role-${row.id}`}>
                      Role for {row.email}
                    </label>
                    <Select
                      id={`role-${row.id}`}
                      name="role"
                      defaultValue={row.role}
                      className="w-auto px-3 py-1.5 text-xs"
                    >
                      <option value="editor">Editor</option>
                      <option value="owner">Owner</option>
                    </Select>
                    <SubmitButton
                      variant="outline"
                      pendingLabel="Saving…"
                      className="px-3 py-1.5 text-xs"
                    >
                      Save
                    </SubmitButton>
                  </form>
                )}
              </Td>

              <Td className="text-xs text-ink-muted">
                {row.lastSignInAt
                  ? formatEventDateWithYear(row.lastSignInAt)
                  : "Never"}
              </Td>

              <Td className="text-xs break-all text-ink-muted">
                {row.addedByEmail ?? "-"}
              </Td>

              <Td className="text-right">
                {isLastOwner ? (
                  <span className="text-xs text-ink-muted">-</span>
                ) : (
                  <form action={removeAdmin}>
                    <input type="hidden" name="id" value={row.id} />
                    <DangerConfirm
                      phrase={row.email}
                      openLabel="Remove…"
                      confirmLabel="Remove access"
                      pendingLabel="Removing…"
                      description={
                        isSelf
                          ? "This is your own access - you will be signed out of the committee pages."
                          : "They lose access immediately, even if signed in."
                      }
                    />
                  </form>
                )}
              </Td>
            </tr>
          );
        })}
      </AdminTable>

      <section className="mt-12 max-w-lg border-t border-rule/70 pt-8">
        <h2 className="text-[0.65rem] font-medium tracking-[0.22em] text-ink-muted uppercase">
          Add someone
        </h2>
        <p className="mt-3 mb-5 text-sm leading-relaxed text-ink-muted">
          Use the address they will actually sign in with - the sign-in link is
          emailed there, and it is matched exactly. Editors can change events,
          verses, the roster and the gallery. Owners can additionally manage
          this page.
        </p>

        <form action={addAdmin} className="flex flex-col gap-5">
          <Field
            label="Email"
            htmlFor="access-email"
            hint="A personal address is fine - a shared inbox means a shared sign-in link."
            required
          >
            <Input
              id="access-email"
              name="email"
              type="email"
              autoComplete="off"
              required
            />
          </Field>

          <Field label="Name" htmlFor="access-name" hint="Optional.">
            <Input id="access-name" name="name" autoComplete="off" />
          </Field>

          <Field label="Role" htmlFor="access-role" required>
            <Select id="access-role" name="role" defaultValue="editor">
              <option value="editor">Editor</option>
              <option value="owner">Owner</option>
            </Select>
          </Field>

          <div>
            <SubmitButton pendingLabel="Adding…" className="px-5 py-2.5 text-xs">
              Add to the list
            </SubmitButton>
          </div>
        </form>
      </section>

      <section className="mt-12 max-w-lg border-t border-rule/70 pt-8">
        <h2 className="text-[0.65rem] font-medium tracking-[0.22em] text-ink-muted uppercase">
          When the committee changes
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-ink-muted">
          Add the incoming committee as owners before the outgoing one removes
          itself, and check this list has at least two owners at all times - an
          owner who graduates and loses their email cannot be replaced from
          inside the site. There is no password and no external account to pass
          on; this list is the whole of it.
        </p>
      </section>
    </>
  );
}
