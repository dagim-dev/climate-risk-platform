import "./report.css";

export default function ReportLayout({ children }: LayoutProps<"/report">) {
  return (
    <main id="content" className="report-root flex flex-1 flex-col bg-canvas text-ink">
      {children}
    </main>
  );
}
