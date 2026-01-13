import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface FilterOptions {
  categories: string[];
  metals: string[];
  karats: string[];
  gemstones: string[];
  priceRange: { min: number; max: number };
}

export const useFilterOptions = () => {
  const { user, session } = useAuth();
  
  return useQuery({
    queryKey: ['filter-options'],
    queryFn: async (): Promise<FilterOptions> => {
      // Get distinct values for each filter field
      const { data: products, error } = await supabase
        .from('products')
        .select('category, metal, karat, gemstone, unit_price')
        .not('unit_price', 'is', null);

      if (error) throw error;

      // Extract unique values and filter out nulls/empty strings
      const categories = [...new Set(products.map(p => p.category).filter(Boolean))].sort();
      const metals = [...new Set(products.map(p => p.metal).filter(Boolean))].sort();
      const karats = [...new Set(products.map(p => p.karat).filter(Boolean))].sort();
      const gemstones = [...new Set(products.map(p => p.gemstone).filter(Boolean))].sort();
      
      // Add common options that might not be in the database yet
      const allCategories = [...new Set([
        ...categories,
        'Rings', 'Necklaces', 'Earrings', 'Bracelets', 'Watches', 'Pendants', 'Brooches'
      ])].sort();

      const allMetals = [...new Set([
        ...metals,
        'Gold', 'Silver', 'Platinum', 'Rose Gold', 'White Gold', 'Yellow Gold', 'Titanium'
      ])].sort();

      const allKarats = [...new Set([
        ...karats,
        '9K', '14K', '18K', '22K', '24K'
      ])].sort();

      const allGemstones = [...new Set([
        ...gemstones,
        'Diamond', 'Ruby', 'Sapphire', 'Emerald', 'Pearl', 'Amethyst', 'Topaz', 'None'
      ])].sort();

      // Calculate price range
      const prices = products.map(p => Number(p.unit_price)).filter(p => p > 0);
      const minPrice = Math.floor(Math.min(...prices) / 100) * 100; // Round down to nearest 100
      const maxPrice = Math.ceil(Math.max(...prices) / 100) * 100;  // Round up to nearest 100

      return {
        categories: allCategories,
        metals: allMetals,
        karats: allKarats,
        gemstones: allGemstones,
        priceRange: { 
          min: minPrice || 0, 
          max: maxPrice || 50000 
        }
      };
    },
    enabled: !!user && !!session,
  });
};