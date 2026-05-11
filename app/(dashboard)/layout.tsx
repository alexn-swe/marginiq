import Sidebar from "@/app/components/Sidebar";
import Header from "@/app/components/Header";

// This layout wraps every page inside the (dashboard) folder.
// It places the sidebar on the left and stacks the header + page content on the right.
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-full">
      {/* Left sidebar */}
      <Sidebar />

      {/* Right side: header on top, page content below */}
      <div className="flex flex-col flex-1 min-w-0">
        <Header />
        <main className="flex-1 overflow-auto bg-slate-50 p-6">{children}</main>
      </div>
    </div>
  );
}
