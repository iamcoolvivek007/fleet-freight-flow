import { usePermissions } from "@/hooks/usePermissions";

const ProtectedRoute = ({ page, children }) => {
  const { hasPermission, loading } = usePermissions(page);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return hasPermission ? children : null;
};

export default ProtectedRoute;
