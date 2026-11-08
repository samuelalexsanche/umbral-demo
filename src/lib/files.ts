"use client";
// Subida de archivos. En modo local se guardan como data URL (solo imágenes chicas);
// con Supabase se suben al bucket "material" y se regresa la URL pública.
import { REMOTE } from "./backend";
import { uploadToStorage } from "./supabase";

const LOCAL_LIMIT = 1.5 * 1024 * 1024;

function shrinkImage(file: File, max = 1600): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * scale);
      c.height = Math.round(img.height * scale);
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
      resolve(c.toDataURL("image/jpeg", 0.78));
      URL.revokeObjectURL(img.src);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

export async function uploadFile(file: File, folder: string): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  if (REMOTE) return uploadToStorage(file, folder);
  if (file.type.startsWith("image/")) return { ok: true, url: await shrinkImage(file) };
  if (file.size > LOCAL_LIMIT) return { ok: false, error: "En modo local solo se pueden subir imágenes o archivos de menos de 1.5 MB. Pega un enlace (Drive, Dropbox) en su lugar." };
  return new Promise((resolve) => {
    const r = new FileReader();
    r.onload = () => resolve({ ok: true, url: String(r.result) });
    r.onerror = () => resolve({ ok: false, error: "No se pudo leer el archivo." });
    r.readAsDataURL(file);
  });
}
