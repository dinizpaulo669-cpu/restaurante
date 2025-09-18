import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useWebSocket } from "@/hooks/use-websocket";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { Restaurant, User, Coupon, Table, Product, Order } from "@shared/schema";
import { ProductForm } from "@/components/product-form";
import { ProductCard } from "@/components/product-card";
import { CategoryForm } from "@/components/category-form";
import { CategoryList } from "@/components/category-list";
import { AdditionalForm } from "@/components/additional-form";
import { AdditionalList } from "@/components/additional-list";
import { OrderCard } from "@/components/order-card";
import { PlanoSelector } from "@/components/PlanoSelector";
import { PaymentHistory } from "@/components/PaymentHistory";
import { 
  Home, 
  Package, 
  Settings, 
  FileText, 
  CreditCard,
  LogOut,
  Clock,
  ChevronDown,
  ChevronRight,
  Plus,
  Minus,
  Edit,
  Trash2,
  QrCode,
  Users,
  Search,
  AlertTriangle,
  Package2
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";


export default function Dashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState("comandas");
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showAdditionalForm, setShowAdditionalForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [editingAdditional, setEditingAdditional] = useState<any>(null);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [productSubSection, setProductSubSection] = useState("produtos");
  const [configurationSubSection, setConfigurationSubSection] = useState("dados-empresa");
  
  // Estados para mesas
  const [showTableForm, setShowTableForm] = useState(false);
  const [editingTable, setEditingTable] = useState<any>(null);
  const [selectedTable, setSelectedTable] = useState<any>(null);
  const [showTableOrdersModal, setShowTableOrdersModal] = useState(false);
  
  // Estados para edição de pedidos
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [showOrderEditForm, setShowOrderEditForm] = useState(false);
  
  // Estados para fechamento de conta
  const [showCloseTableModal, setShowCloseTableModal] = useState(false);
  const [selectedTableForClose, setSelectedTableForClose] = useState<any>(null);
  const [splitBill, setSplitBill] = useState(false);
  const [numberOfPeople, setNumberOfPeople] = useState(1);
  
  // Estados para fechamento por usuário individual
  const [closeByUser, setCloseByUser] = useState(false);
  const [selectedUserForClose, setSelectedUserForClose] = useState<string>("");
  
  // Estados para gorjeta
  const [tipEnabled, setTipEnabled] = useState(false);
  const [tipPercentage, setTipPercentage] = useState(10);
  
  // Estados para histórico de pedidos
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [orderTypeFilter, setOrderTypeFilter] = useState("all");
  const [tableFilter, setTableFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  
  // Estados para consulta de estoque
  const [stockSearchTerm, setStockSearchTerm] = useState("");
  const [stockSortBy, setStockSortBy] = useState<"name" | "stock">("stock");
  const [stockAdjustmentLoading, setStockAdjustmentLoading] = useState<string | null>(null);
  const [stockQuantityInputs, setStockQuantityInputs] = useState<{[key: string]: number}>({});
  
  // Estados para horários de funcionamento
  const [openingHours, setOpeningHours] = useState({
    segunda: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
    terca: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
    quarta: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
    quinta: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
    sexta: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
    sabado: { isOpen: true, openTime: '09:00', closeTime: '16:00' },
    domingo: { isOpen: false, openTime: '09:00', closeTime: '16:00' }
  });
  const [isEditingHours, setIsEditingHours] = useState(false);
  
  // Estados para abas extras - movidos para o topo para evitar erro de hooks
  const [description, setDescription] = useState("");
  const [isEditingAbout, setIsEditingAbout] = useState(false);
  const [logoUrl, setLogoUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");

  // Estados para configurações - movidos para o topo para evitar erro de hooks
  const [isEditingCompanyData, setIsEditingCompanyData] = useState(false);
  const [companyFormData, setCompanyFormData] = useState({
    name: "",
    description: "",
    category: "",
    address: "",
    phone: "",
    email: "",
  });
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [selectedSeoCategories, setSelectedSeoCategories] = useState<string[]>([]);
  
  // Conectar WebSocket para atualizações em tempo real
  const { isConnected: wsConnected } = useWebSocket({
    userId: user?.id,
    userType: 'restaurant',
    onStatusUpdate: (status, order) => {
      // Query das orders já será invalidada automaticamente pelo hook
      console.log(`Status do pedido ${order.id} atualizado para: ${status}`);
    },
    onNewMessage: (message) => {
      // Query das mensagens já será invalidada automaticamente pelo hook  
      console.log(`Nova mensagem no pedido ${message.orderId}:`, message.message);
    }
  });
  
  // Estados para gerenciamento de usuários
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [newUserData, setNewUserData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    permissions: [] as string[]
  });
  
  // Estados para configuração de área de atendimento
  const [cepRange, setCepRange] = useState({
    start: "",
    end: "",
    deliveryFee: "",
    minTime: "",
    maxTime: ""
  });

  // Estados para seleção de bairros
  const [neighborhoods, setNeighborhoods] = useState<string[]>([]);
  const [serviceAreas, setServiceAreas] = useState<any[]>([]);
  const [loadingNeighborhoods, setLoadingNeighborhoods] = useState(false);
  const [selectedNeighborhoods, setSelectedNeighborhoods] = useState<{[key: string]: {selected: boolean, fee: string}}>({});
  const [neighborhoodSearchTerm, setNeighborhoodSearchTerm] = useState("");

  // Query para cupons - movida para o topo para evitar erro de hooks
  const { data: coupons = [] } = useQuery<Coupon[]>({
    queryKey: ["/api/dev/coupons"],
    enabled: isAuthenticated && activeSection === "cupons"
  });

  // Estados para formulário de cupom
  const [couponForm, setCouponForm] = useState({
    code: "",
    description: "",
    discountType: "percentage",
    discountValue: "",
    minOrderValue: "",
    maxUses: "",
    validFrom: "",
    validUntil: ""
  });

  // Mutation para criar cupom - movida para o topo para evitar erro de hooks
  const createCouponMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/dev/coupons", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dev/coupons"] });
      setCouponForm({
        code: "",
        description: "",
        discountType: "percentage", 
        discountValue: "",
        minOrderValue: "",
        maxUses: "",
        validFrom: "",
        validUntil: ""
      });
      toast({
        title: "Cupom criado",
        description: "Cupom criado com sucesso!"
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao criar cupom",
        variant: "destructive"
      });
    }
  });

  const { data: restaurant, isLoading: restaurantLoading } = useQuery<Restaurant>({
    queryKey: ["/api/dev/my-restaurant"], // Usar rota de desenvolvimento
    enabled: isAuthenticated,
    retry: 3,
    refetchOnMount: true,
  });

  // Buscar produtos disponíveis para edição de pedidos
  const { data: availableProducts } = useQuery<Product[]>({
    queryKey: ["/api/restaurants", restaurant?.id, "products"],
    enabled: !!restaurant?.id && showOrderEditForm
  });

  // Debug log
  console.log("Dashboard Debug:", {
    isAuthenticated,
    userRole: user?.role,
    restaurant,
    restaurantLoading,
    activeSection,
    productSubSection
  });

  const { data: orders = [], isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ["/api/my-orders"],
    enabled: isAuthenticated && !!restaurant,
    retry: false,
  });

  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: [`/api/restaurants/${restaurant?.id}/products`],
    enabled: isAuthenticated && !!restaurant,
    retry: false,
  });

  // Queries para mesas
  const { data: tables = [], isLoading: tablesLoading } = useQuery<Table[]>({
    queryKey: ["/api/dev/tables"],
    enabled: !!restaurant,
    retry: false,
  });

  // Query para buscar histórico de pedidos com paginação
  const { 
    data: historyData, 
    isLoading: historyLoading 
  } = useQuery({
    queryKey: ["/api/dev/orders/history", { 
      dateFrom, 
      dateTo, 
      orderType: orderTypeFilter, 
      tableId: tableFilter, 
      page: currentPage, 
      pageSize 
    }],
    enabled: activeSection === "historico"
  });

  // Atualizar estados quando restaurant carrega
  useEffect(() => {
    if (restaurant) {
      setDescription(restaurant.description || "");
      setLogoUrl(restaurant.logoUrl || "");
      setBannerUrl(restaurant.bannerUrl || "");
      setCompanyFormData({
        name: restaurant.name || "",
        description: restaurant.description || "",
        category: restaurant.category || "",
        address: restaurant.address || "",
        phone: restaurant.phone || "",
        email: restaurant.email || "",
      });
      setWhatsappNumber(restaurant.notificationWhatsapp || "");
    }
  }, [restaurant]);

  // Extrair cidade e estado do endereço do restaurante
  const extractCityState = (address: string) => {
    try {
      console.log('Extraindo cidade/estado de:', address);
      
      // Padrões comuns de endereço brasileiro:
      // "Rua..., 123 - Bairro, Cidade - UF, CEP"
      // "Rua..., 123, Cidade - UF"
      // "Rua..., Cidade - UF"
      
      const parts = address.split(',');
      console.log('Parts:', parts);
      
      // Procurar por padrão "Cidade - UF" em qualquer parte
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i].trim();
        
        // Verificar se a parte contém hífen (indicando cidade - estado)
        if (part.includes(' - ')) {
          const cityStateArr = part.split(' - ');
          if (cityStateArr.length >= 2) {
            const city = cityStateArr[0].trim();
            const state = cityStateArr[1].trim().split(' ')[0]; // Remove CEP se estiver junto
            
            // Verificar se o estado tem 2 caracteres (UF brasileira)
            if (state.length === 2) {
              console.log('Extracted city:', city, 'state:', state);
              return { city, state };
            }
          }
        }
      }
      
      // Se não encontrou padrão específico, usar valores padrão para teste
      console.log('Não foi possível extrair cidade/estado. Usando valores padrão para teste.');
      return { city: 'Petrópolis', state: 'RJ' };
      
    } catch (error) {
      console.error('Erro ao extrair cidade/estado:', error);
      return { city: 'Petrópolis', state: 'RJ' };
    }
  };

  const { city, state } = restaurant ? extractCityState(restaurant.address) : { city: '', state: '' };

  // Buscar bairros da cidade quando o componente carregar
  useEffect(() => {
    if (city && state && configurationSubSection === "cep") {
      setLoadingNeighborhoods(true);
      console.log(`Buscando bairros para ${city} - ${state} via ViaCEP + dados locais...`);
      
      fetch(`/api/neighborhoods/${encodeURIComponent(city)}/${encodeURIComponent(state)}`)
        .then(res => res.json())
        .then(data => {
          console.log(`Bairros encontrados:`, data);
          setNeighborhoods(data);
          setLoadingNeighborhoods(false);
        })
        .catch(error => {
          console.error('Erro ao buscar bairros:', error);
          setLoadingNeighborhoods(false);
        });
    }
  }, [city, state, configurationSubSection]);

  // Buscar áreas de serviço existentes
  useEffect(() => {
    if (restaurant?.id && configurationSubSection === "cep") {
      fetch(`/api/service-areas/${restaurant.id}`)
        .then(res => res.json())
        .then(data => {
          setServiceAreas(data);
          // Preencher selectedNeighborhoods com dados existentes
          const existing: {[key: string]: {selected: boolean, fee: string}} = {};
          data.forEach((area: any) => {
            existing[area.neighborhood] = {
              selected: area.isActive,
              fee: area.deliveryFee
            };
          });
          setSelectedNeighborhoods(existing);
        })
        .catch(error => console.error('Erro ao buscar áreas de serviço:', error));
    }
  }, [restaurant?.id, configurationSubSection]);

  const handleNeighborhoodChange = (neighborhood: string, field: 'selected' | 'fee', value: boolean | string) => {
    setSelectedNeighborhoods(prev => ({
      ...prev,
      [neighborhood]: {
        ...prev[neighborhood],
        [field]: value
      }
    }));
  };

  const saveServiceAreas = async () => {
    if (!restaurant?.id || !city || !state) return;

    try {
      // Primeiro, remover todas as áreas existentes
      await Promise.all(serviceAreas.map((area: any) => 
        fetch(`/api/service-areas/${area.id}`, { method: 'DELETE' })
      ));

      // Depois, criar as novas áreas selecionadas
      const promises = Object.entries(selectedNeighborhoods)
        .filter(([_, config]) => config.selected && parseFloat(config.fee) >= 0)
        .map(([neighborhood, config]) => 
          fetch('/api/service-areas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              restaurantId: restaurant.id,
              neighborhood,
              city,
              state,
              deliveryFee: config.fee,
              isActive: true
            })
          })
        );

      await Promise.all(promises);

      toast({
        title: "Sucesso",
        description: "Área de atendimento configurada com sucesso!",
      });
    } catch (error) {
      toast({
        title: "Erro", 
        description: "Não foi possível salvar a configuração",
        variant: "destructive"
      });
    }
  };

  // Mutations para mesas
  const createTableMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/dev/tables", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dev/tables"] });
      setShowTableForm(false);
      toast({
        title: "Mesa criada!",
        description: "A mesa foi criada com sucesso.",
      });
    },
    onError: (error) => {
      console.error("Error creating table:", error);
      toast({
        title: "Erro",
        description: "Falha ao criar mesa.",
        variant: "destructive",
      });
    },
  });

  const updateTableMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => apiRequest("PUT", `/api/dev/tables/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dev/tables"] });
      setEditingTable(null);
      toast({
        title: "Mesa atualizada!",
        description: "A mesa foi atualizada com sucesso.",
      });
    },
    onError: (error) => {
      console.error("Error updating table:", error);
      toast({
        title: "Erro",
        description: "Falha ao atualizar mesa.",
        variant: "destructive",
      });
    },
  });

  const deleteTableMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/dev/tables/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dev/tables"] });
      toast({
        title: "Mesa excluída!",
        description: "A mesa foi excluída com sucesso.",
      });
    },
    onError: (error) => {
      console.error("Error deleting table:", error);
      toast({
        title: "Erro",
        description: "Falha ao excluir mesa.",
        variant: "destructive",
      });
    },
  });

  // Mutations para produtos
  const deleteProductMutation = useMutation({
    mutationFn: (productId: string) => apiRequest("DELETE", `/api/dev/products/${productId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/restaurants/${(restaurant as any)?.id}/products`] });
      toast({
        title: "Produto excluído!",
        description: "O produto foi excluído com sucesso.",
      });
    },
    onError: (error: any) => {
      console.error("Error deleting product:", error);
      toast({
        title: "Erro",
        description: "Falha ao excluir produto.",
        variant: "destructive",
      });
    },
  });

  const updateStockMutation = useMutation({
    mutationFn: ({ productId, quantity, operation }: { productId: string, quantity: number, operation: 'add' | 'remove' }) => 
      apiRequest("POST", `/api/dev/products/${productId}/stock`, { quantity, operation }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/restaurants/${(restaurant as any)?.id}/products`] });
      toast({
        title: "Estoque atualizado!",
        description: "O estoque foi atualizado com sucesso.",
      });
    },
    onError: (error: any) => {
      console.error("Error updating stock:", error);
      toast({
        title: "Erro",
        description: "Falha ao atualizar estoque.",
        variant: "destructive",
      });
    },
  });

  // Função para deletar produto
  const handleDeleteProduct = (productId: string) => {
    if (confirm("Tem certeza que deseja excluir este produto?")) {
      deleteProductMutation.mutate(productId);
    }
  };

  // Função para ajustar estoque
  const handleStockAdjustment = (productId: string, adjustment: number) => {
    setStockAdjustmentLoading(productId);
    
    const operation = adjustment > 0 ? 'add' : 'remove';
    const quantity = Math.abs(adjustment);
    
    updateStockMutation.mutate(
      { productId, quantity, operation },
      {
        onSettled: () => {
          setStockAdjustmentLoading(null);
        }
      }
    );
  };

  // Função para ajustar estoque com quantidade customizada
  const handleCustomStockAdjustment = (productId: string, operation: 'add' | 'remove') => {
    const quantity = stockQuantityInputs[productId] || 1;
    
    if (quantity <= 0) {
      toast({
        title: "Quantidade inválida",
        description: "A quantidade deve ser maior que zero.",
        variant: "destructive",
      });
      return;
    }

    // Verificar se está tentando remover mais do que tem em estoque
    if (operation === 'remove') {
      const product = (products as any[]).find(p => p.id === productId);
      const currentStock = product?.stock || 0;
      
      if (quantity > currentStock) {
        toast({
          title: "Estoque insuficiente",
          description: `Não é possível remover ${quantity} unidades. Estoque atual: ${currentStock}`,
          variant: "destructive",
        });
        return;
      }
    }
    
    setStockAdjustmentLoading(productId);
    
    updateStockMutation.mutate(
      { productId, quantity, operation },
      {
        onSettled: () => {
          setStockAdjustmentLoading(null);
        }
      }
    );
  };

  // Função para obter a quantidade do input (padrão 1)
  const getStockInputQuantity = (productId: string) => {
    return stockQuantityInputs[productId] || 1;
  };

  // Função para atualizar a quantidade do input
  const setStockInputQuantity = (productId: string, quantity: number) => {
    setStockQuantityInputs(prev => ({
      ...prev,
      [productId]: Math.max(1, quantity)
    }));
  };

  // Função para imprimir conta
  const handlePrintBill = (tableData: any, totalWithTip: number, tipAmount: number) => {
    const printContent = `
      <div style="font-family: Arial, sans-serif; max-width: 300px; margin: 0 auto;">
        <h2 style="text-align: center; margin-bottom: 20px;">CONTA - Mesa ${tableData.number}</h2>
        ${tableData.name ? `<p style="text-align: center; margin: 5px 0;">${tableData.name}</p>` : ''}
        <hr style="margin: 15px 0;" />
        
        <div style="margin-bottom: 15px;">
          <strong>Resumo dos Produtos:</strong>
        </div>
        
        ${tableData.items?.map((item: any) => `
          <div style="display: flex; justify-content: space-between; margin: 5px 0;">
            <span>${item.quantity}x ${item.product?.name || 'Produto'}</span>
            <span>R$ ${item.subtotal?.toFixed(2) || '0.00'}</span>
          </div>
        `).join('') || ''}
        
        <hr style="margin: 15px 0;" />
        
        <div style="display: flex; justify-content: space-between; margin: 5px 0;">
          <span>Subtotal:</span>
          <span>R$ ${(totalWithTip - tipAmount).toFixed(2)}</span>
        </div>
        
        ${tipAmount > 0 ? `
          <div style="display: flex; justify-content: space-between; margin: 5px 0;">
            <span>Gorjeta (${tipPercentage}%):</span>
            <span>R$ ${tipAmount.toFixed(2)}</span>
          </div>
        ` : ''}
        
        <div style="display: flex; justify-content: space-between; margin: 10px 0; font-size: 18px; font-weight: bold; border-top: 1px solid #000; padding-top: 10px;">
          <span>TOTAL:</span>
          <span>R$ ${totalWithTip.toFixed(2)}</span>
        </div>
        
        <div style="text-align: center; margin-top: 20px; font-size: 12px;">
          <p>Obrigado pela preferência!</p>
          <p>${new Date().toLocaleString('pt-BR')}</p>
        </div>
      </div>
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }
  };

  // Mutation para fechar conta da mesa
  const closeTableMutation = useMutation({
    mutationFn: ({ tableId, splitBill, numberOfPeople, closeByUser, selectedUser }: { 
      tableId: string, 
      splitBill: boolean, 
      numberOfPeople: number,
      closeByUser?: boolean,
      selectedUser?: string
    }) => 
      apiRequest("POST", `/api/dev/tables/${tableId}/close`, { splitBill, numberOfPeople, closeByUser, selectedUser }),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dev/tables"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dev/orders/history"] });
      setShowCloseTableModal(false);
      setSplitBill(false);
      setNumberOfPeople(1);
      setCloseByUser(false);
      setSelectedUserForClose("");
      setTipEnabled(false);
      setTipPercentage(10);
      toast({
        title: "Conta fechada",
        description: data?.message || "A conta da mesa foi fechada com sucesso! Mesa liberada."
      });
    },
    onError: (error: any) => {
      console.error('Erro ao fechar conta:', error);
      toast({
        title: "Erro",
        description: "Não foi possível fechar a conta",
        variant: "destructive"
      });
    },
  });

  // Mutations para configurações - movidas para o topo para evitar erro de hooks
  const updateCompanyDataMutation = useMutation({
    mutationFn: (data: any) => apiRequest("PUT", "/api/dev/restaurant/company-data", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dev/my-restaurant"] });
      toast({
        title: "Dados atualizados!",
        description: "Os dados da empresa foram atualizados com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar os dados. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const updateWhatsAppMutation = useMutation({
    mutationFn: (whatsappNumber: string) => apiRequest("PUT", "/api/dev/restaurant/whatsapp", { whatsappNumber }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dev/my-restaurant"] });
      toast({
        title: "WhatsApp configurado!",
        description: "O número do WhatsApp foi configurado com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao configurar",
        description: "Não foi possível configurar o WhatsApp. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Mutations para atualizar informações do restaurante
  const updateAboutMutation = useMutation({
    mutationFn: (description: string) => apiRequest("PUT", "/api/dev/restaurant/about", { description }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dev/my-restaurant"] });
      toast({
        title: "Descrição atualizada!",
        description: "A descrição 'Sobre Nós' foi atualizada com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao atualizar descrição.",
        variant: "destructive",
      });
    },
  });

  const updateLogoMutation = useMutation({
    mutationFn: (logoUrl: string) => apiRequest("PUT", "/api/dev/restaurant/logo", { logoUrl }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dev/my-restaurant"] });
      toast({
        title: "Logo atualizado!",
        description: "O logo do restaurante foi atualizado com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao atualizar logo.",
        variant: "destructive",
      });
    },
  });

  const updateBannerMutation = useMutation({
    mutationFn: (bannerUrl: string) => apiRequest("PUT", "/api/dev/restaurant/banner", { bannerUrl }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dev/my-restaurant"] });
      toast({
        title: "Banner atualizado!",
        description: "O banner do restaurante foi atualizado com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao atualizar banner.",
        variant: "destructive",
      });
    },
  });

  // Upload mutations moved here to avoid hooks order issues
  const uploadLogoMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('logo', file);
      
      const response = await fetch('/api/dev/restaurants/logo', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Falha ao fazer upload do logo');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dev/my-restaurant"] });
      toast({
        title: "Logo atualizado!",
        description: "O logo foi enviado e atualizado com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro no upload",
        description: "Não foi possível fazer upload do logo. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const uploadBannerMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('banner', file);
      
      const response = await fetch('/api/dev/restaurants/banner', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Falha ao fazer upload do banner');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dev/my-restaurant"] });
      toast({
        title: "Banner atualizado!",
        description: "O banner foi enviado e atualizado com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro no upload",
        description: "Não foi possível fazer upload do banner. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Handlers para mesas
  const handleCreateTable = (formData: any) => {
    createTableMutation.mutate(formData);
  };

  const handleUpdateTable = (formData: any) => {
    if (editingTable) {
      updateTableMutation.mutate({ id: editingTable.id, data: formData });
    }
  };

  const handleDeleteTable = (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta mesa?")) {
      deleteTableMutation.mutate(id);
    }
  };

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Não autorizado",
        description: "Você precisa fazer login...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading || restaurantLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Restaurante não encontrado</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Você precisa configurar seu restaurante primeiro.</p>
            <Button onClick={() => window.location.href = "/"} className="mt-4">
              Voltar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: Home, hasSubmenu: false },
    { 
      id: "produtos", 
      label: "Produtos", 
      icon: Package, 
      hasSubmenu: true,
      submenu: [
        "Gerenciar produtos",
        "Consultar o estoque"
      ]
    },
    { id: "mesas", label: "Mesas", icon: Users, hasSubmenu: false },
    { id: "horarios", label: "Horários", icon: Clock, hasSubmenu: false },
    { id: "sobre-nos", label: "Sobre Nós", icon: FileText, hasSubmenu: false },
    { id: "logo", label: "Logo", icon: Edit, hasSubmenu: false },
    { id: "banner", label: "Banner", icon: Package, hasSubmenu: false },
    { id: "comandas", label: "Comandas", icon: FileText, hasSubmenu: false },
    { id: "historico", label: "Histórico de Pedidos", icon: Clock, hasSubmenu: false },
    { id: "cupons", label: "Criar Cupom", icon: CreditCard, hasSubmenu: false },
    { id: "plano", label: "Plano", icon: CreditCard, hasSubmenu: false },
    { 
      id: "configuracoes", 
      label: "Configurações", 
      icon: Settings, 
      hasSubmenu: true,
      submenu: [
        "Dados da empresa",
        "Configurar WhatsApp",
        "Configurar SEO",
        "Usuários",
        "Faixa de Cep"
      ]
    },
    { id: "controle", label: "Controle", icon: AlertTriangle, hasSubmenu: false },
  ];

  // Contadores de pedidos por status
  const orderCounts = {
    abertos: (orders as any[]).filter((order: any) => order.status === 'pending').length,
    preparando: (orders as any[]).filter((order: any) => order.status === 'preparing').length,
    entrega: (orders as any[]).filter((order: any) => order.status === 'out_for_delivery').length,
    finalizados: (orders as any[]).filter((order: any) => order.status === 'delivered').length,
    cancelados: (orders as any[]).filter((order: any) => order.status === 'cancelled').length,
  };

  // Produtos com estoque baixo para alertas do dashboard
  const dashboardLowStockProducts = (products as any[])?.filter(product => 
    (product.stock || 0) < (product.minStock || 10)
  ) || [];

  const handleMenuClick = (itemId: string) => {
    if (itemId === "controle") {
      // Redirecionar para página de controle
      window.location.href = "/controle";
      return;
    }
    
    if (menuItems.find(item => item.id === itemId)?.hasSubmenu) {
      setExpandedMenu(expandedMenu === itemId ? null : itemId);
    } else {
      setActiveSection(itemId);
      setExpandedMenu(null);
    }
  };

  const renderContent = () => {
    if (activeSection === "dashboard") {
      return (
        <div className="space-y-6">
          {/* Informações do restaurante */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-green-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Abertura</p>
                    <p className="font-semibold">{(restaurant as any).openingTime || "00:00"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-red-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Fechamento</p>
                    <p className="font-semibold">{(restaurant as any).closingTime || "22:22"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div>
                  <p className="text-sm text-muted-foreground">Tempo de entrega em minutos</p>
                  <p className="font-semibold text-2xl">{(restaurant as any).deliveryTime || 30}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Alertas de estoque baixo no dashboard principal */}
          {dashboardLowStockProducts.length > 0 && (
            <Card className="bg-orange-50 border-orange-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <AlertTriangle className="w-5 h-5 text-orange-600 mr-2" />
                    <h3 className="text-lg font-semibold text-orange-800">
                      Alerta de Estoque Baixo
                    </h3>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveSection("estoque")}
                    className="text-orange-700 border-orange-300 hover:bg-orange-100"
                  >
                    Ver Estoque
                  </Button>
                </div>
                <p className="text-orange-700 mb-3">
                  {dashboardLowStockProducts.length} produto(s) com estoque abaixo do mínimo:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-32 overflow-y-auto">
                  {dashboardLowStockProducts.slice(0, 6).map(product => (
                    <div key={product.id} className="flex justify-between items-center bg-white rounded-lg p-2 border border-orange-200">
                      <span className="font-medium text-sm truncate mr-2">{product.name}</span>
                      <Badge variant="destructive" className="text-xs">
                        {product.stock || 0}/{product.minStock || 10}
                      </Badge>
                    </div>
                  ))}
                  {dashboardLowStockProducts.length > 6 && (
                    <div className="col-span-full text-center text-orange-700 text-sm">
                      +{dashboardLowStockProducts.length - 6} outros produtos
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Dashboard de pedidos */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-blue-600">{orderCounts.abertos}</p>
                <p className="text-sm text-blue-600">Abertos</p>
              </CardContent>
            </Card>

            <Card className="bg-yellow-50 border-yellow-200">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-yellow-600">{orderCounts.preparando}</p>
                <p className="text-sm text-yellow-600">Preparando</p>
              </CardContent>
            </Card>

            <Card className="bg-purple-50 border-purple-200">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-purple-600">{orderCounts.entrega}</p>
                <p className="text-sm text-purple-600">Saiu para entrega</p>
              </CardContent>
            </Card>

            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-green-600">{orderCounts.finalizados}</p>
                <p className="text-sm text-green-600">Finalizados</p>
              </CardContent>
            </Card>

            <Card className="bg-red-50 border-red-200">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-red-600">{orderCounts.cancelados}</p>
                <p className="text-sm text-red-600">Cancelados</p>
              </CardContent>
            </Card>
          </div>
        </div>
      );
    }

    if (activeSection === "produtos") {
      const renderProductSubContent = () => {
        // Gerenciar Produtos
        if (productSubSection === "produtos") {
          if (showProductForm || editingProduct) {
            return (
              <ProductForm
                restaurantId={(restaurant as any).id}
                product={editingProduct}
                onSuccess={() => {
                  setShowProductForm(false);
                  setEditingProduct(null);
                }}
                onCancel={() => {
                  setShowProductForm(false);
                  setEditingProduct(null);
                }}
              />
            );
          }

          return (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">Gerenciar Produtos</h3>
                <Button 
                  onClick={() => setShowProductForm(true)}
                  data-testid="button-add-product"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Produto
                </Button>
              </div>

              {productsLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                </div>
              ) : (products as any[]).length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Nenhum produto cadastrado</h3>
                    <p className="text-muted-foreground mb-4">
                      Comece adicionando seu primeiro produto ao cardápio
                    </p>
                    <Button 
                      onClick={() => setShowProductForm(true)}
                      data-testid="button-add-first-product"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Primeiro Produto
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {(products as any[]).map((product: any) => (
                    <ProductCard 
                      key={product.id} 
                      product={product}
                      onEdit={(product) => setEditingProduct(product)}
                      onDelete={(productId) => handleDeleteProduct(productId)}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        }

        // Gerenciar Categorias
        if (productSubSection === "categorias") {
          if (showCategoryForm || editingCategory) {
            return (
              <CategoryForm
                restaurantId={(restaurant as any).id}
                category={editingCategory}
                onSuccess={() => {
                  setShowCategoryForm(false);
                  setEditingCategory(null);
                }}
                onCancel={() => {
                  setShowCategoryForm(false);
                  setEditingCategory(null);
                }}
              />
            );
          }

          return (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">Gerenciar Categorias</h3>
                <Button 
                  onClick={() => setShowCategoryForm(true)}
                  data-testid="button-add-category"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Categoria
                </Button>
              </div>
              <CategoryList 
                restaurantId={(restaurant as any).id}
                onEdit={(category) => setEditingCategory(category)}
              />
            </div>
          );
        }

        // Gerenciar Adicionais
        if (productSubSection === "adicionais") {
          if (showAdditionalForm || editingAdditional) {
            return (
              <AdditionalForm
                restaurantId={(restaurant as any).id}
                additional={editingAdditional}
                onSuccess={() => {
                  setShowAdditionalForm(false);
                  setEditingAdditional(null);
                }}
                onCancel={() => {
                  setShowAdditionalForm(false);
                  setEditingAdditional(null);
                }}
              />
            );
          }

          return (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">Gerenciar Adicionais</h3>
                <Button 
                  onClick={() => setShowAdditionalForm(true)}
                  data-testid="button-add-additional"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Adicional
                </Button>
              </div>
              <AdditionalList 
                restaurantId={(restaurant as any).id}
                onEdit={(additional) => setEditingAdditional(additional)}
              />
            </div>
          );
        }

        return null;
      };

      return (
        <div className="p-6">
          <div className="mb-6">
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-primary">Gerenciar Produtos</h2>
              <p className="text-sm text-muted-foreground">Gerencie seu cardápio de produtos de forma simples e eficiente.</p>
            </div>
            
            {/* Abas de navegação */}
            <div className="flex border-b border-border">
              <button
                onClick={() => setProductSubSection("produtos")}
                className={`px-4 py-2 font-medium transition-colors ${
                  productSubSection === "produtos"
                    ? "border-b-2 border-primary text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                data-testid="tab-produtos"
              >
                Produtos
              </button>
              <button
                onClick={() => setProductSubSection("categorias")}
                className={`px-4 py-2 font-medium transition-colors ${
                  productSubSection === "categorias"
                    ? "border-b-2 border-primary text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                data-testid="tab-categorias"
              >
                Categorias
              </button>
              <button
                onClick={() => setProductSubSection("adicionais")}
                className={`px-4 py-2 font-medium transition-colors ${
                  productSubSection === "adicionais"
                    ? "border-b-2 border-primary text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                data-testid="tab-adicionais"
              >
                Adicionais
              </button>
            </div>
          </div>

          {/* Conteúdo da aba ativa */}
          {renderProductSubContent()}
        </div>
      );
    }

    // Seção de consulta de estoque
    if (activeSection === "estoque") {
      const filteredProducts = (products as any[])
        .filter(product => 
          product.name.toLowerCase().includes(stockSearchTerm.toLowerCase())
        )
        .sort((a, b) => {
          if (stockSortBy === "stock") {
            return (a.stock || 0) - (b.stock || 0); // Menor estoque primeiro
          } else {
            return a.name.localeCompare(b.name);
          }
        });

      const lowStockProducts = filteredProducts.filter(product => (product.stock || 0) < (product.minStock || 10));

      return (
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-6 flex items-center">
            <Package2 className="w-6 h-6 mr-2" />
            Consultar Estoque
          </h2>

          {/* Alertas de estoque baixo */}
          {lowStockProducts.length > 0 && (
            <Card className="mb-6 bg-orange-50 border-orange-200">
              <CardContent className="p-4">
                <div className="flex items-center mb-3">
                  <AlertTriangle className="w-5 h-5 text-orange-600 mr-2" />
                  <h3 className="text-lg font-semibold text-orange-800">
                    Alerta de Estoque Baixo
                  </h3>
                </div>
                <p className="text-orange-700 mb-3">
                  {lowStockProducts.length} produto(s) com estoque abaixo do mínimo:
                </p>
                <div className="space-y-2">
                  {lowStockProducts.map(product => (
                    <div key={product.id} className="flex justify-between items-center bg-white rounded-lg p-2 border border-orange-200">
                      <span className="font-medium">{product.name}</span>
                      <Badge variant="destructive" data-testid={`low-stock-${product.id}`}>
                        {product.stock || 0} unidades
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Controles de filtro e busca */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Pesquisar produtos..."
                value={stockSearchTerm}
                onChange={(e) => setStockSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                data-testid="input-stock-search"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={stockSortBy === "stock" ? "default" : "outline"}
                onClick={() => setStockSortBy("stock")}
                data-testid="button-sort-stock"
              >
                Ordenar por Estoque
              </Button>
              <Button
                variant={stockSortBy === "name" ? "default" : "outline"}
                onClick={() => setStockSortBy("name")}
                data-testid="button-sort-name"
              >
                Ordenar por Nome
              </Button>
            </div>
          </div>

          {/* Lista de produtos com estoque */}
          {productsLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">
                  {stockSearchTerm ? "Nenhum produto encontrado" : "Nenhum produto cadastrado"}
                </h3>
                <p className="text-muted-foreground">
                  {stockSearchTerm 
                    ? "Tente ajustar sua pesquisa ou cadastre novos produtos"
                    : "Adicione produtos ao seu cardápio para visualizar o estoque"
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredProducts.map((product: any) => (
                <Card key={product.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{product.name}</h3>
                        {product.description && (
                          <p className="text-muted-foreground text-sm mt-1">
                            {product.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-sm text-muted-foreground">
                            Preço: R$ {Number(product.price).toFixed(2)}
                          </span>
                          {product.costPrice && (
                            <span className="text-sm text-muted-foreground">
                              Custo: R$ {Number(product.costPrice).toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2 mb-2">
                          <Package className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Estoque:</span>
                        </div>
                        <div className="space-y-2">
                          <Badge 
                            variant={(product.stock || 0) < (product.minStock || 10) ? "destructive" : "secondary"}
                            className="text-base px-3 py-1"
                            data-testid={`stock-${product.id}`}
                          >
                            {product.stock || 0} unidades
                          </Badge>
                          
                          {/* Controles de ajuste de estoque */}
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <label className="text-xs text-muted-foreground">Qtd:</label>
                              <input
                                type="number"
                                min="1"
                                max="999"
                                value={getStockInputQuantity(product.id)}
                                onChange={(e) => setStockInputQuantity(product.id, parseInt(e.target.value) || 1)}
                                className="w-16 px-2 py-1 text-xs border border-input rounded bg-background text-center"
                                data-testid={`input-stock-quantity-${product.id}`}
                              />
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCustomStockAdjustment(product.id, 'remove')}
                                disabled={stockAdjustmentLoading === product.id}
                                data-testid={`button-remove-stock-${product.id}`}
                                className="text-xs px-2 py-1"
                              >
                                <Minus className="w-3 h-3 mr-1" />
                                Remover
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCustomStockAdjustment(product.id, 'add')}
                                disabled={stockAdjustmentLoading === product.id}
                                data-testid={`button-add-stock-${product.id}`}
                                className="text-xs px-2 py-1"
                              >
                                <Plus className="w-3 h-3 mr-1" />
                                Adicionar
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (activeSection === "mesas") {
      if (tablesLoading) {
        return (
          <div className="p-6">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          </div>
        );
      }

      const TableForm = ({ table, onSubmit, onCancel, isLoading }: { 
        table?: any, 
        onSubmit: (data: any) => void, 
        onCancel: () => void,
        isLoading: boolean 
      }) => {
        const [formData, setFormData] = useState({
          number: table?.number || "",
          name: table?.name || "",
          capacity: table?.capacity || 4,
          isActive: table?.isActive ?? true,
        });

        const handleSubmit = (e: React.FormEvent) => {
          e.preventDefault();
          
          if (!formData.number) {
            return;
          }

          onSubmit(formData);
        };

        return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>
                  {table ? "Editar Mesa" : "Adicionar Mesa"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Número da Mesa *
                    </label>
                    <input
                      type="text"
                      value={formData.number}
                      onChange={(e) => setFormData(prev => ({ ...prev, number: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2"
                      placeholder="Ex: 1, A1, VIP1"
                      data-testid="input-table-number"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Nome da Mesa (opcional)
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2"
                      placeholder="Ex: Mesa da Janela, VIP"
                      data-testid="input-table-name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Capacidade (pessoas)
                    </label>
                    <input
                      type="number"
                      value={formData.capacity}
                      onChange={(e) => setFormData(prev => ({ ...prev, capacity: parseInt(e.target.value) || 1 }))}
                      className="w-full border rounded-lg px-3 py-2"
                      min="1"
                      max="20"
                      data-testid="input-table-capacity"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={formData.isActive}
                      onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                      data-testid="checkbox-table-active"
                    />
                    <label htmlFor="isActive" className="text-sm">
                      Mesa ativa
                    </label>
                  </div>
                  
                  <div className="flex space-x-2 pt-4">
                    <Button 
                      type="submit" 
                      disabled={isLoading}
                      className="flex-1"
                      data-testid="button-save-table"
                    >
                      {isLoading ? "Salvando..." : (table ? "Atualizar" : "Criar Mesa")}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={onCancel}
                      disabled={isLoading}
                      data-testid="button-cancel-table"
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        );
      };

      return (
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Gerenciar Mesas</h2>
            <Button 
              onClick={() => setShowTableForm(true)}
              data-testid="button-add-table"
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Mesa
            </Button>
          </div>

          {/* Lista de mesas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(tables as any[]).map((table: any) => (
              <Card key={table.id} className="p-4">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between">
                    <span>Mesa {table.number}</span>
                    <Badge variant={table.isActive ? "default" : "secondary"}>
                      {table.isActive ? "Ativa" : "Inativa"}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{table.capacity} pessoas</span>
                  </div>
                  {table.name && (
                    <div className="text-sm text-muted-foreground">
                      Nome: {table.name}
                    </div>
                  )}
                  <div className="flex items-center space-x-2 pt-2">
                    <QrCode className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs font-mono bg-muted px-2 py-1 rounded">
                      {table.qrCode}
                    </span>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(window.location.origin + '/restaurant/' + (restaurant as any).id + '?table=' + table.qrCode)}`;
                        const link = document.createElement('a');
                        link.href = qrUrl;
                        link.download = `qr-mesa-${table.number}.png`;
                        link.click();
                      }}
                      className="w-full"
                      data-testid={`button-download-qr-${table.id}`}
                    >
                      <QrCode className="w-3 h-3 mr-1" />
                      Baixar QR Code
                    </Button>
                  </div>
                  
                  <div className="flex space-x-2 pt-3">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setEditingTable(table)}
                      data-testid={`button-edit-table-${table.id}`}
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Editar
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => handleDeleteTable(table.id)}
                      data-testid={`button-delete-table-${table.id}`}
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Excluir
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {(tables as any[]).length === 0 && (
              <Card className="col-span-full p-8 text-center">
                <CardContent>
                  <p className="text-muted-foreground">
                    Nenhuma mesa cadastrada ainda. Clique em "Adicionar Mesa" para começar.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Formulário de criar/editar mesa */}
          {(showTableForm || editingTable) && (
            <TableForm
              table={editingTable}
              onSubmit={editingTable ? handleUpdateTable : handleCreateTable}
              onCancel={() => {
                setShowTableForm(false);
                setEditingTable(null);
              }}
              isLoading={createTableMutation.isPending || updateTableMutation.isPending}
            />
          )}
        </div>
      );
    }

    if (activeSection === "horarios") {
      const dayNames = {
        segunda: 'Segunda-feira',
        terca: 'Terça-feira',
        quarta: 'Quarta-feira',
        quinta: 'Quinta-feira',
        sexta: 'Sexta-feira',
        sabado: 'Sábado',
        domingo: 'Domingo'
      };

      const handleDayChange = (day: string, field: string, value: any) => {
        setOpeningHours(prev => ({
          ...prev,
          [day]: {
            ...prev[day as keyof typeof prev],
            [field]: value
          }
        }));
      };

      const saveOpeningHours = () => {
        // TODO: Implementar salvamento no backend
        setIsEditingHours(false);
        toast({
          title: "Horários salvos!",
          description: "Os horários de funcionamento foram atualizados com sucesso.",
        });
      };

      return (
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Horários de Funcionamento</h2>
            <Button 
              onClick={() => setIsEditingHours(!isEditingHours)}
              variant={isEditingHours ? "outline" : "default"}
              data-testid="button-edit-hours"
            >
              {isEditingHours ? "Cancelar" : "Editar Horários"}
            </Button>
          </div>
          
          <div className="space-y-4">
            {Object.entries(openingHours).map(([day, hours]) => (
              <Card key={day} className="transition-all hover:shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-32">
                        <h3 className="font-medium">{dayNames[day as keyof typeof dayNames]}</h3>
                      </div>
                      
                      {isEditingHours ? (
                        <div className="flex items-center space-x-4">
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={hours.isOpen}
                              onChange={(e) => handleDayChange(day, 'isOpen', e.target.checked)}
                              className="rounded"
                              data-testid={`checkbox-${day}-open`}
                            />
                            <span className="text-sm">Aberto</span>
                          </label>
                          
                          {hours.isOpen && (
                            <div className="flex items-center space-x-2">
                              <input
                                type="time"
                                value={hours.openTime}
                                onChange={(e) => handleDayChange(day, 'openTime', e.target.value)}
                                className="border rounded px-2 py-1 text-sm"
                                data-testid={`input-${day}-open-time`}
                              />
                              <span className="text-sm text-muted-foreground">às</span>
                              <input
                                type="time"
                                value={hours.closeTime}
                                onChange={(e) => handleDayChange(day, 'closeTime', e.target.value)}
                                className="border rounded px-2 py-1 text-sm"
                                data-testid={`input-${day}-close-time`}
                              />
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center space-x-4">
                          {hours.isOpen ? (
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span className="text-sm font-medium text-green-700">
                                {hours.openTime} às {hours.closeTime}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                              <span className="text-sm font-medium text-red-700">Fechado</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {isEditingHours && (
            <div className="mt-6 flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setIsEditingHours(false)}
                data-testid="button-cancel-hours"
              >
                Cancelar
              </Button>
              <Button 
                onClick={saveOpeningHours}
                data-testid="button-save-hours"
              >
                Salvar Horários
              </Button>
            </div>
          )}
          
          <Card className="mt-6">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>Os horários configurados aqui serão exibidos para os clientes no cardápio online</span>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    if (activeSection === "sobre-nos") {
      const handleSave = () => {
        updateAboutMutation.mutate(description);
        setIsEditingAbout(false);
      };

      return (
        <div className="p-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 flex items-center">
              <FileText className="w-6 h-6 mr-2" />
              Sobre Nós
            </h2>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Descrição do Restaurante</h3>
                  <Button
                    onClick={() => isEditingAbout ? handleSave() : setIsEditingAbout(true)}
                    disabled={updateAboutMutation.isPending}
                    data-testid="button-edit-about"
                  >
                    {isEditingAbout ? (
                      updateAboutMutation.isPending ? "Salvando..." : "Salvar"
                    ) : (
                      <>
                        <Edit className="w-4 h-4 mr-2" />
                        Editar
                      </>
                    )}
                  </Button>
                </div>
                
                {isEditingAbout ? (
                  <div className="space-y-4">
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Conte sobre seu restaurante, especialidades, história..."
                      className="w-full h-32 p-3 border rounded-lg resize-none"
                      data-testid="textarea-about"
                    />
                    <div className="flex gap-2">
                      <Button onClick={handleSave} disabled={updateAboutMutation.isPending}>
                        Salvar
                      </Button>
                      <Button variant="outline" onClick={() => setIsEditingAbout(false)}>
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    {description ? (
                      <p className="text-muted-foreground whitespace-pre-wrap">{description}</p>
                    ) : (
                      <p className="text-muted-foreground italic">
                        Nenhuma descrição cadastrada. Clique em "Editar" para adicionar uma descrição sobre seu restaurante.
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      );
    }

    if (activeSection === "logo") {

      const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
          if (file.size > 5 * 1024 * 1024) { // 5MB limit
            toast({
              title: "Arquivo muito grande",
              description: "O arquivo deve ter no máximo 5MB.",
              variant: "destructive",
            });
            return;
          }
          
          if (!file.type.startsWith('image/')) {
            toast({
              title: "Formato inválido",
              description: "Por favor, selecione uma imagem válida.",
              variant: "destructive",
            });
            return;
          }
          
          uploadLogoMutation.mutate(file);
        }
      };

      return (
        <div className="p-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 flex items-center">
              <Edit className="w-6 h-6 mr-2" />
              Logo do Restaurante
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Enviar Logo</h3>
                  <p className="text-muted-foreground mb-4">
                    Escolha uma imagem do seu dispositivo para usar como logo (máximo 5MB).
                  </p>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Selecionar Arquivo de Imagem
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        disabled={uploadLogoMutation.isPending}
                        className="w-full p-3 border rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                        data-testid="input-logo-file"
                      />
                    </div>
                    
                    {uploadLogoMutation.isPending && (
                      <div className="text-sm text-muted-foreground">
                        Fazendo upload do logo...
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Pré-visualização</h3>
                  
                  <div className="border rounded-lg p-4 bg-gray-50 min-h-[200px] flex items-center justify-center">
                    {(restaurant as any)?.logoUrl ? (
                      <img 
                        src={`${(restaurant as any).logoUrl}?t=${Date.now()}`}
                        alt="Logo do restaurante" 
                        className="max-w-full max-h-48 object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="text-center text-muted-foreground">
                        <Edit className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>Nenhum logo configurado ainda</p>
                        <p className="text-sm">Faça upload de uma imagem</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      );
    }

    if (activeSection === "banner") {

      const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
          if (file.size > 5 * 1024 * 1024) { // 5MB limit
            toast({
              title: "Arquivo muito grande",
              description: "O arquivo deve ter no máximo 5MB.",
              variant: "destructive",
            });
            return;
          }
          
          if (!file.type.startsWith('image/')) {
            toast({
              title: "Formato inválido",
              description: "Por favor, selecione uma imagem válida.",
              variant: "destructive",
            });
            return;
          }
          
          uploadBannerMutation.mutate(file);
        }
      };

      return (
        <div className="p-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 flex items-center">
              <Package className="w-6 h-6 mr-2" />
              Banner do Restaurante
            </h2>
            
            <div className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Enviar Banner</h3>
                  <p className="text-muted-foreground mb-4">
                    Escolha uma imagem do seu dispositivo para usar como banner (máximo 5MB).
                    O banner será usado como imagem de fundo na parte superior do seu cardápio.
                  </p>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Selecionar Arquivo de Imagem
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        disabled={uploadBannerMutation.isPending}
                        className="w-full p-3 border rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                        data-testid="input-banner-file"
                      />
                    </div>
                    
                    {uploadBannerMutation.isPending && (
                      <div className="text-sm text-muted-foreground">
                        Fazendo upload do banner...
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Pré-visualização</h3>
                  
                  <div className="border rounded-lg overflow-hidden bg-gray-50">
                    {(restaurant as any)?.bannerUrl ? (
                      <div className="relative h-48 w-full">
                        <img 
                          src={`${(restaurant as any).bannerUrl}?t=${Date.now()}`}
                          alt="Banner do restaurante" 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                          <div className="text-white text-center">
                            <h3 className="text-2xl font-bold">{(restaurant as any)?.name}</h3>
                            <p className="text-lg">{(restaurant as any)?.description}</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="h-48 flex items-center justify-center text-center text-muted-foreground">
                        <div>
                          <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p>Nenhum banner configurado ainda</p>
                          <p className="text-sm">Faça upload de uma imagem</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      );
    }

    if (activeSection === "configuracoes") {

      const renderConfigurationContent = () => {
        if (configurationSubSection === "dados-empresa") {
          const handleSave = () => {
            updateCompanyDataMutation.mutate(companyFormData);
            setIsEditingCompanyData(false);
          };

          return (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">Dados da Empresa</h3>
                <Button
                  onClick={() => setIsEditingCompanyData(!isEditingCompanyData)}
                  variant="outline"
                  data-testid="button-edit-company-data"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  {isEditingCompanyData ? "Cancelar" : "Editar"}
                </Button>
              </div>

              <Card>
                <CardContent className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Nome do Restaurante</label>
                      {isEditingCompanyData ? (
                        <input
                          type="text"
                          value={companyFormData.name}
                          onChange={(e) => setCompanyFormData(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full p-3 border rounded-lg"
                          data-testid="input-company-name"
                        />
                      ) : (
                        <div className="p-3 bg-muted rounded-lg" data-testid="text-company-name">
                          {companyFormData.name || "Não informado"}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Categoria</label>
                      {isEditingCompanyData ? (
                        <select
                          value={companyFormData.category}
                          onChange={(e) => setCompanyFormData(prev => ({ ...prev, category: e.target.value }))}
                          className="w-full p-3 border rounded-lg"
                          data-testid="select-company-category"
                        >
                          <option value="">Selecione uma categoria</option>
                          <option value="italiana">Italiana</option>
                          <option value="brasileira">Brasileira</option>
                          <option value="japonesa">Japonesa</option>
                          <option value="mexicana">Mexicana</option>
                          <option value="pizza">Pizza</option>
                          <option value="hamburguer">Hambúrguer</option>
                          <option value="vegetariana">Vegetariana</option>
                          <option value="doces">Doces</option>
                        </select>
                      ) : (
                        <div className="p-3 bg-muted rounded-lg" data-testid="text-company-category">
                          {companyFormData.category || "Não informado"}
                        </div>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-2">Descrição</label>
                      {isEditingCompanyData ? (
                        <textarea
                          value={companyFormData.description}
                          onChange={(e) => setCompanyFormData(prev => ({ ...prev, description: e.target.value }))}
                          rows={3}
                          className="w-full p-3 border rounded-lg"
                          data-testid="textarea-company-description"
                        />
                      ) : (
                        <div className="p-3 bg-muted rounded-lg" data-testid="text-company-description">
                          {companyFormData.description || "Não informado"}
                        </div>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-2">Endereço</label>
                      {isEditingCompanyData ? (
                        <input
                          type="text"
                          value={companyFormData.address}
                          onChange={(e) => setCompanyFormData(prev => ({ ...prev, address: e.target.value }))}
                          className="w-full p-3 border rounded-lg"
                          data-testid="input-company-address"
                        />
                      ) : (
                        <div className="p-3 bg-muted rounded-lg" data-testid="text-company-address">
                          {companyFormData.address || "Não informado"}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Telefone</label>
                      {isEditingCompanyData ? (
                        <input
                          type="tel"
                          value={companyFormData.phone}
                          onChange={(e) => setCompanyFormData(prev => ({ ...prev, phone: e.target.value }))}
                          className="w-full p-3 border rounded-lg"
                          data-testid="input-company-phone"
                        />
                      ) : (
                        <div className="p-3 bg-muted rounded-lg" data-testid="text-company-phone">
                          {companyFormData.phone || "Não informado"}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Email</label>
                      {isEditingCompanyData ? (
                        <input
                          type="email"
                          value={companyFormData.email}
                          onChange={(e) => setCompanyFormData(prev => ({ ...prev, email: e.target.value }))}
                          className="w-full p-3 border rounded-lg"
                          data-testid="input-company-email"
                        />
                      ) : (
                        <div className="p-3 bg-muted rounded-lg" data-testid="text-company-email">
                          {companyFormData.email || "Não informado"}
                        </div>
                      )}
                    </div>
                  </div>

                  {isEditingCompanyData && (
                    <div className="flex gap-2 pt-4">
                      <Button 
                        onClick={handleSave}
                        disabled={updateCompanyDataMutation.isPending}
                        data-testid="button-save-company-data"
                      >
                        {updateCompanyDataMutation.isPending ? "Salvando..." : "Salvar Alterações"}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setIsEditingCompanyData(false)}
                        data-testid="button-cancel-company-data"
                      >
                        Cancelar
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          );
        }

        if (configurationSubSection === "whatsapp") {
          const handleSaveWhatsApp = () => {
            if (whatsappNumber.trim()) {
              updateWhatsAppMutation.mutate(whatsappNumber.trim());
            }
          };

          return (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold">Configurar WhatsApp</h3>
              
              <Card>
                <CardContent className="p-6">
                  <h4 className="text-lg font-semibold mb-4">Número para Notificações</h4>
                  <p className="text-muted-foreground mb-4">
                    Configure o número do WhatsApp que será usado para enviar notificações aos clientes sobre seus pedidos.
                  </p>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Número do WhatsApp
                      </label>
                      <input
                        type="tel"
                        value={whatsappNumber}
                        onChange={(e) => setWhatsappNumber(e.target.value)}
                        placeholder="(11) 99999-9999"
                        className="w-full p-3 border rounded-lg"
                        data-testid="input-whatsapp-number"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Use o formato: (11) 99999-9999 ou +55 11 99999-9999
                      </p>
                    </div>
                    
                    <Button 
                      onClick={handleSaveWhatsApp}
                      disabled={!whatsappNumber.trim() || updateWhatsAppMutation.isPending}
                      className="w-full"
                      data-testid="button-save-whatsapp"
                    >
                      {updateWhatsAppMutation.isPending ? "Salvando..." : "Salvar Número"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {whatsappNumber && (
                <Card>
                  <CardContent className="p-6">
                    <h4 className="text-lg font-semibold mb-4">Preview da Notificação</h4>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">📱</span>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">Notificação para: {whatsappNumber}</p>
                          <p className="text-sm text-green-700 mt-1">
                            "Olá! Seu pedido #{"{"}orderId{"}"} foi confirmado e está sendo preparado. 
                            Tempo estimado: 30-45 minutos. - {(restaurant as any)?.name}"
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          );
        }

        if (configurationSubSection === "seo") {
          const seoCategories = [
            "Lanches", "Hotdog", "Pastel", "Sorvetes", "Doces", 
            "Almoço", "Açai", "Bebidas"
          ];
          
          const toggleCategory = (category: string) => {
            setSelectedSeoCategories(prev => 
              prev.includes(category) 
                ? prev.filter(c => c !== category)
                : [...prev, category]
            );
          };

          return (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold">Configurar SEO</h3>
              
              <Card>
                <CardContent className="p-6">
                  <h4 className="text-lg font-semibold mb-4">Categorias do Restaurante</h4>
                  <p className="text-muted-foreground mb-4">
                    Selecione as categorias que seu restaurante atende para melhorar a visibilidade nos resultados de busca.
                  </p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {seoCategories.map((category) => (
                      <button
                        key={category}
                        onClick={() => toggleCategory(category)}
                        className={`p-3 rounded-lg border text-center transition-colors ${
                          selectedSeoCategories.includes(category)
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background border-border hover:bg-muted"
                        }`}
                        data-testid={`category-${category.toLowerCase()}`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                  
                  {selectedSeoCategories.length > 0 && (
                    <div className="mt-6">
                      <h5 className="font-medium mb-2">Categorias Selecionadas:</h5>
                      <div className="flex flex-wrap gap-2">
                        {selectedSeoCategories.map((category) => (
                          <Badge key={category} variant="secondary">
                            {category}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <Button 
                    className="w-full mt-6"
                    disabled={selectedSeoCategories.length === 0}
                    data-testid="button-save-seo"
                  >
                    Salvar Configurações de SEO
                  </Button>
                </CardContent>
              </Card>
            </div>
          );
        }

        if (configurationSubSection === "usuarios") {
          return (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">Gerenciar Usuários</h3>
                <Button
                  onClick={() => setIsCreatingUser(!isCreatingUser)}
                  data-testid="button-new-user"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Usuário
                </Button>
              </div>
              
              {isCreatingUser && (
                <Card>
                  <CardContent className="p-6">
                    <h4 className="text-lg font-semibold mb-4">Criar Novo Funcionário</h4>
                    
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Nome Completo</label>
                          <input
                            type="text"
                            value={newUserData.name}
                            onChange={(e) => setNewUserData(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full p-3 border rounded-lg"
                            placeholder="Nome do funcionário"
                            data-testid="input-user-name"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-2">Email</label>
                          <input
                            type="email"
                            value={newUserData.email}
                            onChange={(e) => setNewUserData(prev => ({ ...prev, email: e.target.value }))}
                            className="w-full p-3 border rounded-lg"
                            placeholder="email@exemplo.com"
                            data-testid="input-user-email"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-2">Senha</label>
                          <input
                            type="password"
                            value={newUserData.password}
                            onChange={(e) => setNewUserData(prev => ({ ...prev, password: e.target.value }))}
                            className="w-full p-3 border rounded-lg"
                            placeholder="Senha do funcionário"
                            data-testid="input-user-password"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-2">Confirmar Senha</label>
                          <input
                            type="password"
                            value={newUserData.confirmPassword}
                            onChange={(e) => setNewUserData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                            className="w-full p-3 border rounded-lg"
                            placeholder="Confirme a senha"
                            data-testid="input-user-confirm-password"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">Permissões de Acesso</label>
                        <p className="text-muted-foreground mb-3 text-sm">
                          Selecione quais seções o funcionário poderá acessar no sistema
                        </p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {["dashboard", "produtos", "vendas", "mesas", "horarios", "configuracoes"].map((permission) => (
                            <label key={permission} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted transition-colors">
                              <input
                                type="checkbox"
                                checked={newUserData.permissions.includes(permission)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setNewUserData(prev => ({
                                      ...prev,
                                      permissions: [...prev.permissions, permission]
                                    }));
                                  } else {
                                    setNewUserData(prev => ({
                                      ...prev,
                                      permissions: prev.permissions.filter(p => p !== permission)
                                    }));
                                  }
                                }}
                                className="rounded"
                                data-testid={`checkbox-permission-${permission}`}
                              />
                              <span className="capitalize">{permission}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex gap-2 pt-4">
                        <Button
                          onClick={async () => {
                            if (newUserData.password !== newUserData.confirmPassword) {
                              toast({
                                title: "Erro",
                                description: "As senhas não coincidem",
                                variant: "destructive"
                              });
                              return;
                            }
                            
                            try {
                              const response = await fetch("/api/employees", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  ...newUserData,
                                  restaurantId: (restaurant as any)?.id
                                })
                              });
                              
                              if (response.ok) {
                                toast({
                                  title: "Sucesso",
                                  description: "Funcionário criado com sucesso!",
                                });
                                setIsCreatingUser(false);
                                setNewUserData({
                                  name: "",
                                  email: "",
                                  password: "",
                                  confirmPassword: "",
                                  permissions: []
                                });
                                // Refetch dos funcionários aqui se necessário
                              } else {
                                throw new Error("Falha ao criar funcionário");
                              }
                            } catch (error) {
                              toast({
                                title: "Erro",
                                description: "Não foi possível criar o funcionário",
                                variant: "destructive"
                              });
                            }
                          }}
                          disabled={!newUserData.name || !newUserData.email || !newUserData.password || newUserData.permissions.length === 0}
                          data-testid="button-save-user"
                        >
                          Criar Funcionário
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setIsCreatingUser(false)}
                          data-testid="button-cancel-user"
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              <Card>
                <CardContent className="p-6">
                  <h4 className="text-lg font-semibold mb-4">Funcionários Cadastrados</h4>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h5 className="font-medium">Administrador</h5>
                        <p className="text-sm text-muted-foreground">{(user as any)?.email}</p>
                        <div className="flex gap-1 mt-1">
                          <Badge variant="secondary" className="text-xs">Acesso Total</Badge>
                        </div>
                      </div>
                      <Badge variant="outline">Owner</Badge>
                    </div>
                    
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Nenhum funcionário cadastrado ainda</p>
                      <p className="text-sm">Clique em "Novo Usuário" para criar o primeiro funcionário</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          );
        }

        if (configurationSubSection === "cep") {

          return (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold">Área de Atendimento</h3>
              
              <Card>
                <CardContent className="p-6">
                  <h4 className="text-lg font-semibold mb-4">Configurar Bairros de Entrega</h4>
                  <p className="text-muted-foreground mb-4">
                    Selecione os bairros que seu restaurante atende e defina a taxa de entrega para cada um.
                  </p>
                  <div className="flex items-center gap-2 mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <span className="text-blue-600">ℹ️</span>
                    <span className="text-sm text-blue-700">
                      Bairros obtidos via ViaCEP e base de dados locais detalhados para máxima precisão
                    </span>
                  </div>

                  {!city || !state ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">
                        Não foi possível extrair a cidade do endereço do restaurante.
                      </p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Endereço atual: {(restaurant as any)?.address}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>📍</span>
                        <span>Bairros de {city} - {state}</span>
                      </div>

                      {loadingNeighborhoods ? (
                        <div className="text-center py-8">
                          <p>Carregando bairros...</p>
                        </div>
                      ) : neighborhoods.length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-muted-foreground">
                            Nenhum bairro encontrado para {city}.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {/* Barra de pesquisa de bairros */}
                          <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                            <input
                              type="text"
                              placeholder="Pesquisar bairros..."
                              value={neighborhoodSearchTerm}
                              onChange={(e) => setNeighborhoodSearchTerm(e.target.value)}
                              className="w-full pl-10 pr-4 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                              data-testid="input-neighborhood-search"
                            />
                          </div>

                          {(() => {
                            const filteredNeighborhoods = neighborhoods.filter(neighborhood => 
                              neighborhood.toLowerCase().includes(neighborhoodSearchTerm.toLowerCase())
                            );

                            if (filteredNeighborhoods.length === 0 && neighborhoodSearchTerm) {
                              return (
                                <div className="text-center py-6">
                                  <p className="text-muted-foreground">
                                    Nenhum bairro encontrado para "{neighborhoodSearchTerm}"
                                  </p>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    Tente outro termo de busca
                                  </p>
                                </div>
                              );
                            }

                            return filteredNeighborhoods.map(neighborhood => (
                              <div key={neighborhood} className="flex items-center gap-4 p-3 border rounded-lg">
                              <input
                                type="checkbox"
                                checked={selectedNeighborhoods[neighborhood]?.selected || false}
                                onChange={(e) => handleNeighborhoodChange(neighborhood, 'selected', e.target.checked)}
                                className="rounded"
                                data-testid={`checkbox-${neighborhood}`}
                              />
                              <div className="flex-1">
                                <span className="font-medium">{neighborhood}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">Taxa:</span>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={selectedNeighborhoods[neighborhood]?.fee || '0.00'}
                                  onChange={(e) => handleNeighborhoodChange(neighborhood, 'fee', e.target.value)}
                                  placeholder="0.00"
                                  className="w-20 p-1 text-sm border rounded"
                                  disabled={!selectedNeighborhoods[neighborhood]?.selected}
                                  data-testid={`input-fee-${neighborhood}`}
                                />
                                <span className="text-sm text-muted-foreground">R$</span>
                              </div>
                            </div>
                            ));
                          })()}
                        </div>
                      )}

                      <Button
                        onClick={saveServiceAreas}
                        disabled={loadingNeighborhoods || Object.values(selectedNeighborhoods).every(config => !config.selected)}
                        className="w-full"
                        data-testid="button-save-areas"
                      >
                        Salvar Configurações de Área
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          );
        }

        // Não mostrar nada se a seção não for reconhecida
        return null;
      };

      return (
        <div className="p-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 flex items-center">
              <Settings className="w-6 h-6 mr-2" />
              Configurações
            </h2>
            
            {/* Abas de navegação */}
            <div className="flex border-b border-border mb-6">
              <button
                onClick={() => setConfigurationSubSection("dados-empresa")}
                className={`px-4 py-2 font-medium transition-colors ${
                  configurationSubSection === "dados-empresa"
                    ? "border-b-2 border-primary text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                data-testid="tab-dados-empresa"
              >
                Dados da Empresa
              </button>
              <button
                onClick={() => setConfigurationSubSection("whatsapp")}
                className={`px-4 py-2 font-medium transition-colors ${
                  configurationSubSection === "whatsapp"
                    ? "border-b-2 border-primary text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                data-testid="tab-whatsapp"
              >
                Configurar WhatsApp
              </button>
              <button
                onClick={() => setConfigurationSubSection("seo")}
                className={`px-4 py-2 font-medium transition-colors ${
                  configurationSubSection === "seo"
                    ? "border-b-2 border-primary text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                data-testid="tab-seo"
              >
                Configurar SEO
              </button>
              <button
                onClick={() => setConfigurationSubSection("usuarios")}
                className={`px-4 py-2 font-medium transition-colors ${
                  configurationSubSection === "usuarios"
                    ? "border-b-2 border-primary text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                data-testid="tab-usuarios"
              >
                Usuários
              </button>
              <button
                onClick={() => setConfigurationSubSection("cep")}
                className={`px-4 py-2 font-medium transition-colors ${
                  configurationSubSection === "cep"
                    ? "border-b-2 border-primary text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                data-testid="tab-cep"
              >
                Área de Atendimento
              </button>
            </div>

            {renderConfigurationContent()}
          </div>
        </div>
      );
    }

    if (activeSection === "cupons") {

      return (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Criar Cupom Promocional</h2>
          
          {/* Formulário para criar cupom */}
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Código do Cupom</Label>
                  <Input
                    value={couponForm.code}
                    onChange={(e) => setCouponForm(prev => ({...prev, code: e.target.value.toUpperCase()}))}
                    placeholder="DESCONTO10"
                    data-testid="input-coupon-code"
                  />
                </div>
                <div>
                  <Label>Descrição</Label>
                  <Input
                    value={couponForm.description}
                    onChange={(e) => setCouponForm(prev => ({...prev, description: e.target.value}))}
                    placeholder="Desconto de 10% no pedido"
                    data-testid="input-coupon-description"
                  />
                </div>
                <div>
                  <Label>Tipo de Desconto</Label>
                  <Select value={couponForm.discountType} onValueChange={(value) => setCouponForm(prev => ({...prev, discountType: value}))}>
                    <SelectTrigger data-testid="select-discount-type">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Porcentagem (%)</SelectItem>
                      <SelectItem value="fixed">Valor Fixo (R$)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Valor do Desconto</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={couponForm.discountValue}
                    onChange={(e) => setCouponForm(prev => ({...prev, discountValue: e.target.value}))}
                    placeholder={couponForm.discountType === "percentage" ? "10" : "5.00"}
                    data-testid="input-discount-value"
                  />
                </div>
                <div>
                  <Label>Valor Mínimo do Pedido (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={couponForm.minOrderValue}
                    onChange={(e) => setCouponForm(prev => ({...prev, minOrderValue: e.target.value}))}
                    placeholder="50.00"
                    data-testid="input-min-order-value"
                  />
                </div>
                <div>
                  <Label>Quantidade Máxima de Usos</Label>
                  <Input
                    type="number"
                    value={couponForm.maxUses}
                    onChange={(e) => setCouponForm(prev => ({...prev, maxUses: e.target.value}))}
                    placeholder="100"
                    data-testid="input-max-uses"
                  />
                </div>
                <div>
                  <Label>Data de Início</Label>
                  <Input
                    type="datetime-local"
                    value={couponForm.validFrom}
                    onChange={(e) => setCouponForm(prev => ({...prev, validFrom: e.target.value}))}
                    data-testid="input-valid-from"
                  />
                </div>
                <div>
                  <Label>Data de Expiração</Label>
                  <Input
                    type="datetime-local"
                    value={couponForm.validUntil}
                    onChange={(e) => setCouponForm(prev => ({...prev, validUntil: e.target.value}))}
                    data-testid="input-valid-until"
                  />
                </div>
              </div>
              
              <Button 
                onClick={() => createCouponMutation.mutate(couponForm)}
                disabled={!couponForm.code || !couponForm.discountValue || !couponForm.validFrom || !couponForm.validUntil || createCouponMutation.isPending}
                className="w-full mt-6"
                data-testid="button-create-coupon"
              >
                {createCouponMutation.isPending ? "Criando..." : "Criar Cupom"}
              </Button>
            </CardContent>
          </Card>

          {/* Lista de cupons existentes */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Cupons Criados</h3>
              
              {coupons.length === 0 ? (
                <div className="text-center py-8">
                  <CreditCard className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Nenhum cupom criado ainda</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {coupons.map((coupon: any) => (
                    <div key={coupon.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-lg">{coupon.code}</h4>
                          <p className="text-muted-foreground">{coupon.description}</p>
                          <div className="flex gap-4 mt-2 text-sm">
                            <span>
                              Desconto: {coupon.discountType === "percentage" ? `${coupon.discountValue}%` : `R$ ${coupon.discountValue}`}
                            </span>
                            <span>Usado: {coupon.usedCount}/{coupon.maxUses || "∞"}</span>
                          </div>
                          <div className="flex gap-4 mt-1 text-sm text-muted-foreground">
                            <span>Válido: {new Date(coupon.validFrom).toLocaleDateString()} - {new Date(coupon.validUntil).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <Badge variant={coupon.isActive ? "default" : "secondary"}>
                          {coupon.isActive ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    if (activeSection === "comandas") {
      // Separar pedidos por tipo (excluindo pedidos entregues)
      const deliveryOrders = (orders as any[]).filter((order: any) => 
        (order.orderType === 'delivery' || !order.orderType) && order.status !== 'delivered'
      );
      const tableOrders = (orders as any[]).filter((order: any) => 
        order.orderType === 'table' && order.status !== 'delivered'
      );
      
      // Contadores por tipo
      const deliveryOrderCounts = {
        abertos: deliveryOrders.filter((order: any) => order.status === 'pending').length,
        preparando: deliveryOrders.filter((order: any) => order.status === 'preparing').length,
        entrega: deliveryOrders.filter((order: any) => order.status === 'out_for_delivery').length,
        finalizados: deliveryOrders.filter((order: any) => order.status === 'delivered').length,
        cancelados: deliveryOrders.filter((order: any) => order.status === 'cancelled').length,
      };

      // Agrupar pedidos de mesa por mesa
      const ordersByTable = tableOrders.reduce((acc: any, order: any) => {
        const tableId = order.tableId || 'unknown';
        if (!acc[tableId]) acc[tableId] = [];
        acc[tableId].push(order);
        return acc;
      }, {});

      return (
        <div className="space-y-6">
          <Tabs defaultValue="deliverys" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="deliverys" className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                Deliverys ({deliveryOrders.length})
              </TabsTrigger>
              <TabsTrigger value="mesas" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Mesas ({tableOrders.length} pedidos)
              </TabsTrigger>
            </TabsList>

            <TabsContent value="deliverys" className="space-y-6">
              {/* Header com estatísticas de delivery */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-3 sm:p-4 text-center">
                    <p className="text-2xl font-bold text-blue-600">{deliveryOrderCounts.abertos}</p>
                    <p className="text-sm text-blue-600">Pendentes</p>
                  </CardContent>
                </Card>

                <Card className="bg-yellow-50 border-yellow-200">
                  <CardContent className="p-3 sm:p-4 text-center">
                    <p className="text-2xl font-bold text-yellow-600">{deliveryOrderCounts.preparando}</p>
                    <p className="text-sm text-yellow-600">Preparando</p>
                  </CardContent>
                </Card>

                <Card className="bg-purple-50 border-purple-200">
                  <CardContent className="p-3 sm:p-4 text-center">
                    <p className="text-2xl font-bold text-purple-600">{deliveryOrderCounts.entrega}</p>
                    <p className="text-sm text-purple-600">Entrega</p>
                  </CardContent>
                </Card>

                <Card className="bg-green-50 border-green-200">
                  <CardContent className="p-3 sm:p-4 text-center">
                    <p className="text-2xl font-bold text-green-600">{deliveryOrderCounts.finalizados}</p>
                    <p className="text-sm text-green-600">Entregues</p>
                  </CardContent>
                </Card>

                <Card className="bg-red-50 border-red-200">
                  <CardContent className="p-3 sm:p-4 text-center">
                    <p className="text-2xl font-bold text-red-600">{deliveryOrderCounts.cancelados}</p>
                    <p className="text-sm text-red-600">Cancelados</p>
                  </CardContent>
                </Card>
              </div>

              {/* Lista de pedidos delivery */}
              {ordersLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                </div>
              ) : deliveryOrders.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Nenhum pedido de delivery</h3>
                    <p className="text-muted-foreground">
                      Os pedidos de entrega aparecerão aqui quando os clientes fizerem seus pedidos
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {deliveryOrders.map((order: any) => (
                    <OrderCard 
                      key={order.id} 
                      order={order} 
                      onStatusUpdate={(status: string) => {
                        fetch(`/api/orders/${order.id}/status`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ status }),
                          credentials: 'include'
                        }).then(async response => {
                          if (!response.ok) {
                            const errorText = await response.text();
                            throw new Error(`HTTP ${response.status}: ${errorText}`);
                          }
                          return response.json();
                        }).then((updatedOrder) => {
                          queryClient.invalidateQueries({ queryKey: ["/api/my-orders"] });
                          toast({
                            title: "Status atualizado",
                            description: "O status do pedido foi atualizado com sucesso"
                          });
                          console.log('Pedido atualizado:', updatedOrder);
                        }).catch(error => {
                          console.error('Erro ao atualizar status:', error);
                          toast({
                            title: "Erro",
                            description: `Falha ao atualizar status: ${error.message}`,
                            variant: "destructive"
                          });
                        });
                      }}
                      onPrint={() => {}}
                      onEdit={(order: any) => {
                        setEditingOrder(order);
                        setShowOrderEditForm(true);
                      }}
                      isUpdatingStatus={false}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="mesas" className="space-y-6">
              {/* Grid de mesas */}
              {tablesLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                </div>
              ) : tables.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Nenhuma mesa cadastrada</h3>
                    <p className="text-muted-foreground">
                      Cadastre mesas na seção "Mesas" para visualizar pedidos por mesa
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                  {tables.map((table: any) => {
                    const tableOrdersList = ordersByTable[table.id] || [];
                    const hasPendingOrders = tableOrdersList.some((order: any) => 
                      order.status === 'pending' || order.status === 'preparing'
                    );
                    
                    return (
                      <Card 
                        key={table.id} 
                        className={`cursor-pointer transition-all hover:shadow-lg ${
                          hasPendingOrders ? 'ring-2 ring-orange-500 bg-orange-50' : 'hover:border-primary'
                        }`}
                        onClick={() => {
                          setSelectedTable(table);
                          setShowTableOrdersModal(true);
                        }}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold text-lg">Mesa {table.number}</h3>
                            {hasPendingOrders && (
                              <Badge variant="destructive" className="animate-pulse">
                                {tableOrdersList.filter((o: any) => o.status === 'pending' || o.status === 'preparing').length}
                              </Badge>
                            )}
                          </div>
                          
                          <div className="text-sm text-muted-foreground mb-3">
                            {table.name && <p>Nome: {table.name}</p>}
                            <p>Capacidade: {table.capacity} pessoas</p>
                          </div>

                          {tableOrdersList.length > 0 ? (
                            <div className="space-y-2">
                              <div className="text-xs font-medium text-muted-foreground">
                                Pedidos ativos: {tableOrdersList.length}
                              </div>
                              {tableOrdersList.slice(0, 2).map((order: any) => (
                                <div key={order.id} className="text-xs bg-white p-2 rounded border">
                                  <div className="flex justify-between items-center">
                                    <span>#{order.orderNumber}</span>
                                    <Badge 
                                      variant={order.status === 'pending' ? 'default' : 'secondary'}
                                      className="text-xs"
                                    >
                                      {order.status === 'pending' ? 'Pendente' : 
                                       order.status === 'preparing' ? 'Preparando' : 
                                       order.status === 'ready' ? 'Pronto' : order.status}
                                    </Badge>
                                  </div>
                                  <div className="text-muted-foreground mt-1">
                                    {order.customerName} - R$ {parseFloat(order.total).toFixed(2)}
                                  </div>
                                </div>
                              ))}
                              {tableOrdersList.length > 2 && (
                                <div className="text-xs text-center text-muted-foreground">
                                  +{tableOrdersList.length - 2} mais...
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-center text-muted-foreground text-sm">
                              <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                              Mesa livre
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      );
    }

    if (activeSection === "plano") {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Gerenciar Plano</h2>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Seu Plano Atual</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="font-medium">Plano: {user?.subscriptionPlan || 'Trial'}</p>
                  <p className="text-sm text-muted-foreground">
                    {user?.isTrialActive 
                      ? `Trial ativo até ${user?.trialEndsAt ? new Date(user.trialEndsAt).toLocaleDateString('pt-BR') : 'N/A'}`
                      : 'Plano pago ativo'
                    }
                  </p>
                </div>
                <div>
                  <p className="font-medium">Status: 
                    <span className={`ml-2 px-2 py-1 rounded text-xs ${
                      user?.isTrialActive ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {user?.isTrialActive ? 'Trial' : 'Ativo'}
                    </span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Escolha Seu Novo Plano</CardTitle>
              <p className="text-muted-foreground">Selecione um plano e gere o pagamento PIX</p>
            </CardHeader>
            <CardContent>
              <PlanoSelector restaurantId={restaurant?.id} />
            </CardContent>
          </Card>

          {/* Histórico de Pagamentos */}
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Pagamentos</CardTitle>
              <p className="text-muted-foreground">Acompanhe seus pagamentos e renovações</p>
            </CardHeader>
            <CardContent>
              <PaymentHistory restaurantId={restaurant?.id} />
            </CardContent>
          </Card>
        </div>
      );
    }

    if (activeSection === "historico") {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Histórico de Pedidos</h2>
          </div>

          {/* Filtros */}
          <Card>
            <CardHeader>
              <CardTitle>Filtros</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="dateFrom">Data Inicial</Label>
                  <Input
                    id="dateFrom"
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    data-testid="input-date-from"
                  />
                </div>
                <div>
                  <Label htmlFor="dateTo">Data Final</Label>
                  <Input
                    id="dateTo"
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    data-testid="input-date-to"
                  />
                </div>
                <div>
                  <Label htmlFor="orderType">Tipo de Pedido</Label>
                  <Select value={orderTypeFilter} onValueChange={setOrderTypeFilter} data-testid="select-order-type">
                    <SelectTrigger>
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="delivery">Delivery</SelectItem>
                      <SelectItem value="table">Mesa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="tableNumber">Mesa</Label>
                  <Select value={tableFilter} onValueChange={setTableFilter} data-testid="select-table">
                    <SelectTrigger>
                      <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      {tables.map((table: any) => (
                        <SelectItem key={table.id} value={table.id}>
                          Mesa {table.number}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="mt-4">
                <Button 
                  onClick={() => {
                    // Filtros já aplicados através dos estados
                    toast({
                      title: "Filtros aplicados",
                      description: "Os filtros foram aplicados com sucesso"
                    });
                  }}
                  data-testid="button-apply-filters"
                >
                  Aplicar Filtros
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Lista de pedidos históricos */}
          <Card>
            <CardHeader>
              <CardTitle>Pedidos Realizados</CardTitle>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                </div>
              ) : (() => {
                const historicalOrders = (historyData && typeof historyData === 'object' && 'orders' in historyData) ? (historyData.orders as any[]) : [];

                if (historicalOrders.length === 0) {
                  return (
                    <div className="text-center py-8">
                      <Clock className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-xl font-semibold mb-2">Nenhum pedido histórico</h3>
                      <p className="text-muted-foreground">
                        Os pedidos finalizados aparecerão aqui
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-4">
                    {(historicalOrders as any[]).map((order: any) => (
                      <Card key={order.id} className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-4 mb-2">
                              <span className="font-bold">#{order.orderNumber}</span>
                              <Badge 
                                variant={order.status === 'delivered' ? 'default' : 'destructive'}
                                data-testid={`status-${order.id}`}
                              >
                                {order.status === 'delivered' ? 'Entregue' : 'Cancelado'}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                {order.orderType === 'table' ? `Mesa ${tables.find((t: any) => t.id === order.tableId)?.number || order.tableId}` : 'Delivery'}
                              </span>
                            </div>
                            
                            <div className="text-sm text-muted-foreground mb-2">
                              <p><strong>Cliente:</strong> {order.customerName}</p>
                              {order.customerPhone && <p><strong>Telefone:</strong> {order.customerPhone}</p>}
                              <p><strong>Data:</strong> {new Date(order.createdAt).toLocaleString('pt-BR')}</p>
                              {order.deliveredAt && (
                                <p><strong>Finalizado em:</strong> {new Date(order.deliveredAt).toLocaleString('pt-BR')}</p>
                              )}
                            </div>

                            <div className="text-sm">
                              <strong>Itens:</strong>
                              <ul className="mt-1 space-y-1">
                                {order.items?.map((item: any, index: number) => (
                                  <li key={index} className="flex justify-between">
                                    <span>{item.quantity}x {item.productName}</span>
                                    <span>R$ {(item.quantity * parseFloat(item.price)).toFixed(2)}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="text-lg font-bold text-green-600 mb-3">
                              R$ {parseFloat(order.total).toFixed(2)}
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                // Função para escapar HTML e prevenir XSS
                                const escapeHtml = (text: string) => {
                                  const div = document.createElement('div');
                                  div.textContent = text;
                                  return div.innerHTML;
                                };
                                
                                // Criar função de impressão similar à do OrderCard
                                const printContent = `
                                  <div style="font-family: monospace; width: 350px; margin: 0 auto; padding: 20px;">
                                    <div style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 20px;">
                                      <h2 style="margin: 0; font-size: 20px;">PEDIDO #${order.orderNumber}</h2>
                                      <p style="margin: 5px 0; font-size: 12px;">${new Date(order.createdAt || new Date()).toLocaleString('pt-BR')}</p>
                                    </div>
                                    
                                    <div style="margin-bottom: 20px;">
                                      <div style="margin-bottom: 8px;"><strong>Cliente:</strong> ${escapeHtml(order.customerName || '')}</div>
                                      ${order.customerPhone ? `<div style="margin-bottom: 8px;"><strong>Telefone:</strong> ${escapeHtml(order.customerPhone)}</div>` : ''}
                                      ${order.customerAddress ? `<div style="margin-bottom: 8px;"><strong>Endereço:</strong> ${escapeHtml(order.customerAddress)}</div>` : ''}
                                      <div style="margin-bottom: 8px;"><strong>Tipo:</strong> ${order.orderType === "delivery" ? "Entrega" : order.orderType === "table" ? "Mesa" : "Retirada"}</div>
                                    </div>
                                    
                                    <div style="margin-bottom: 20px;">
                                      <h3 style="margin: 0 0 10px 0; padding-bottom: 5px; border-bottom: 1px solid #333;">PRODUTOS:</h3>
                                      ${(order.items || []).map((item: any) => `
                                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; padding: 5px 0; border-bottom: 1px dotted #666;">
                                          <div style="flex: 1;">
                                            <div style="font-weight: bold;">${escapeHtml(item.productName || 'Produto')}</div>
                                            ${item.specialInstructions ? `<div style="font-size: 11px; color: #666; margin-top: 2px;">Obs: ${escapeHtml(item.specialInstructions)}</div>` : ''}
                                          </div>
                                          <div style="text-align: right; margin-left: 10px;">
                                            <div>${item.quantity}x R$ ${parseFloat(item.price || 0).toFixed(2)}</div>
                                            <div style="font-weight: bold;">R$ ${(item.quantity * parseFloat(item.price || 0)).toFixed(2)}</div>
                                          </div>
                                        </div>
                                      `).join('')}
                                    </div>
                                    
                                    ${order.notes ? `<div style="margin-bottom: 20px; padding: 10px; background: #f5f5f5; border: 1px dashed #999;"><strong>Observações:</strong><br>${escapeHtml(order.notes)}</div>` : ''}
                                    
                                    <div style="border-top: 2px solid #000; padding-top: 15px; margin-top: 20px;">
                                      <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px;">
                                        <span>Subtotal:</span>
                                        <span>R$ ${parseFloat(order.total || 0).toFixed(2)}</span>
                                      </div>
                                      ${order.deliveryFee ? `<div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px;"><span>Taxa de entrega:</span><span>R$ ${parseFloat(order.deliveryFee).toFixed(2)}</span></div>` : ''}
                                      <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 16px; border-top: 1px solid #333; padding-top: 8px;">
                                        <span>TOTAL:</span>
                                        <span>R$ ${(parseFloat(order.total || 0) + parseFloat(order.deliveryFee || 0)).toFixed(2)}</span>
                                      </div>
                                    </div>
                                    
                                    <div style="text-align: center; margin-top: 20px; padding-top: 15px; border-top: 1px dashed #333; font-size: 12px;">
                                      Obrigado pela preferência!<br>
                                      RestaurantePro - Sistema de Gestão
                                    </div>
                                  </div>
                                `;
                                
                                const printWindow = window.open('', '_blank');
                                if (printWindow) {
                                  printWindow.document.write(`
                                    <html>
                                      <head>
                                        <title>Pedido #${order.orderNumber}</title>
                                        <style>
                                          @media print {
                                            body { margin: 0; }
                                            @page { margin: 10mm; }
                                          }
                                        </style>
                                      </head>
                                      <body>${printContent}</body>
                                    </html>
                                  `);
                                  printWindow.document.close();
                                  printWindow.print();
                                }
                              }}
                              data-testid={`button-print-history-${order.id}`}
                            >
                              <FileText className="h-4 w-4 mr-2" />
                              Imprimir
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4 capitalize">{activeSection}</h2>
        <p className="text-muted-foreground">Esta seção está em desenvolvimento.</p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <div className="w-64 bg-card shadow-lg border-r">
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold text-primary">RestaurantePro</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Bem vindo(a), {user?.firstName || user?.email?.split('@')[0] || 'Paulo'} teste!
          </p>
        </div>

        <nav className="p-4 space-y-2">
          {menuItems.map((item) => (
            <div key={item.id}>
              <button
                onClick={() => handleMenuClick(item.id)}
                className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                  activeSection === item.id 
                    ? 'bg-primary text-primary-foreground' 
                    : 'hover:bg-muted'
                }`}
                data-testid={`menu-${item.id}`}
              >
                <div className="flex items-center space-x-3">
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                {item.hasSubmenu && (
                  expandedMenu === item.id ? 
                    <ChevronDown className="w-4 h-4" /> : 
                    <ChevronRight className="w-4 h-4" />
                )}
              </button>

              {/* Submenu */}
              {item.hasSubmenu && expandedMenu === item.id && (
                <div className="mt-2 ml-6 space-y-1">
                  {item.submenu?.map((subitem, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        if (item.id === "produtos") {
                          if (index === 0) { // "Gerenciar produtos"
                            setActiveSection("produtos");
                            setExpandedMenu(null);
                          } else if (index === 1) { // "Consultar o estoque"
                            setActiveSection("estoque");
                            setExpandedMenu(null);
                          }
                        } else if (item.id === "configuracoes") {
                          if (index === 0) { // "Dados da empresa"
                            setActiveSection("configuracoes");
                            setConfigurationSubSection("dados-empresa");
                            setExpandedMenu(null);
                          } else if (index === 1) { // "Configurar WhatsApp"
                            setActiveSection("configuracoes");
                            setConfigurationSubSection("whatsapp");
                            setExpandedMenu(null);
                          } else if (index === 2) { // "Configurar SEO"
                            setActiveSection("configuracoes");
                            setConfigurationSubSection("seo");
                            setExpandedMenu(null);
                          } else if (index === 3) { // "Usuários"
                            setActiveSection("configuracoes");
                            setConfigurationSubSection("usuarios");
                            setExpandedMenu(null);
                          } else if (index === 4) { // "Faixa de Cep"
                            setActiveSection("configuracoes");
                            setConfigurationSubSection("cep");
                            setExpandedMenu(null);
                          }
                        }
                      }}
                      className="w-full text-left p-2 text-sm hover:bg-muted rounded-lg transition-colors"
                      data-testid={`submenu-${item.id}-${index}`}
                    >
                      {subitem}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          <button
            onClick={() => window.location.href = "/api/logout"}
            className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors"
            data-testid="menu-sair"
          >
            <LogOut className="w-4 h-4" />
            <span>Sair</span>
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        <header className="bg-card shadow-sm border-b p-4">
          <h2 className="text-xl font-semibold capitalize">
            {activeSection === "dashboard" ? restaurant?.name : activeSection}
          </h2>
        </header>

        <main className="p-6">
          {renderContent()}
        </main>
      </div>
      
      {/* Modal de edição de pedidos */}
    <Dialog open={showOrderEditForm} onOpenChange={setShowOrderEditForm}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Editar Pedido #{editingOrder?.orderNumber}</DialogTitle>
        </DialogHeader>
        
        {editingOrder && (
          <ScrollArea className="max-h-[70vh] pr-4">
            <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customerName">Nome do Cliente</Label>
                <Input
                  id="customerName"
                  value={editingOrder.customerName || ''}
                  onChange={(e) => setEditingOrder((prev: any) => ({ ...prev, customerName: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="customerPhone">Telefone</Label>
                <Input
                  id="customerPhone"
                  value={editingOrder.customerPhone || ''}
                  onChange={(e) => setEditingOrder((prev: any) => ({ ...prev, customerPhone: e.target.value }))}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="customerAddress">Endereço</Label>
              <Textarea
                id="customerAddress"
                value={editingOrder.customerAddress || ''}
                onChange={(e) => setEditingOrder((prev: any) => ({ ...prev, customerAddress: e.target.value }))}
              />
            </div>

            {/* Seção de Produtos */}
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-4">Produtos do Pedido</h3>
              
              {/* Lista de produtos atuais */}
              <div className="space-y-2 mb-4">
                {editingOrder.items?.map((item: any, index: number) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded">
                    <div className="flex-1">
                      <span className="font-medium">{item.productName}</span>
                      <span className="text-sm text-gray-600 ml-2">R$ {parseFloat(item.price || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const newItems = [...(editingOrder.items || [])];
                          if (newItems[index].quantity > 1) {
                            newItems[index].quantity -= 1;
                          } else {
                            newItems.splice(index, 1);
                          }
                          setEditingOrder((prev: any) => ({ ...prev, items: newItems }));
                        }}
                      >
                        -
                      </Button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const newItems = [...(editingOrder.items || [])];
                          newItems[index].quantity += 1;
                          setEditingOrder((prev: any) => ({ ...prev, items: newItems }));
                        }}
                      >
                        +
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Adicionar novos produtos */}
              <div>
                <Label>Adicionar Produto</Label>
                <Select onValueChange={(productId) => {
                  const product = availableProducts?.find((p: any) => p.id === productId);
                  if (product) {
                    const existingItemIndex = editingOrder.items?.findIndex((item: any) => item.productId === productId);
                    if (existingItemIndex >= 0) {
                      const newItems = [...(editingOrder.items || [])];
                      newItems[existingItemIndex].quantity += 1;
                      setEditingOrder((prev: any) => ({ ...prev, items: newItems }));
                    } else {
                      const newItem = {
                        productId: product.id,
                        productName: product.name,
                        price: product.price,
                        quantity: 1
                      };
                      setEditingOrder((prev: any) => ({ 
                        ...prev, 
                        items: [...(prev.items || []), newItem] 
                      }));
                    }
                  }
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um produto para adicionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableProducts?.map((product: any) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} - R$ {parseFloat(product.price || 0).toFixed(2)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="orderNotes">Observações do Pedido</Label>
              <Textarea
                id="orderNotes"
                value={editingOrder.notes || ''}
                onChange={(e) => setEditingOrder((prev: any) => ({ ...prev, notes: e.target.value }))}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="total">Total</Label>
                <Input
                  id="total"
                  type="number"
                  step="0.01"
                  value={editingOrder.total || ''}
                  onChange={(e) => setEditingOrder((prev: any) => ({ ...prev, total: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="deliveryFee">Taxa de Entrega</Label>
                <Input
                  id="deliveryFee"
                  type="number"
                  step="0.01"
                  value={editingOrder.deliveryFee || ''}
                  onChange={(e) => setEditingOrder((prev: any) => ({ ...prev, deliveryFee: e.target.value }))}
                />
              </div>
            </div>
            </div>
          </ScrollArea>
        )}
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => {
              setShowOrderEditForm(false);
              setEditingOrder(null);
            }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={async () => {
              try {
                const response = await fetch(`/api/orders/${editingOrder.id}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    customerName: editingOrder.customerName,
                    customerPhone: editingOrder.customerPhone,
                    customerAddress: editingOrder.customerAddress,
                    notes: editingOrder.notes,
                    total: parseFloat(editingOrder.total),
                    deliveryFee: parseFloat(editingOrder.deliveryFee || 0)
                  }),
                  credentials: 'include'
                });
                
                if (response.ok) {
                  queryClient.invalidateQueries({ queryKey: ["/api/my-orders"] });
                  setShowOrderEditForm(false);
                  setEditingOrder(null);
                  toast({
                    title: "Pedido atualizado",
                    description: "O pedido foi atualizado com sucesso"
                  });
                } else {
                  throw new Error('Erro ao atualizar pedido');
                }
              } catch (error) {
                console.error('Erro ao atualizar pedido:', error);
                toast({
                  title: "Erro",
                  description: "Não foi possível atualizar o pedido",
                  variant: "destructive"
                });
              }
            }}
          >
            Salvar Alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Modal para pedidos da mesa */}
    <Dialog open={showTableOrdersModal} onOpenChange={setShowTableOrdersModal}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Pedidos da Mesa {selectedTable?.number}
            {selectedTable?.name && ` - ${selectedTable.name}`}
          </DialogTitle>
        </DialogHeader>
        
        {selectedTable && (
          <div className="space-y-4">
            {/* Informações da mesa */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Número:</span> {selectedTable.number}
                  </div>
                  <div>
                    <span className="font-medium">Capacidade:</span> {selectedTable.capacity} pessoas
                  </div>
                  <div>
                    <span className="font-medium">Status:</span>{' '}
                    <Badge variant={selectedTable.isActive ? "default" : "secondary"}>
                      {selectedTable.isActive ? "Ativa" : "Inativa"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Lista de pedidos da mesa */}
            {(() => {
              const tableOrders = (orders as any[]).filter((order: any) => order.tableId === selectedTable.id);
              
              if (tableOrders.length === 0) {
                return (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-xl font-semibold mb-2">Nenhum pedido</h3>
                      <p className="text-muted-foreground">
                        Esta mesa não possui pedidos no momento
                      </p>
                    </CardContent>
                  </Card>
                );
              }

              return (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">
                      Pedidos Ativos ({tableOrders.length})
                    </h3>
                  </div>
                  
                  {tableOrders.map((order: any) => (
                    <OrderCard 
                      key={order.id} 
                      order={order} 
                      onStatusUpdate={(status: string) => {
                        fetch(`/api/orders/${order.id}/status`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ status }),
                          credentials: 'include'
                        }).then(async response => {
                          if (!response.ok) {
                            const errorText = await response.text();
                            throw new Error(`HTTP ${response.status}: ${errorText}`);
                          }
                          return response.json();
                        }).then((updatedOrder) => {
                          queryClient.invalidateQueries({ queryKey: ["/api/my-orders"] });
                          toast({
                            title: "Status atualizado",
                            description: "O status do pedido foi atualizado com sucesso"
                          });
                          console.log('Pedido atualizado:', updatedOrder);
                        }).catch(error => {
                          console.error('Erro ao atualizar status:', error);
                          toast({
                            title: "Erro",
                            description: `Falha ao atualizar status: ${error.message}`,
                            variant: "destructive"
                          });
                        });
                      }}
                      onPrint={() => {}}
                      onEdit={(order: any) => {
                        setEditingOrder(order);
                        setShowOrderEditForm(true);
                        setShowTableOrdersModal(false); // Fechar modal da mesa
                      }}
                      isUpdatingStatus={false}
                    />
                  ))}
                </div>
              );
            })()}
          </div>
        )}
        
        <DialogFooter>
          {(() => {
            const tableOrders = (orders as any[]).filter((order: any) => order.tableId === selectedTable?.id);
            const hasActiveOrders = tableOrders.some((order: any) => 
              order.status === 'pending' || order.status === 'preparing' || order.status === 'ready'
            );
            
            return (
              <div className="flex gap-2">
                {hasActiveOrders && (
                  <Button 
                    onClick={() => {
                      setSelectedTableForClose(selectedTable);
                      setShowCloseTableModal(true);
                      setShowTableOrdersModal(false);
                    }}
                    className="bg-green-600 hover:bg-green-700"
                    data-testid="button-close-table"
                  >
                    Fechar Conta
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  onClick={() => setShowTableOrdersModal(false)}
                >
                  Fechar
                </Button>
              </div>
            );
          })()}
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Modal para fechar conta da mesa */}
    <Dialog open={showCloseTableModal} onOpenChange={setShowCloseTableModal}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Fechar Conta - Mesa {selectedTableForClose?.number}
            {selectedTableForClose?.name && ` - ${selectedTableForClose.name}`}
          </DialogTitle>
        </DialogHeader>
        
        {selectedTableForClose && (() => {
          const tableOrders = (orders as any[]).filter((order: any) => order.tableId === selectedTableForClose.id);
          const activeOrders = tableOrders.filter((order: any) => 
            order.status === 'pending' || order.status === 'preparing' || order.status === 'ready'
          );
          
          // Obter lista de usuários únicos dos pedidos ativos
          const uniqueUsers = Array.from(new Set(activeOrders.map((order: any) => order.customerName))).filter(Boolean);
          
          // Filtrar pedidos por usuário se fechamento individual estiver selecionado
          const ordersToProcess = closeByUser && selectedUserForClose 
            ? activeOrders.filter((order: any) => order.customerName === selectedUserForClose)
            : activeOrders;
          
          // Agrupar todos os produtos dos pedidos a serem processados
          const consolidatedItems: any = {};
          let totalAmount = 0;
          
          ordersToProcess.forEach((order: any) => {
            totalAmount += parseFloat(order.total || 0);
            order.items?.forEach((item: any) => {
              const price = parseFloat(item.unitPrice || item.price || 0);
              const key = `${item.productId || item.product?.id}-${price}`;
              if (consolidatedItems[key]) {
                consolidatedItems[key].quantity += item.quantity;
                consolidatedItems[key].subtotal += item.quantity * price;
              } else {
                consolidatedItems[key] = {
                  ...item,
                  price: price,
                  subtotal: item.quantity * price
                };
              }
            });
          });
          
          const itemsList = Object.values(consolidatedItems);
          
          // Calcular gorjeta
          const tipAmount = tipEnabled ? (totalAmount * tipPercentage / 100) : 0;
          const totalWithTip = totalAmount + tipAmount;
          const amountPerPersonWithTip = splitBill ? totalWithTip / numberOfPeople : totalWithTip;
          
          return (
            <div className="space-y-6">
              {/* Opções de Fechamento */}
              <Card className="bg-amber-50 border-amber-200">
                <CardHeader>
                  <CardTitle className="text-lg">Opções de Fechamento</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="closeFullTable"
                          name="closeType"
                          checked={!closeByUser}
                          onChange={() => {
                            setCloseByUser(false);
                            setSelectedUserForClose("");
                          }}
                          className="rounded"
                          data-testid="radio-close-full-table"
                        />
                        <Label htmlFor="closeFullTable" className="font-medium">
                          Fechar conta da mesa completa ({activeOrders.length} pedidos)
                        </Label>
                      </div>
                      {!closeByUser && (
                        <div className="ml-6 text-sm text-muted-foreground bg-blue-50 p-3 rounded border border-blue-200">
                          <p className="font-medium text-blue-700 mb-1">ℹ️ Todos os pedidos da mesa serão fechados:</p>
                          <ul className="list-disc list-inside space-y-1">
                            {uniqueUsers.map((user, index) => {
                              const userOrdersCount = activeOrders.filter(order => order.customerName === user).length;
                              return (
                                <li key={index} className="text-blue-600">
                                  <strong>{user}</strong> - {userOrdersCount} pedido{userOrdersCount !== 1 ? 's' : ''}
                                </li>
                              );
                            })}
                          </ul>
                          <p className="mt-2 text-xs text-blue-600">
                            Total: {activeOrders.length} pedidos de {uniqueUsers.length} usuário{uniqueUsers.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="closeByUser"
                        name="closeType"
                        checked={closeByUser}
                        onChange={() => setCloseByUser(true)}
                        className="rounded"
                        data-testid="radio-close-by-user"
                      />
                      <Label htmlFor="closeByUser" className="font-medium">
                        Fechar conta por usuário individual
                      </Label>
                    </div>
                    
                    {closeByUser && (
                      <div className="ml-6 space-y-2">
                        <Label htmlFor="userSelect" className="text-sm">Selecione o usuário:</Label>
                        <select
                          id="userSelect"
                          value={selectedUserForClose}
                          onChange={(e) => setSelectedUserForClose(e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md"
                          data-testid="select-user-for-close"
                        >
                          <option value="">-- Escolha um usuário --</option>
                          {uniqueUsers.map((userName: string) => {
                            const userOrderCount = activeOrders.filter(order => order.customerName === userName).length;
                            return (
                              <option key={userName} value={userName}>
                                {userName} ({userOrderCount} {userOrderCount === 1 ? 'pedido' : 'pedidos'})
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Resumo da mesa/usuário */}
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Mesa:</span> {selectedTableForClose.number}
                    </div>
                    <div>
                      <span className="font-medium">
                        {closeByUser && selectedUserForClose ? 'Pedidos do Usuário:' : 'Pedidos Ativos:'}
                      </span> {ordersToProcess.length}
                    </div>
                    <div>
                      <span className="font-medium">
                        {closeByUser && selectedUserForClose ? 'Total do Usuário:' : 'Total Geral:'}
                      </span> R$ {totalAmount.toFixed(2)}
                    </div>
                  </div>
                  {closeByUser && selectedUserForClose && (
                    <div className="mt-2 text-center">
                      <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                        Fechando conta de: {selectedUserForClose}
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Produtos consolidados */}
              <Card>
                <CardHeader>
                  <CardTitle>Resumo dos Produtos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {itemsList.length === 0 ? (
                      <p className="text-center text-muted-foreground">Nenhum produto encontrado</p>
                    ) : (
                      itemsList.map((item: any, index) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <span className="font-medium">{item.product?.name || 'Produto sem nome'}</span>
                            <div className="text-sm text-muted-foreground">
                              {item.quantity}x R$ {parseFloat(item.unitPrice || item.price || 0).toFixed(2)}
                            </div>
                          </div>
                          <div className="text-lg font-semibold">
                            R$ {item.subtotal.toFixed(2)}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Opção de dividir conta */}
              <Card>
                <CardHeader>
                  <CardTitle>Opções de Pagamento</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="splitBill"
                      checked={splitBill}
                      onChange={(e) => setSplitBill(e.target.checked)}
                      className="rounded"
                      data-testid="checkbox-split-bill"
                    />
                    <Label htmlFor="splitBill">Dividir conta</Label>
                  </div>
                  
                  {splitBill && (
                    <div className="space-y-2">
                      <Label htmlFor="numberOfPeople">Número de pessoas:</Label>
                      <Input
                        id="numberOfPeople"
                        type="number"
                        min="1"
                        max="20"
                        value={numberOfPeople}
                        onChange={(e) => setNumberOfPeople(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-32"
                        data-testid="input-number-people"
                      />
                      <p className="text-sm text-muted-foreground">
                        Valor por pessoa: R$ {amountPerPersonWithTip.toFixed(2)}
                      </p>
                    </div>
                  )}
                  
                  {/* Opções de gorjeta */}
                  <div className="space-y-3 pt-4 border-t">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="tipEnabled"
                        checked={tipEnabled}
                        onChange={(e) => setTipEnabled(e.target.checked)}
                        className="rounded"
                        data-testid="checkbox-tip-enabled"
                      />
                      <Label htmlFor="tipEnabled" className="font-medium">Adicionar gorjeta</Label>
                    </div>
                    
                    {tipEnabled && (
                      <div className="space-y-2 ml-6">
                        <Label htmlFor="tipPercentage" className="text-sm">Porcentagem da gorjeta:</Label>
                        <div className="flex items-center space-x-2">
                          <Input
                            id="tipPercentage"
                            type="number"
                            min="0"
                            max="30"
                            step="0.5"
                            value={tipPercentage}
                            onChange={(e) => setTipPercentage(Math.max(0, Math.min(30, parseFloat(e.target.value) || 0)))}
                            className="w-20"
                            data-testid="input-tip-percentage"
                          />
                          <span className="text-sm">%</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Valor da gorjeta: R$ {(totalAmount * tipPercentage / 100).toFixed(2)}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Total final */}
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-lg">Subtotal:</span>
                      <span className="text-lg">R$ {totalAmount.toFixed(2)}</span>
                    </div>
                    
                    {tipEnabled && tipAmount > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-lg">Gorjeta ({tipPercentage}%):</span>
                        <span className="text-lg">R$ {tipAmount.toFixed(2)}</span>
                      </div>
                    )}
                    
                    <hr className="border-green-300" />
                    
                    <div className="flex justify-between items-center text-xl font-bold">
                      <span>Total a Pagar:</span>
                      <span className="text-green-700">
                        {splitBill ? (
                          <>R$ {amountPerPersonWithTip.toFixed(2)} (por pessoa)</>
                        ) : (
                          <>R$ {totalWithTip.toFixed(2)}</>
                        )}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          );
        })()}
        
        <DialogFooter>
          <div className="flex gap-2 w-full justify-between">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowCloseTableModal(false);
                setSplitBill(false);
                setNumberOfPeople(1);
                setCloseByUser(false);
                setSelectedUserForClose("");
                setTipEnabled(false);
                setTipPercentage(10);
              }}
            >
              Cancelar
            </Button>
            <Button 
              onClick={() => {
                // Validar se fechamento por usuário está selecionado mas nenhum usuário foi escolhido
                if (closeByUser && !selectedUserForClose) {
                  toast({
                    title: "Usuário não selecionado",
                    description: "Por favor, selecione um usuário para fechamento individual.",
                    variant: "destructive",
                  });
                  return;
                }

                // Recalcular valores para impressão
                const tableOrders = (orders as any[]).filter((order: any) => order.tableId === selectedTableForClose.id);
                const activeOrders = tableOrders.filter((order: any) => 
                  order.status === 'pending' || order.status === 'preparing' || order.status === 'ready'
                );
                const ordersToProcess = closeByUser && selectedUserForClose 
                  ? activeOrders.filter((order: any) => order.customerName === selectedUserForClose)
                  : activeOrders;
                
                const consolidatedItems: any = {};
                let totalAmount = 0;
                
                ordersToProcess.forEach((order: any) => {
                  totalAmount += parseFloat(order.total || 0);
                  order.items?.forEach((item: any) => {
                    const price = parseFloat(item.unitPrice || item.price || 0);
                    const key = `${item.productId || item.product?.id}-${price}`;
                    if (consolidatedItems[key]) {
                      consolidatedItems[key].quantity += item.quantity;
                      consolidatedItems[key].subtotal += item.quantity * price;
                    } else {
                      consolidatedItems[key] = {
                        ...item,
                        price: price,
                        subtotal: item.quantity * price
                      };
                    }
                  });
                });
                
                const itemsList = Object.values(consolidatedItems);
                const tipAmount = tipEnabled ? (totalAmount * tipPercentage / 100) : 0;
                const totalWithTip = totalAmount + tipAmount;
                
                // Chamar função de impressão antes de fechar a conta
                handlePrintBill({
                  number: selectedTableForClose.number,
                  name: selectedTableForClose.name,
                  items: itemsList
                }, totalWithTip, tipAmount);
                
                // Aguardar um momento para a impressão e então fechar a conta
                setTimeout(() => {
                  closeTableMutation.mutate({
                    tableId: selectedTableForClose.id,
                    splitBill,
                    numberOfPeople: splitBill ? numberOfPeople : 1,
                    closeByUser,
                    selectedUser: selectedUserForClose
                  });
                }, 1000); // Aguarda 1 segundo para a impressão iniciar
              }}
              disabled={closeTableMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
              data-testid="button-confirm-close"
            >
              {closeTableMutation.isPending ? "Fechando..." : 
                closeByUser && selectedUserForClose ? 
                  `Fechar Conta de ${selectedUserForClose}` : 
                  "Fechar Conta da Mesa"
              }
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </div>
  );
}