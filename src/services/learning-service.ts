import { supabase } from './supabase';

/**
 * Service to handle user-provided corrections and labels for pills.
 * These labels can be used to improve the AI model (RAG or Fine-tuning).
 */
export const labelPill = async (
  userId: string,
  base64Image: string,
  pillName: string,
  strength: string,
  aiName?: string
) => {
  try {
    // In production, we would upload to Supabase Storage first.
    // For MVP feedback loop, we store the metadata and base64 (if under limits).
    const { data, error } = await supabase
      .from('labeled_pills')
      .insert({
        user_id: userId,
        image_url: `data:image/jpeg;base64,${base64Image}`,
        pill_name: pillName,
        strength: strength,
        ai_identified_name: aiName,
      });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Learning Service Error:', error);
    return { success: false, error };
  }
};
