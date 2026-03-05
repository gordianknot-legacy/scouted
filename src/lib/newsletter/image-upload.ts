import { supabase } from '../supabase'

const BUCKET = 'newsletter-images'

export async function uploadNewsletterImage(file: File): Promise<string> {
  if (!supabase) throw new Error('Supabase not configured')

  const ext = file.name.split('.').pop() || 'png'
  const path = `${crypto.randomUUID()}.${ext}`

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      contentType: file.type,
      upsert: false,
    })

  if (error) throw error

  const { data: urlData } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(path)

  return urlData.publicUrl
}

export async function deleteNewsletterImage(publicUrl: string): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured')

  // Extract path from public URL
  const match = publicUrl.match(/\/newsletter-images\/(.+)$/)
  if (!match) return

  const { error } = await supabase.storage
    .from(BUCKET)
    .remove([match[1]])

  if (error) console.error('Failed to delete image:', error)
}
