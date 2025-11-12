import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/components/ui/use-toast';

const pages = ["dashboard", "trucks", "load-providers", "loads", "transactions", "reports"];

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [permissions, setPermissions] = useState({});

  useEffect(() => {
    const fetchUsersAndPermissions = async () => {
      const { data: usersData, error: usersError } = await supabase.from('profiles').select('*');
      if (usersError) {
        console.error('Error fetching users:', usersError);
      } else {
        setUsers(usersData);
      }

      const { data: permissionsData, error: permissionsError } = await supabase.from('user_permissions').select('*');
      if (permissionsError) {
        console.error('Error fetching permissions:', permissionsError);
      } else {
        const perms = {};
        permissionsData.forEach(p => {
          if (!perms[p.user_id]) {
            perms[p.user_id] = [];
          }
          perms[p.user_id].push(p.permission);
        });
        setPermissions(perms);
      }
    };

    fetchUsersAndPermissions();
  }, []);

  const handlePermissionChange = (userId, permission) => {
    setPermissions(prev => {
      const userPerms = prev[userId] ? [...prev[userId]] : [];
      if (userPerms.includes(permission)) {
        return { ...prev, [userId]: userPerms.filter(p => p !== permission) };
      } else {
        return { ...prev, [userId]: [...userPerms, permission] };
      }
    });
  };

  const savePermissions = async (userId) => {
    const userPerms = permissions[userId] || [];
    // First, delete all existing permissions for the user
    const { error: deleteError } = await supabase.from('user_permissions').delete().eq('user_id', userId);
    if (deleteError) {
        console.error('Error deleting permissions:', deleteError);
        toast({ title: "Error", description: "Failed to save permissions." });
        return;
    }

    // Then, insert the new permissions
    if(userPerms.length > 0) {
        const { error: insertError } = await supabase.from('user_permissions').insert(userPerms.map(p => ({ user_id: userId, permission: p })));
        if (insertError) {
            console.error('Error inserting permissions:', insertError);
            toast({ title: "Error", description: "Failed to save permissions." });
            return;
        }
    }
    toast({ title: "Success", description: "Permissions saved successfully." });
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">User Management</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead>
            <tr>
              <th className="py-2 px-4 border-b">Full Name</th>
              <th className="py-2 px-4 border-b">Email</th>
              <th className="py-2 px-4 border-b">Role</th>
              <th className="py-2 px-4 border-b">Permissions</th>
              <th className="py-2 px-4 border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td className="py-2 px-4 border-b">{user.full_name}</td>
                <td className="py-2 px-4 border-b">{user.email}</td>
                <td className="py-2 px-4 border-b">{user.role}</td>
                <td className="py-2 px-4 border-b">
                  {pages.map(page => (
                    <div key={page} className="flex items-center space-x-2">
                      <Checkbox
                        id={`${user.id}-${page}`}
                        checked={(permissions[user.id] || []).includes(page)}
                        onCheckedChange={() => handlePermissionChange(user.id, page)}
                      />
                      <label htmlFor={`${user.id}-${page}`}>{page}</label>
                    </div>
                  ))}
                </td>
                <td className="py-2 px-4 border-b">
                  <Button onClick={() => savePermissions(user.id)}>Save</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagement;
