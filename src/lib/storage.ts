import { supabase } from "./supabase";

/**
 * Upload a file (from URL or Blob) to Supabase Storage.
 * Returns the public URL of the uploaded file.
 */
export async function uploadToStorage(
  userId: string,
  generationId: string,
  fileName: string,
  fileOrUrl: File | Blob | string,
): Promise<string> {
  let blob: Blob;

  if (typeof fileOrUrl === "string") {
    // It's a URL — fetch the image
    const res = await fetch(fileOrUrl);
    blob = await res.blob();
  } else {
    blob = fileOrUrl;
  }

  const path = `${userId}/${generationId}/${fileName}`;

  const { error } = await supabase.storage.from("generations").upload(path, blob, {
    contentType: blob.type || "image/png",
    upsert: true,
  });

  if (error) throw error;

  const { data } = supabase.storage.from("generations").getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Save a generation record to the database + upload images to storage.
 */
export async function saveGenerationToHistory(params: {
  userId: string;
  templateId: string;
  templateImageUrl: string;
  productImageUrl: string;
  resultImageUrl: string;
  prompt: string;
  isSaved?: boolean;
}): Promise<{ id: string; productImageUrl: string; resultImageUrl: string; templateImageUrl: string }> {
  const generationId = crypto.randomUUID();
  const isSaved = params.isSaved ?? false;

  // Upload only the result image to Supabase Storage
  const storedResult = await uploadToStorage(params.userId, generationId, "result.png", params.resultImageUrl);

  // Insert generation record with product and template image urls as null
  const { data, error } = await supabase
    .from("generations")
    .insert({
      id: generationId,
      user_id: params.userId,
      template_id: params.templateId,
      template_image_url: null,
      product_image_url: null,
      result_image_url: storedResult,
      prompt: params.prompt,
      status: "completed",
      is_saved: isSaved,
    })
    .select("id")
    .single();

  if (error) throw error;

  // Increment generation count
  try {
    await supabase.rpc("increment_generation_count", { uid: params.userId });
  } catch (err) {
    // Non-critical, don't fail the save
    console.warn("Failed to increment generation count", err);
  }

  return { 
    id: data.id,
    productImageUrl: "",
    resultImageUrl: storedResult,
    templateImageUrl: ""
  };
}

/**
 * Fetch user's generations from the database.
 */
export async function fetchGenerations(options?: {
  savedOnly?: boolean;
  limit?: number;
  offset?: number;
}) {
  let query = supabase
    .from("generations")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  if (options?.savedOnly) {
    query = query.eq("is_saved", true);
  }
  if (options?.limit) {
    query = query.limit(options.limit);
  }
  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
  }

  const { data, error, count } = await query;
  if (error) throw error;
  return { data: data ?? [], count: count ?? 0 };
}

/**
 * Toggle the saved status of a generation.
 */
export async function toggleSaveGeneration(generationId: string, isSaved: boolean) {
  const { error } = await supabase
    .from("generations")
    .update({ is_saved: isSaved })
    .eq("id", generationId);

  if (error) throw error;
}

/**
 * Delete a generation and its storage files.
 */
export async function deleteGeneration(userId: string, generationId: string) {
  // Delete storage files
  const folder = `${userId}/${generationId}`;
  const { data: files } = await supabase.storage.from("generations").list(folder);
  if (files && files.length > 0) {
    await supabase.storage.from("generations").remove(files.map((f) => `${folder}/${f.name}`));
  }

  // Delete database record
  const { error } = await supabase.from("generations").delete().eq("id", generationId);
  if (error) throw error;
}
