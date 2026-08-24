import "./report.css";

export default function ReportLayout({ children }: LayoutProps<"/report">) {
  return (
    <main className="report-root flex flex-1 flex-col bg-white text-zinc-900">
      {children}
    </main>
  );
}
