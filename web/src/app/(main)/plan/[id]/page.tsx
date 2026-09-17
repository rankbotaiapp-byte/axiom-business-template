import { PlanWorkspace } from "@/components/plan";

export default async function PlanPage({ params }: PageProps<"/plan/[id]">) {
  const { id } = await params;
  return <PlanWorkspace planId={id} />;
}
