import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

export const usePermissions = (page) => {
  const [hasPermission, setHasPermission] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkPermissions = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }

      // Admin has all permissions
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (profile && profile.role === 'admin') {
        setHasPermission(true);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('user_permissions')
        .select('permission')
        .eq('user_id', session.user.id)
        .eq('permission', page);

      if (error || !data || data.length === 0) {
        navigate('/');
      } else {
        setHasPermission(true);
      }
      setLoading(false);
    };

    checkPermissions();
  }, [page, navigate]);

  return { hasPermission, loading };
};
