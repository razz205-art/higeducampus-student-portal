import AuthCard from "@/components/auth/AuthCard";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";

export const metadata = { title: "Forgot password | HigEduCampus" };

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      eyebrow="HigEduCampus"
      title="Reset your password"
      subtitle="Enter your account email and we'll send you a reset link."
      footer={
        <a href="/login" className="font-medium text-gold-400 hover:text-gold-500">
          Back to sign in
        </a>
      }
    >
      <ForgotPasswordForm />
    </AuthCard>
  );
}
