import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

// Helper type for inserting records
type TruckInsert = Database['public']['Tables']['trucks']['Insert'];
type LoadInsert = Database['public']['Tables']['loads']['Insert'];
type TransactionInsert = Database['public']['Tables']['transactions']['Insert'];
type LoadProviderInsert = Database['public']['Tables']['load_providers']['Insert'];

/**
 * Service to handle database operations for the AI assistant.
 * Returns data in a simplified JSON format.
 */
export const aiDbService = {
  // --- Trucks ---
  async getTrucks() {
    const { data, error } = await supabase.from('trucks').select('*');
    if (error) throw new Error(`Failed to fetch trucks: ${error.message}`);
    return data;
  },

  async createTruck(truck: TruckInsert) {
    const { data, error } = await supabase.from('trucks').insert(truck).select().single();
    if (error) throw new Error(`Failed to create truck: ${error.message}`);
    return data;
  },

  // --- Loads ---
  async getLoads() {
    const { data, error } = await supabase.from('loads').select('*');
    if (error) throw new Error(`Failed to fetch loads: ${error.message}`);
    return data;
  },

  async createLoad(load: LoadInsert) {
    const { data, error } = await supabase.from('loads').insert(load).select().single();
    if (error) throw new Error(`Failed to create load: ${error.message}`);
    return data;
  },

  // --- Transactions ---
  async getTransactions() {
    const { data, error } = await supabase.from('transactions').select('*');
    if (error) throw new Error(`Failed to fetch transactions: ${error.message}`);
    return data;
  },

  async createTransaction(transaction: TransactionInsert) {
    const { data, error } = await supabase.from('transactions').insert(transaction).select().single();
    if (error) throw new Error(`Failed to create transaction: ${error.message}`);
    return data;
  },

  // --- Load Providers ---
  async getLoadProviders() {
    const { data, error } = await supabase.from('load_providers').select('*');
    if (error) throw new Error(`Failed to fetch load providers: ${error.message}`);
    return data;
  },

  async createLoadProvider(provider: LoadProviderInsert) {
     const { data, error } = await supabase.from('load_providers').insert(provider).select().single();
    if (error) throw new Error(`Failed to create load provider: ${error.message}`);
    return data;
  }
};
