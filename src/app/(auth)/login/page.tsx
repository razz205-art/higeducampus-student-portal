import { Suspense } from "react";
import AuthCard from "@/components/auth/AuthCard";
import LoginForm from "@/components/auth/LoginForm";

export const metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <AuthCard
      eyebrow="LMS Portal"
      title="Welcome to HiG EDUCAMPUS"
      subtitle="Your learning journey starts here."
      footer={
        <>
          New student?{" "}
          <a href="/register" className="font-medium text-gold-400 hover:text-gold-500">
            Create an account
          </a>
        </>
      }
    >
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </AuthCard>
  );
}
