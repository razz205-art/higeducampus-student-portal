diff --git a/src/components/auth/LoginForm.tsx b/src/components/auth/LoginForm.tsx
index e282c85..cdae37b 100644
--- a/src/components/auth/LoginForm.tsx
+++ b/src/components/auth/LoginForm.tsx
@@ -1,7 +1,7 @@
 "use client";
 
 import { useState } from "react";
-import { useRouter, useSearchParams } from "next/navigation";
+import { useSearchParams } from "next/navigation";
 import { signIn } from "next-auth/react";
 import Input from "@/components/ui/Input";
 import Button from "@/components/ui/Button";
@@ -18,7 +18,6 @@ const ERROR_MESSAGES: Record<string, string> = {
 };
 
 export default function LoginForm() {
-  const router = useRouter();
   const searchParams = useSearchParams();
   const callbackUrl = searchParams.get("callbackUrl") ?? "/";
 
@@ -50,15 +49,21 @@ export default function LoginForm() {
       callbackUrl,
     });
 
-    setIsLoading(false);
-
     if (result?.error) {
+      setIsLoading(false);
       setFormError(ERROR_MESSAGES[result.error] ?? ERROR_MESSAGES.default);
       return;
     }
 
-    router.push(result?.url ?? callbackUrl);
-    router.refresh();
+    // Use a hard navigation instead of router.push(). The credentials
+    // sign-in above sets the session cookie via a separate fetch response;
+    // a client-side router.push() can fire before the browser has fully
+    // committed that cookie, so middleware reads no session on the very
+    // next request and bounces back to /login (looks like login "didn't
+    // work" and forces re-entering credentials). A full navigation always
+    // carries the freshly-set cookie. Keep isLoading true so the button
+    // stays in its loading state through the redirect.
+    window.location.href = result?.url ?? callbackUrl;
   }
 
   return (
