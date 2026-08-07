import { Suspense } from "react";
import AuthCard from "@/components/auth/AuthCard";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";

export const metadata = { title: "Reset password" };

export default function ResetPasswordPage({ searchParams }: { searchParams: { token?: string } }) {
  return (
    <AuthCard eyebrow="LMS Portal" title="Choose a new password">
      <Suspense fallback={null}>
        <ResetPasswordForm token={searchParams.token ?? ""} />
      </Suspense>
    </AuthCard>
  );
}
