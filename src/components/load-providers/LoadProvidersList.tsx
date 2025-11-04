import { LoadProvider } from "@/pages/LoadProviders";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Phone, Mail, MapPin, User, Eye } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface LoadProvidersListProps {
  providers: LoadProvider[];
  loading: boolean;
  onEdit: (provider: LoadProvider) => void;
  onViewDetails: (provider: LoadProvider) => void;
  onRefresh: () => void;
}

export const LoadProvidersList = ({ providers, loading, onEdit, onViewDetails }: LoadProvidersListProps) => {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-56" />
        ))}
      </div>
    );
  }

  if (providers.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground mb-4">No load providers added yet</p>
          <p className="text-sm text-muted-foreground">Click "Add Provider" to get started</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {providers.map((provider) => (
        <Card key={provider.id} className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <CardTitle className="text-lg">{provider.provider_name}</CardTitle>
              <Badge variant={provider.is_active ? "default" : "secondary"}>
                {provider.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {provider.contact_person && (
              <div className="flex items-center text-sm">
                <User className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>{provider.contact_person}</span>
              </div>
            )}
            
            <div className="flex items-center text-sm">
              <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>{provider.phone}</span>
            </div>

            {provider.email && (
              <div className="flex items-center text-sm">
                <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
                <span className="truncate">{provider.email}</span>
              </div>
            )}

            {provider.address && (
              <div className="flex items-start text-sm">
                <MapPin className="mr-2 h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <span className="line-clamp-2">{provider.address}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 mt-4">
              <Button
                variant="default"
                size="sm"
                onClick={() => onViewDetails(provider)}
              >
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(provider)}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
