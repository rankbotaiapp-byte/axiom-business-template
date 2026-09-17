import { LivingVisionPage } from "@/components/vision/page";

export default async function VisionRoute({ params }: PageProps<"/vision/[id]">) {
  const { id } = await params;
  return <LivingVisionPage visionId={id} />;
}
