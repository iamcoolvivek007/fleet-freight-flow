import { useState, useEffect } from "react";
import { useNavigate, Outlet, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Truck,
  Users,
  Package,
  CreditCard,
  FileText,
  LogOut,
  Menu,
  X,
  Settings
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * @name AppLayout
 * @description The layout for the application.
 * @returns {JSX.Element | null} - The JSX for the component.
 */
const AppLayout = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchSessionAndProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);

      if (session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();
        if (profile) {
          setUserRole(profile.role);
        }
      } else {
        navigate("/auth");
      }
      setLoading(false);
    };

    fetchSessionAndProfile();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        navigate("/auth");
      } else {
        const fetchProfile = async () => {
            const { data: profile } = await supabase
              .from('profiles')
              .select('role')
              .eq('id', session.user.id)
              .single();
            if (profile) {
              setUserRole(profile.role);
            }
        }
        fetchProfile();
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const [menuItems, setMenuItems] = useState([]);

  useEffect(() => {
    const fetchPermissionsAndSetMenu = async () => {
        if (session) {
            const baseMenuItems = [
                { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
                { icon: Truck, label: "Trucks", path: "/trucks" },
                { icon: Users, label: "Load Providers", path: "/load-providers" },
                { icon: Package, label: "Loads", path: "/loads" },
                { icon: CreditCard, label: "Transactions", path: "/transactions" },
                { icon: FileText, label: "Reports", path: "/reports" },
            ];

            if (userRole === 'admin') {
                setMenuItems([...baseMenuItems, { icon: Settings, label: "User Management", path: "/user-management" }]);
                return;
            }

            const { data: permissions, error } = await supabase
                .from('user_permissions')
                .select('permission')
                .eq('user_id', session.user.id);

            if (error) {
                console.error("Error fetching permissions:", error);
                setMenuItems([]);
                return;
            }

            const allowedPages = permissions.map(p => p.permission);
            const filteredMenuItems = baseMenuItems.filter(item => allowedPages.includes(item.path.replace('/', '')));
            setMenuItems(filteredMenuItems);
        }
    };

    fetchPermissionsAndSetMenu();
  }, [session, userRole]);

  if (loading || !userRole) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Mobile Header */}
      <div className="lg:hidden bg-card border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Truck className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg">FreightFlow</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-background/95 backdrop-blur-sm">
          <div className="p-4 space-y-2">
            {menuItems.map((item) => (
              <Button
                key={item.path}
                variant={location.pathname === item.path ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => {
                  navigate(item.path);
                  setMobileMenuOpen(false);
                }}
              >
                <item.icon className="mr-2 h-4 w-4" />
                {item.label}
              </Button>
            ))}
            <div className="text-center text-sm text-muted-foreground mt-4">created by vivek</div>
            <Button
              variant="ghost"
              className="w-full justify-start text-destructive hover:text-destructive"
              onClick={handleSignOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      )}

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex flex-col w-64 bg-card border-r border-border min-h-screen">
          <div className="p-6 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Truck className="h-6 w-6 text-primary" />
              </div>
              <span className="font-bold text-xl">FreightFlow</span>
            </div>
          </div>
          <nav className="flex-1 p-4 space-y-2">
            {menuItems.map((item) => (
              <Button
                key={item.path}
                variant={location.pathname === item.path ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => navigate(item.path)}
              >
                <item.icon className="mr-2 h-4 w-4" />
                {item.label}
              </Button>
            ))}
          </nav>
          <div className="p-4 border-t border-border">
            <div className="text-center text-sm text-muted-foreground mb-2">created by vivek</div>
            <Button
              variant="ghost"
              className="w-full justify-start text-destructive hover:text-destructive"
              onClick={handleSignOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
