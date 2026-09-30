import type { Metadata } from "next";
import { signOut } from "@/auth";
import { AdminNav } from "@/components/admin/nav";
import { requireAdmin } from "@/lib/auth/guard";

// Reads the session cookie and the allowlist on every request.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s — Admin" },
  // Never index the committee's working pages, even if a URL leaks.
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // The gate for every admin page. Actions guard themselves separately —
  // a layout does not run before a server action.
  const admin = await requireAdmin();

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
      <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
        <aside className="lg:w-48 lg:shrink-0">
          <div className="lg:sticky lg:top-24">
            <p className="mb-4 hidden text-[0.65rem] font-medium tracking-[0.22em] text-ink-muted uppercase lg:block">
              Committee
            </p>

            <AdminNav role={admin.role} />

            <div className="mt-6 border-t border-rule/70 pt-4">
              <p className="text-xs leading-relaxed break-words text-ink-muted">
                {admin.name ?? admin.email}
                {admin.role === "owner" ? (
                  <span className="mt-1 block text-[0.65rem] tracking-[0.16em] text-gold-deep uppercase">
                    Owner
                  </span>
                ) : null}
              </p>

              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <button
                  type="submit"
                  className="mt-3 text-xs text-ink-muted underline underline-offset-4 transition-colors hover:text-wine"
                >
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
