"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Search,
  Eye,
  EyeOff,
  CreditCard,
  Package,
  Star,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

import { FAN_CARD_ORDER_STATUSES } from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  getFanCards,
  createFanCard,
  updateFanCard,
  deleteFanCard,
  toggleFanCardStatus,
  getFanCardOrders,
  updateFanCardOrderStatus,
  getCelebritiesForDropdown,
} from "@/lib/actions/admin/fan-cards";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

/* ─── Types ─── */

interface SerializedFanCard {
  _id: string;
  celebrityId: string;
  celebrityName: string;
  cardNumber: string;
  title: string;
  description?: string;
  design: { url: string; publicId: string };
  backDesign?: { url: string; publicId: string };
  price: number;
  currency: string;
  isLimitedEdition: boolean;
  totalIssued: number;
  maxIssue: number;
  remainingSlots: number;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface SerializedFanCardOrder {
  _id: string;
  orderNumber: string;
  userId: string;
  userName: string;
  userEmail: string;
  fanCardId: string;
  fanCardTitle: string;
  celebrityId: string;
  celebrityName: string;
  status: string;
  amount: number;
  currency: string;
  deliveryType: string;
  shippingAddress?: Record<string, unknown>;
  paymentReceipt?: string;
  adminNote?: string;
  createdAt: string;
}

interface CelebrityOption {
  _id: string;
  name: string;
  slug: string;
  profileImage?: { url: string };
}

interface PaginatedCards {
  data: SerializedFanCard[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
}

interface PaginatedOrders {
  data: SerializedFanCardOrder[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
}

interface FanCardsClientProps {
  initialCards: PaginatedCards;
  initialOrders: PaginatedOrders;
}

/* ─── Form State ─── */

interface FanCardForm {
  celebrityId: string;
  title: string;
  description: string;
  design: string;
  backDesign: string;
  price: string;
  isLimitedEdition: boolean;
  maxIssue: string;
  isActive: boolean;
  sortOrder: string;
}

const emptyForm: FanCardForm = {
  celebrityId: "",
  title: "",
  description: "",
  design: "",
  backDesign: "",
  price: "",
  isLimitedEdition: false,
  maxIssue: "0",
  isActive: true,
  sortOrder: "0",
};

/* ─── Component ─── */

export default function FanCardsClient({ initialCards, initialOrders }: FanCardsClientProps) {
  const router = useRouter();

  // Card state
  const [cards, setCards] = useState<PaginatedCards>(initialCards);
  const [cardSearch, setCardSearch] = useState("");
  const [cardFilter, setCardFilter] = useState("all");
  const [cardPage, setCardPage] = useState(1);

  // Order state
  const [orders, setOrders] = useState<PaginatedOrders>(initialOrders);
  const [orderFilter, setOrderFilter] = useState("all");
  const [orderPage, setOrderPage] = useState(1);

  // Dialog state
  const [showForm, setShowForm] = useState(false);
  const [editingCard, setEditingCard] = useState<SerializedFanCard | null>(null);
  const [form, setForm] = useState<FanCardForm>(emptyForm);
  const [celebrities, setCelebrities] = useState<CelebrityOption[]>([]);
  const [designPreview, setDesignPreview] = useState<string | null>(null);

  // Loading state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [isLoadingCards, setIsLoadingCards] = useState(false);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  // Delete confirm
  const [deleteConfirm, setDeleteConfirm] = useState<SerializedFanCard | null>(null);

  /* ─── Data Fetching ─── */

  const fetchCards = useCallback(async (page: number, query?: string, status?: string) => {
    setIsLoadingCards(true);
    try {
      const result = await getFanCards({
        query: query || undefined,
        status: status !== "all" ? status : undefined,
        page,
      });
      if (result.success && result.data) {
        setCards(result.data);
      }
    } finally {
      setIsLoadingCards(false);
    }
  }, []);

  const fetchOrders = useCallback(async (page: number, status?: string) => {
    setIsLoadingOrders(true);
    try {
      const result = await getFanCardOrders({
        status: status !== "all" ? status : undefined,
        page,
      });
      if (result.success && result.data) {
        setOrders(result.data);
      }
    } finally {
      setIsLoadingOrders(false);
    }
  }, []);

  /* ─── Card Actions ─── */

  const handleOpenForm = async (card?: SerializedFanCard) => {
    // Load celebrities for dropdown
    const result = await getCelebritiesForDropdown();
    if (result.success && result.data) {
      setCelebrities(result.data);
    }

    if (card) {
      setEditingCard(card);
      setForm({
        celebrityId: card.celebrityId,
        title: card.title,
        description: card.description || "",
        design: card.design.url,
        backDesign: card.backDesign?.url || "",
        price: String(card.price),
        isLimitedEdition: card.isLimitedEdition,
        maxIssue: String(card.maxIssue),
        isActive: card.isActive,
        sortOrder: String(card.sortOrder),
      });
      setDesignPreview(card.design.url);
    } else {
      setEditingCard(null);
      setForm(emptyForm);
      setDesignPreview(null);
    }
    setShowForm(true);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        ...form,
        price: parseFloat(form.price) || 0,
        maxIssue: parseInt(form.maxIssue) || 0,
        sortOrder: parseInt(form.sortOrder) || 0,
      };

      const result = editingCard
        ? await updateFanCard(editingCard._id, payload)
        : await createFanCard(payload);

      if (result.success) {
        toast.success(editingCard ? "Fan card updated" : "Fan card created");
        setShowForm(false);
        fetchCards(cardPage, cardSearch, cardFilter);
      } else {
        toast.error(result.error || "Operation failed");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setDeletingId(deleteConfirm._id);
    try {
      const result = await deleteFanCard(deleteConfirm._id);
      if (result.success) {
        toast.success("Fan card deleted");
        setDeleteConfirm(null);
        fetchCards(cardPage, cardSearch, cardFilter);
      } else {
        toast.error(result.error || "Delete failed");
      }
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggle = async (id: string) => {
    setTogglingId(id);
    try {
      const result = await toggleFanCardStatus(id);
      if (result.success) {
        toast.success(`Fan card ${result.data?.isActive ? "activated" : "deactivated"}`);
        fetchCards(cardPage, cardSearch, cardFilter);
      } else {
        toast.error(result.error || "Toggle failed");
      }
    } finally {
      setTogglingId(null);
    }
  };

  const handleDesignUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setForm((f) => ({ ...f, design: base64 }));
      setDesignPreview(base64);
    };
    reader.readAsDataURL(file);
  };

  /* ─── Order Actions ─── */

  const handleOrderStatusUpdate = async (orderId: string, status: string) => {
    setUpdatingOrderId(orderId);
    try {
      const result = await updateFanCardOrderStatus(orderId, { status });
      if (result.success) {
        toast.success("Order status updated");
        fetchOrders(orderPage, orderFilter);
      } else {
        toast.error(result.error || "Update failed");
      }
    } finally {
      setUpdatingOrderId(null);
    }
  };

  /* ─── Pagination ─── */

  const handleCardPageChange = (newPage: number) => {
    setCardPage(newPage);
    fetchCards(newPage, cardSearch, cardFilter);
  };

  const handleOrderPageChange = (newPage: number) => {
    setOrderPage(newPage);
    fetchOrders(newPage, orderFilter);
  };

  const handleCardSearch = () => {
    setCardPage(1);
    fetchCards(1, cardSearch, cardFilter);
  };

  const handleCardFilterChange = (val: string) => {
    setCardFilter(val);
    setCardPage(1);
    fetchCards(1, cardSearch, val);
  };

  const handleOrderFilterChange = (val: string) => {
    setOrderFilter(val);
    setOrderPage(1);
    fetchOrders(1, val);
  };

  /* ─── Status badge helper ─── */

  const getStatusBadge = (status: string) => {
    const info = FAN_CARD_ORDER_STATUSES.find((s) => s.value === status);
    return (
      <Badge variant="outline" className={`text-xs ${info?.color || ""}`}>
        {info?.label || status}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#FAFAFA]">Fan Cards</h1>
          <p className="text-sm text-[#71717A]">Manage celebrity fan cards and orders</p>
        </div>
      </div>

      <Tabs defaultValue="cards" className="space-y-6">
        <TabsList className="bg-[#111111] border border-[#262626]">
          <TabsTrigger value="cards" className="data-[state=active]:bg-[#C9A96E]/20 data-[state=active]:text-[#C9A96E]">
            <CreditCard className="w-4 h-4 mr-2" />
            Cards ({cards.total})
          </TabsTrigger>
          <TabsTrigger value="orders" className="data-[state=active]:bg-[#C9A96E]/20 data-[state=active]:text-[#C9A96E]">
            <Package className="w-4 h-4 mr-2" />
            Orders ({orders.total})
          </TabsTrigger>
        </TabsList>

        {/* ═══ Cards Tab ═══ */}
        <TabsContent value="cards" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717A]" />
              <Input
                placeholder="Search cards..."
                value={cardSearch}
                onChange={(e) => setCardSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCardSearch()}
                className="pl-10 bg-[#111111] border-[#262626]"
              />
            </div>
            <Select value={cardFilter} onValueChange={handleCardFilterChange}>
              <SelectTrigger className="w-40 bg-[#111111] border-[#262626]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cards</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="limited">Limited Edition</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => handleOpenForm()} className="bg-[#C9A96E] hover:bg-[#D4B87A] text-black">
              <Plus className="w-4 h-4 mr-2" />
              Add Card
            </Button>
          </div>

          {isLoadingCards ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-[#C9A96E]" />
            </div>
          ) : cards.data.length === 0 ? (
            <div className="text-center py-12 bg-[#111111] border border-[#262626] rounded-xl">
              <CreditCard className="w-12 h-12 mx-auto text-[#333] mb-4" />
              <p className="text-[#71717A]">No fan cards found</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {cards.data.map((card) => (
                  <div key={card._id} className="bg-[#111111] border border-[#262626] rounded-xl overflow-hidden">
                    <div className="relative w-full h-48 overflow-hidden">
                      <Image
                        src={card.design.url}
                        alt={card.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                      {card.isLimitedEdition && (
                        <Badge className="absolute top-2 left-2 bg-[#C9A96E] text-black text-[10px]">
                          <Star className="w-3 h-3 mr-1" />
                          Limited
                        </Badge>
                      )}
                      <Badge
                        variant="outline"
                        className={`absolute top-2 right-2 text-[10px] ${card.isActive ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-red-500/20 text-red-400 border-red-500/30"}`}
                      >
                        {card.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="p-4 space-y-2">
                      <h3 className="font-semibold text-[#FAFAFA] truncate">{card.title}</h3>
                      <p className="text-xs text-[#71717A]">{card.celebrityName}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-[#C9A96E] font-semibold">{formatCurrency(card.price)}</span>
                        {card.isLimitedEdition && (
                          <span className="text-xs text-[#71717A]">
                            {card.totalIssued}/{card.maxIssue} issued
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#71717A]">{card.cardNumber}</p>
                      <div className="flex gap-2 pt-2">
                        <Button size="sm" variant="outline" onClick={() => handleOpenForm(card)} className="flex-1 border-[#262626] text-xs">
                          <Pencil className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggle(card._id)}
                          disabled={togglingId === card._id}
                          className="border-[#262626] text-xs"
                        >
                          {togglingId === card._id ? <Loader2 className="w-3 h-3 animate-spin" /> : card.isActive ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setDeleteConfirm(card)}
                          className="border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {cards.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4">
                  <Button size="sm" variant="outline" onClick={() => handleCardPageChange(cardPage - 1)} disabled={cardPage <= 1} className="border-[#262626]">
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-[#71717A]">
                    Page {cards.page} of {cards.totalPages}
                  </span>
                  <Button size="sm" variant="outline" onClick={() => handleCardPageChange(cardPage + 1)} disabled={!cards.hasMore} className="border-[#262626]">
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* ═══ Orders Tab ═══ */}
        <TabsContent value="orders" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={orderFilter} onValueChange={handleOrderFilterChange}>
              <SelectTrigger className="w-48 bg-[#111111] border-[#262626]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Orders</SelectItem>
                {FAN_CARD_ORDER_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoadingOrders ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-[#C9A96E]" />
            </div>
          ) : orders.data.length === 0 ? (
            <div className="text-center py-12 bg-[#111111] border border-[#262626] rounded-xl">
              <Package className="w-12 h-12 mx-auto text-[#333] mb-4" />
              <p className="text-[#71717A]">No orders found</p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {orders.data.map((order) => (
                  <div key={order._id} className="bg-[#111111] border border-[#262626] rounded-xl p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm text-[#FAFAFA]">{order.orderNumber}</span>
                          {getStatusBadge(order.status)}
                        </div>
                        <p className="text-sm text-[#A1A1AA]">
                          <span className="text-[#FAFAFA]">{order.userName}</span> — {order.fanCardTitle}
                        </p>
                        <p className="text-xs text-[#71717A]">
                          {order.celebrityName} · {order.deliveryType} · {formatCurrency(order.amount)} · {formatDate(order.createdAt)}
                        </p>
                        {order.paymentReceipt && (
                          <a href={order.paymentReceipt} target="_blank" rel="noopener noreferrer" className="text-xs text-[#C9A96E] hover:underline">
                            View Payment Receipt
                          </a>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Select
                          value={order.status}
                          onValueChange={(val) => handleOrderStatusUpdate(order._id, val)}
                          disabled={updatingOrderId === order._id}
                        >
                          <SelectTrigger className="w-36 h-8 text-xs bg-[#0a0a0a] border-[#262626]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FAN_CARD_ORDER_STATUSES.map((s) => (
                              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {updatingOrderId === order._id && <Loader2 className="w-4 h-4 animate-spin text-[#C9A96E]" />}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {orders.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4">
                  <Button size="sm" variant="outline" onClick={() => handleOrderPageChange(orderPage - 1)} disabled={orderPage <= 1} className="border-[#262626]">
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-[#71717A]">
                    Page {orders.page} of {orders.totalPages}
                  </span>
                  <Button size="sm" variant="outline" onClick={() => handleOrderPageChange(orderPage + 1)} disabled={!orders.hasMore} className="border-[#262626]">
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* ═══ Create/Edit Dialog ═══ */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg bg-[#111111] border-[#262626] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#FAFAFA] font-display">
              {editingCard ? "Edit Fan Card" : "Create Fan Card"}
            </DialogTitle>
            <DialogDescription className="text-[#71717A]">
              {editingCard ? "Update fan card details" : "Add a new collectible fan card"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[#A1A1AA]">Celebrity *</Label>
              <Select value={form.celebrityId} onValueChange={(val) => setForm((f) => ({ ...f, celebrityId: val }))}>
                <SelectTrigger className="bg-[#0a0a0a] border-[#262626]">
                  <SelectValue placeholder="Select celebrity" />
                </SelectTrigger>
                <SelectContent>
                  {celebrities.map((c) => (
                    <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-[#A1A1AA]">Title *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Gold Edition Fan Card"
                className="bg-[#0a0a0a] border-[#262626]"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[#A1A1AA]">Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Card description..."
                className="bg-[#0a0a0a] border-[#262626]"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[#A1A1AA]">Card Design Image *</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={handleDesignUpload}
                className="bg-[#0a0a0a] border-[#262626]"
              />
              {designPreview && (
                <div className="relative w-32 h-44 rounded-lg overflow-hidden border border-[#262626]">
                  <Image src={designPreview} alt="Design preview" fill className="object-cover" sizes="128px" />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-[#A1A1AA]">Price (USD) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  className="bg-[#0a0a0a] border-[#262626]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#A1A1AA]">Sort Order</Label>
                <Input
                  type="number"
                  min="0"
                  value={form.sortOrder}
                  onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
                  className="bg-[#0a0a0a] border-[#262626]"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-[#A1A1AA]">Limited Edition</Label>
              <Switch
                checked={form.isLimitedEdition}
                onCheckedChange={(val) => setForm((f) => ({ ...f, isLimitedEdition: val }))}
              />
            </div>

            {form.isLimitedEdition && (
              <div className="space-y-2">
                <Label className="text-[#A1A1AA]">Max Issue Count</Label>
                <Input
                  type="number"
                  min="1"
                  value={form.maxIssue}
                  onChange={(e) => setForm((f) => ({ ...f, maxIssue: e.target.value }))}
                  className="bg-[#0a0a0a] border-[#262626]"
                />
              </div>
            )}

            <div className="flex items-center justify-between">
              <Label className="text-[#A1A1AA]">Active</Label>
              <Switch
                checked={form.isActive}
                onCheckedChange={(val) => setForm((f) => ({ ...f, isActive: val }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)} className="border-[#262626]">
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-[#C9A96E] hover:bg-[#D4B87A] text-black">
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingCard ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ Delete Confirmation ═══ */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm bg-[#111111] border-[#262626]">
          <DialogHeader>
            <DialogTitle className="text-[#FAFAFA]">Delete Fan Card</DialogTitle>
            <DialogDescription className="text-[#71717A]">
              Are you sure you want to delete &quot;{deleteConfirm?.title}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)} className="border-[#262626]">
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              disabled={!!deletingId}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deletingId && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
