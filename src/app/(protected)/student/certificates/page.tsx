import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { routes } from "@/config/site";
import { getCompletedCourses, getStudentCertificates } from "@/lib/data/certificates";
import CompletedCoursesCard from "@/components/certificates/CompletedCoursesCard";
import CertificateHistoryCard from "@/components/certificates/CertificateHistoryCard";

export const metadata = { title: "Certificates" };

export default async function StudentCertificatesPage() {
  const session = await auth();
  const role = session?.user?.role;
  if (role !== "STUDENT" && role !== "SUPER_ADMIN") {
    redirect(routes.unauthorized);
  }
  const studentId = session!.user.id;

  const [completedCourses, certificates] = await Promise.all([
    getCompletedCourses(studentId),
    getStudentCertificates(studentId),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-xl font-semibold text-ink-900">Certificates</h1>
        <p className="mt-1 text-sm text-ink-900/50">
          Download a certificate for any course you&rsquo;ve fully completed. Every certificate
          includes a QR code anyone can scan to verify it&rsquo;s genuine.
        </p>
      </div>

      <CompletedCoursesCard courses={completedCourses} />
      <CertificateHistoryCard certificates={certificates} />
    </div>
  );
}
