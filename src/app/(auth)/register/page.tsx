import AuthCard from "@/components/auth/AuthCard";
import RegisterForm from "@/components/auth/RegisterForm";

export const metadata = { title: "Create account" };

export default function RegisterPage() {
  return (
    <AuthCard
      eyebrow="LMS Portal"
      title="Create your student account"
      footer={
        <>
          Already have an account?{" "}
          <a href="/login" className="font-medium text-gold-400 hover:text-gold-500">
            Sign in
          </a>
        </>
      }
    >
      <RegisterForm />
    </AuthCard>
  );
}
