"use client";

import { useState, useTransition } from "react";
import { CheckCircle2 } from "lucide-react";
import { submitOwnAttendanceAction } from "@/lib/actions/attendance";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";

export default function MarkAttendanceButton({ alreadyCheckedIn }: { alreadyCheckedIn: boolean }) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [done, setDone] = useState(alreadyCheckedIn);

  function handleClick() {
    setResult(null);
    startTransition(async () => {
      const res = await submitOwnAttendanceAction();
      setResult(res);
      if (res.success) setDone(true);
    });
  }

  if (done) {
    return (
      <Alert variant="success">
        <span className="flex items-center gap-2">
          <CheckCircle2 size={16} aria-hidden="true" />
          {result?.message ?? "You're marked present for this class."}
        </span>
      </Alert>
    );
  }

  return (
    <div className="space-y-3">
      {result && !result.success && <Alert variant="error">{result.message}</Alert>}
      <Button onClick={handleClick} isLoading={isPending}>
        Mark My Attendance
      </Button>
    </div>
  );
}
