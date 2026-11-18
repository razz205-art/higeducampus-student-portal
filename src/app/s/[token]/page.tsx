import SharedMaterialsPage from "@/app/shared/[token]/page";

// Short form of /shared/<token> — same public page, shorter to share.
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Study Materials",
  robots: { index: false, follow: false },
};

export default SharedMaterialsPage;
