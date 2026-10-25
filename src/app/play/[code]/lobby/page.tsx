import { LivePlayClient } from "@/components/public/LivePlayClient";

export default async function LobbyPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  return <LivePlayClient initialCode={code} />;
}
