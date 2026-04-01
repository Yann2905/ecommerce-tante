import { supabase } from '../../config/supabase';

// ✅ Interface alignée sur ton schéma Supabase réel
interface ProductData {
  name: string;
  description?: string | null;
  price: number;
  discount_price?: number | null;
  stock: number;
  category_id: number; // ✅ Retour au format ID (int4)
  image_url: string;
  is_active?: boolean;
}

export class ProductService {
  async getAllAdmin() {
    const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  async create(productData: ProductData) {
    const { data, error } = await supabase.from('products').insert([productData]).select().single();
    if (error) throw error;
    return data;
  }

  async update(id: string, updates: Partial<ProductData>) {
    const { data, error } = await supabase.from('products').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  }

  async delete(id: string) {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw error;
    return true;
  }
}