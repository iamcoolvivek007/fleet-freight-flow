import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Truck, Package, TrendingUp, Users } from "lucide-react";

/**
 * @name Index
 * @description The index page.
 * @returns {JSX.Element} - The JSX for the component.
 */
const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/auth");
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center p-4">
      <div className="max-w-4xl text-center space-y-8">
        <div className="space-y-4">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-primary rounded-2xl">
              <Truck className="h-12 w-12 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-5xl font-bold tracking-tight">FreightFlow</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Complete logistics management for your truck parking and freight business
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mt-12">
          <div className="p-6 bg-card rounded-lg border">
            <Package className="h-8 w-8 text-primary mb-3 mx-auto" />
            <h3 className="font-semibold mb-2">Load Management</h3>
            <p className="text-sm text-muted-foreground">Track and assign loads efficiently</p>
          </div>
          <div className="p-6 bg-card rounded-lg border">
            <TrendingUp className="h-8 w-8 text-success mb-3 mx-auto" />
            <h3 className="font-semibold mb-2">Profit Tracking</h3>
            <p className="text-sm text-muted-foreground">Monitor earnings and commissions</p>
          </div>
          <div className="p-6 bg-card rounded-lg border">
            <Users className="h-8 w-8 text-accent mb-3 mx-auto" />
            <h3 className="font-semibold mb-2">Client Management</h3>
            <p className="text-sm text-muted-foreground">Manage trucks and load providers</p>
          </div>
        </div>

        <Button size="lg" onClick={() => navigate("/auth")} className="mt-8">
          Get Started
        </Button>
      </div>
    </div>
  );
};

export default Index;
