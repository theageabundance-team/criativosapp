import type { SupabaseClient } from "@supabase/supabase-js";

export async function downloadCreative(
  supabase: SupabaseClient,
  filePath: string,
  fileName: string
) {
  const { data, error } = await supabase.storage
    .from("creatives")
    .createSignedUrl(filePath, 60, { download: fileName });

  if (error || !data) throw error ?? new Error("Não foi possível gerar o link de download");

  const link = document.createElement("a");
  link.href = data.signedUrl;
  link.download = fileName;
  link.click();
}
