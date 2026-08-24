import { supabase } from '@/lib/supabase'; // adapte le chemin vers ton client Supabase existant

const POST_MEDIA_BUCKET = 'post-media';
const SIGNED_URL_TTL_SECONDS = 60 * 60; // 1h

/**
 * Résout un unique storage_path en URL signée temporaire.
 * Retourne null si la résolution échoue (fichier absent, accès refusé, etc.).
 */
export async function resolveMediaUrl(storagePath: string | null | undefined): Promise<string | null> {
  if (!storagePath) return null;

  const { data, error } = await supabase.storage
    .from(POST_MEDIA_BUCKET)
    .createSignedUrl(storagePath, SIGNED_URL_TTL_SECONDS);

  if (error || !data?.signedUrl) {
    console.error('Failed to sign media URL for', storagePath, error);
    return null;
  }

  return data.signedUrl;
}

/**
 * Résout plusieurs storage_path en une seule requête batch (plus efficace
 * que d'appeler resolveMediaUrl() en boucle pour un post multi-média).
 * Retourne un Map<storagePath, signedUrl | null>.
 */
export async function resolveMediaUrls(
  storagePaths: string[]
): Promise<Map<string, string | null>> {
  const uniquePaths = Array.from(new Set(storagePaths.filter(Boolean)));
  const result = new Map<string, string | null>();

  if (uniquePaths.length === 0) return result;

  const { data, error } = await supabase.storage
    .from(POST_MEDIA_BUCKET)
    .createSignedUrls(uniquePaths, SIGNED_URL_TTL_SECONDS);

  if (error || !data) {
    console.error('Failed to batch-sign media URLs', error);
    uniquePaths.forEach((path) => result.set(path, null));
    return result;
  }

  data.forEach((entry, index) => {
    const path = uniquePaths[index];
    result.set(path, entry.error ? null : entry.signedUrl ?? null);
  });

  return result;
}

/**
 * Enrichit un tableau de post_media bruts (storage_path / thumbnail_path)
 * avec leurs URLs signées url / thumbnail, prêt à consommer par PostCard.
 */
export async function hydratePostMedia
  T extends { storagePath: string; thumbnailPath?: string }
>(rawMedia: T[]): Promise<(T & { url: string | null; thumbnail: string | null })[]> {
  const allPaths = rawMedia.flatMap((m) => [m.storagePath, m.thumbnailPath].filter(Boolean) as string[]);
  const signedMap = await resolveMediaUrls(allPaths);

  return rawMedia.map((m) => ({
    ...m,
    url: signedMap.get(m.storagePath) ?? null,
    thumbnail: m.thumbnailPath ? signedMap.get(m.thumbnailPath) ?? null : null,
  }));
}