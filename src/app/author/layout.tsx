import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AuthorSidebar } from "@/components/author/AuthorSidebar";

export default async function AuthorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-50 text-gray-900 font-sans">
      <AuthorSidebar />
      {/* No overflow here: an overflow container would become the sticky containing
          block and break the editors' `sticky top-*` header bars. */}
      <main className="flex-1 min-w-0">
        {children}
      </main>
    </div>
  );
}
