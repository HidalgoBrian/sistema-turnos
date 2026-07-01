import { supabase } from '../lib/supabase'
import type { Service } from '../types/ServiceType'

export async function getServices(): Promise<Service[]> {
  const { data, error } = await supabase.from('services').select('*')
  if (error) throw error
  return data || []
}
