import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import Register from "@/pages/register";
import CustomerPanel from "@/pages/customer-panel";
import Sales from "@/pages/sales";
import RestaurantRegister from "@/pages/restaurant-register";
import RestaurantPanel from "@/pages/restaurant-panel";
import Dashboard from "@/pages/dashboard";
import Menu from "@/pages/menu";
import SetupRestaurant from "@/pages/setup-restaurant";
import AuthCallback from "@/pages/auth-callback";
import InternalLogin from "@/pages/internal-login";
import ControlePage from "@/pages/controle";
import DevLogin from "@/pages/desenvolvedor";
import AdminDashboard from "@/pages/admin-dashboard";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/login" component={Login} />
      <Route path="/internal-login" component={InternalLogin} />
      <Route path="/register" component={Register} />
      <Route path="/auth-callback" component={AuthCallback} />
      <Route path="/customer-panel" component={CustomerPanel} />
      <Route path="/sales" component={Sales} />
      <Route path="/restaurant-register" component={RestaurantRegister} />
      <Route path="/restaurant-panel" component={RestaurantPanel} />
      <Route path="/setup-restaurant" component={SetupRestaurant} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/controle" component={ControlePage} />
      <Route path="/desenvolvedor" component={DevLogin} />
      <Route path="/admin-dashboard" component={AdminDashboard} />
      <Route path="/restaurant/:restaurantId" component={Menu} />
      <Route path="/menu/:restaurantId" component={Menu} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
