import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { routes } from "@/config/site";
import CredentialMailerView from "@/components/admin/CredentialMailerView";

export const metadata = { title: "Send Login Credentials" };

// Sending a few hundred emails takes several Resend batch calls.
export const maxDuration = 60;

export default async function SendCredentialsPage() {
  const session = await auth();
  const role = session?.user?.role;
  if (role !== "ACADEMIC_ADMIN" && role !== "SUPER_ADMIN") {
    redirect(routes.unauthorized);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-xl font-extrabold text-ink-900">Send Login Credentials</h1>
        <p className="mt-1 text-sm text-ink-900/50">
          Upload an Excel sheet of usernames, passwords and email IDs — each person gets an email
          with their own login details. This doesn&apos;t create or change any portal accounts.
        </p>
      </div>
      <CredentialMailerView />
    </div>
  );
}
