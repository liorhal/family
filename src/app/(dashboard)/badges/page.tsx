import { createClient } from "@/lib/supabase/server";
import { BadgeProgressList } from "@/components/badges/BadgeProgressList";

export default async function BadgesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: member } = await supabase
    .from("members")
    .select("family_id")
    .eq("user_id", user.id)
    .single();
  if (!member) return null;

  const { data: members } = await supabase
    .from("members")
    .select("id, name, avatar_url")
    .eq("family_id", member.family_id);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">Badges</h1>
      <BadgeProgressList members={members ?? []} />
    </div>
  );
}
