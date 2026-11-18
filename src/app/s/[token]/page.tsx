import SharedMaterialsPage from "@/app/shared/[token]/page";

// Short form of /shared/<token> — same public page, shorter to share.
export const dynamic = "force-dynamic";
export { generateMetadata } from "@/app/shared/[token]/page";

export default SharedMaterialsPage;
