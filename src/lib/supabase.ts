"use client";
// Placeholder: se completa en la fase de Supabase.
export async function uploadToStorage(file: File, folder: string): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  void file; void folder;
  return { ok: false, error: "Supabase aún no está conectado." };
}
