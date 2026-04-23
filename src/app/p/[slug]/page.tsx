import { notFound } from "next/navigation";
import { PublicResumePage } from "@/components/public/public-resume-page";
import { demoResume } from "@/lib/data/demo-resume";
import { getSupabasePublicClient } from "@/lib/supabase/public";
import { normalizeResumeProfile } from "@/lib/utils";

export default async function PublicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const client = getSupabasePublicClient();

  if (!client) {
    if (slug !== demoResume.slug) {
      notFound();
    }

    return (
      <main className="app-shell py-8">
        <PublicResumePage resume={demoResume} />
      </main>
    );
  }

  const { data } = await client
    .from("resume_profiles")
    .select("*")
    .eq("slug", slug)
    .eq("visibility", "public")
    .maybeSingle();

  if (!data) {
    notFound();
  }

  const resume = normalizeResumeProfile(data);

  return (
    <main className="app-shell py-8">
      <PublicResumePage resume={resume} />
    </main>
  );
}

