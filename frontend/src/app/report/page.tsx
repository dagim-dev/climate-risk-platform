import { Suspense } from "react";
import { ReportPageContent } from "./ReportPageContent";

export default function ReportPage() {
  return (
    <Suspense fallback={null}>
      <ReportPageContent />
    </Suspense>
  );
}
