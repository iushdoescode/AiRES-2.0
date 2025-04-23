import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { createSupabaseClient } from '../lib/supabase';

export const useSupabaseClient = () => {
  const { getToken } = useAuth();
  const [supabaseClient, setSupabaseClient] = useState(null);

  useEffect(() => {
    const setupClient = async () => {
      const token = await getToken({ template: 'supabase' });
      const client = createSupabaseClient(token);
      setSupabaseClient(client);
    };

    setupClient();
  }, [getToken]);

  return supabaseClient;
}; 