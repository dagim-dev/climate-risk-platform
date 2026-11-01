import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { AuthSessionProvider } from "@/components/auth/AuthSessionProvider";

export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <AuthSessionProvider>
      <Header />
      <main id="content" className="flex flex-1 flex-col bg-canvas">
        {children}
      </main>
      <Footer />
    </AuthSessionProvider>
  );
}
