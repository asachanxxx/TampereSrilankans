import { SupabaseClient } from '@supabase/supabase-js';

export class ConfigRepository {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get a single config value by key. Returns null if not found.
   */
  async getConfig(key: string): Promise<string | null> {
    const { data, error } = await this.supabase
      .from('app_config')
      .select('value')
      .eq('key', key)
      .single();

    if (error || !data) return null;
    return data.value;
  }

  /**
   * Get all config values as a plain key→value record.
   */
  async getAllConfig(): Promise<Record<string, string>> {
    const { data, error } = await this.supabase
      .from('app_config')
      .select('key, value');

    if (error || !data) return {};
    return Object.fromEntries(data.map((row) => [row.key, row.value]));
  }
}
