"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import {
  CreditCard,
  Package,
  Star,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  Upload,
  XCircle,
  MapPin,
} from "lucide-react";
import { toast } from "sonner";

import { FAN_CARD_ORDER_STATUSES } from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  getAvailableFanCards,
  orderFanCard,
  getMyFanCardOrders,
  uploadFanCardPayment,
  cancelFanCardOrder,
  getActivePaymentMethods,
} from "@/lib/actions/client/fan-cards";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  celebritySlug: string;
  celebrityImage?: string;
  cardNumber: string;
  title: string;
  description?: string;
  design: { url: string };
  backDesign?: { url: string };
  price: number;
  currency: string;
  isLimitedEdition: boolean;
  totalIssued: number;
  maxIssue: number;
  remainingSlots: number;
  isActive: boolean;
}

interface SerializedOrder {
  _id: string;
  orderNumber: string;
  fanCardTitle: string;
  fanCardDesign?: string;
  celebrityName: string;
  status: string;
  amount: number;
  currency: string;
  deliveryType: string;
  shippingAddress?: Record<string, unknown>;
  paymentMethodUsed?: string;
  paymentReceipt?: string;
  adminNote?: string;
  confirmedAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  createdAt: string;
}

interface PaymentMethodOption {
  _id: string;
  type: string;
  label: string;
  instructions?: string;
  details?: Record<string, unknown>;
}

interface PaginatedCards {
  data: SerializedFanCard[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
}

interface PaginatedOrders {
  data: SerializedOrder[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
}

interface FanCardsClientProps {
  initialCards: PaginatedCards;
  initialOrders: PaginatedOrders;
}

/* ─── Component ─── */

export default function FanCardsClient({ initialCards, initialOrders }: FanCardsClientProps) {
  // Browse state
  const [cards, setCards] = useState<PaginatedCards>(initialCards);
  const [cardPage, setCardPage] = useState(1);
  const [isLoadingCards, setIsLoadingCards] = useState(false);

  // Orders state
  const [orders, setOrders] = useState<PaginatedOrders>(initialOrders);
  const [orderFilter, setOrderFilter] = useState("all");
  const [orderPage, setOrderPage] = useState(1);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  // Order dialog
  const [selectedCard, setSelectedCard] = useState<SerializedFanCard | null>(null);
  const [deliveryType, setDeliveryType] = useState<"digital" | "physical">("digital");
  const [shippingForm, setShippingForm] = useState({
    fullName: "", street: "", city: "", state: "", country: "", postalCode: "", phone: "",
  });
  const [isOrdering, setIsOrdering] = useState(false);

  // Payment upload dialog
  const [payingOrder, setPayingOrder] = useState<SerializedOrder | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodOption[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");
  const [receiptFile, setReceiptFile] = useState<string | null>(null);
  const [isUploadingPayment, setIsUploadingPayment] = useState(false);

  // Cancel
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  /* ─── Data Fetching ─── */

  const fetchCards = useCallback(async (page: number) => {
    setIsLoadingCards(true);
    try {
      const result = await getAvailableFanCards({ page });
      if (result.success && result.data) setCards(result.data);
    } finally {
      setIsLoadingCards(false);
    }
  }, []);

  const fetchOrders = useCallback(async (page: number, status?: string) => {
    setIsLoadingOrders(true);
    try {
      const result = await getMyFanCardOrders({
        status: status !== "all" ? status : undefined,
        page,
      });
      if (result.success && result.data) setOrders(result.data);
    } finally {
      setIsLoadingOrders(false);
    }
  }, []);

  /* ─── Order Actions ─── */

  const handleOrder = async () => {
    if (!selectedCard) return;
    setIsOrdering(true);
    try {
      const payload: Record<string, unknown> = {
        fanCardId: selectedCard._id,
        deliveryType,
      };
      if (deliveryType === "physical") {
        payload.shippingAddress = shippingForm;
      }

      const result = await orderFanCard(payload);
      if (result.success) {
        toast.success(`Order placed! #${result.data?.orderNumber}`);
        setSelectedCard(null);
        setDeliveryType("digital");
        fetchOrders(1, orderFilter);
      } else {
        toast.error(result.error || "Order failed");
      }
    } finally {
      setIsOrdering(false);
    }
  };

  const handleOpenPayment = async (order: SerializedOrder) => {
    setPayingOrder(order);
    const result = await getActivePaymentMethods();
    if (result.success && result.data) {
      setPaymentMethods(result.data);
    }
  };

  const handleUploadPayment = async () => {
    if (!payingOrder || !selectedPaymentMethod || !receiptFile) return;
    setIsUploadingPayment(true);
    try {
      const method = paymentMethods.find((m) => m._id === selectedPaymentMethod);
      const result = await uploadFanCardPayment({
        orderId: payingOrder._id,
        paymentMethodUsed: method?.label || selectedPaymentMethod,
        paymentMethodType: method?.type,
        paymentReceipt: receiptFile,
      });
      if (result.success) {
        toast.success("Payment receipt uploaded");
        setPayingOrder(null);
        setReceiptFile(null);
        setSelectedPaymentMethod("");
        fetchOrders(orderPage, orderFilter);
      } else {
        toast.error(result.error || "Upload failed");
      }
    } finally {
      setIsUploadingPayment(false);
    }
  };

  const handleCancel = async (orderId: string) => {
    setCancellingId(orderId);
    try {
      const result = await cancelFanCardOrder(orderId);
      if (result.success) {
        toast.success("Order cancelled");
        fetchOrders(orderPage, orderFilter);
      } else {
        toast.error(result.error || "Cancel failed");
      }
    } finally {
      setCancellingId(null);
    }
  };

  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setReceiptFile(reader.result as string);
    reader.readAsDataURL(file);
  };

  /* ─── Pagination ─── */

  const handleCardPageChange = (p: number) => { setCardPage(p); fetchCards(p); };
  const handleOrderPageChange = (p: number) => { setOrderPage(p); fetchOrders(p, orderFilter); };
  const handleOrderFilterChange = (val: string) => { setOrderFilter(val); setOrderPage(1); fetchOrders(1, val); };

  /* ─── Status Badge ─── */

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
      <div>
        <h1 className="font-display text-2xl font-bold text-[#FAFAFA]">Fan Cards</h1>
        <p className="text-sm text-[#71717A]">Browse exclusive celebrity fan cards and manage your orders</p>
      </div>

      <Tabs defaultValue="browse" className="space-y-6">
        <TabsList className="bg-[#111111] border border-[#262626]">
          <TabsTrigger value="browse" className="data-[state=active]:bg-[#C9A96E]/20 data-[state=active]:text-[#C9A96E]">
            <CreditCard className="w-4 h-4 mr-2" />
            Browse ({cards.total})
          </TabsTrigger>
          <TabsTrigger value="orders" className="data-[state=active]:bg-[#C9A96E]/20 data-[state=active]:text-[#C9A96E]">
            <Package className="w-4 h-4 mr-2" />
            My Orders ({orders.total})
          </TabsTrigger>
        </TabsList>

        {/* ═══ Browse Tab ═══ */}
        <TabsContent value="browse" className="space-y-4">
          {isLoadingCards ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-[#C9A96E]" />
            </div>
          ) : cards.data.length === 0 ? (
            <div className="text-center py-16 bg-[#111111] border border-[#262626] rounded-xl">
              <CreditCard className="w-16 h-16 mx-auto text-[#262626] mb-4" />
              <p className="text-[#71717A] text-lg">No fan cards available right now</p>
              <p className="text-[#52525B] text-sm mt-1">Check back soon for new releases</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {cards.data.map((card) => (
                  <div key={card._id} className="group bg-[#111111] border border-[#262626] rounded-xl overflow-hidden hover:border-[#C9A96E]/30 transition-colors">
                    <div className="relative w-full h-56 overflow-hidden">
                      <Image src={card.design.url} alt={card.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 768px) 100vw, 33vw" />
                      {card.isLimitedEdition && (
                        <Badge className="absolute top-3 left-3 bg-[#C9A96E] text-black text-[10px]">
                          <Star className="w-3 h-3 mr-1" />
                          Limited Edition
                        </Badge>
                      )}
                    </div>
                    <div className="p-4 space-y-2">
                      <h3 className="font-semibold text-[#FAFAFA]">{card.title}</h3>
                      <p className="text-sm text-[#71717A]">{card.celebrityName}</p>
                      {card.description && (
                        <p className="text-xs text-[#52525B] line-clamp-2">{card.description}</p>
                      )}
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-lg font-bold text-[#C9A96E]">{formatCurrency(card.price)}</span>
                        {card.isLimitedEdition && card.maxIssue > 0 && (
                          <span className="text-xs text-[#71717A]">
                            {card.remainingSlots === Infinity ? "∞" : card.remainingSlots} remaining
                          </span>
                        )}
                      </div>
                      <Button
                        onClick={() => setSelectedCard(card)}
                        disabled={card.isLimitedEdition && card.remainingSlots <= 0}
                        className="w-full mt-2 bg-[#C9A96E] hover:bg-[#D4B87A] text-black"
                      >
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        {card.isLimitedEdition && card.remainingSlots <= 0 ? "Sold Out" : "Order Now"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {cards.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4">
                  <Button size="sm" variant="outline" onClick={() => handleCardPageChange(cardPage - 1)} disabled={cardPage <= 1} className="border-[#262626]">
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-[#71717A]">Page {cards.page} of {cards.totalPages}</span>
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

          {isLoadingOrders ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-[#C9A96E]" />
            </div>
          ) : orders.data.length === 0 ? (
            <div className="text-center py-16 bg-[#111111] border border-[#262626] rounded-xl">
              <Package className="w-16 h-16 mx-auto text-[#262626] mb-4" />
              <p className="text-[#71717A]">No orders yet</p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {orders.data.map((order) => (
                  <div key={order._id} className="bg-[#111111] border border-[#262626] rounded-xl p-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                      {order.fanCardDesign && (
                        <div className="relative w-16 h-20 rounded-lg overflow-hidden border border-[#262626] shrink-0">
                          <Image src={order.fanCardDesign} alt={order.fanCardTitle} fill className="object-cover" sizes="64px" />
                        </div>
                      )}
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-sm text-[#FAFAFA]">{order.orderNumber}</span>
                          {getStatusBadge(order.status)}
                          <Badge variant="outline" className="text-[10px] border-[#262626]">
                            {order.deliveryType}
                          </Badge>
                        </div>
                        <p className="text-sm text-[#A1A1AA]">
                          {order.fanCardTitle} — {order.celebrityName}
                        </p>
                        <p className="text-xs text-[#71717A]">
                          {formatCurrency(order.amount)} · {formatDate(order.createdAt)}
                        </p>
                        {order.adminNote && (
                          <p className="text-xs text-[#C9A96E] italic mt-1">Note: {order.adminNote}</p>
                        )}
                      </div>
                      <div className="flex sm:flex-col gap-2 shrink-0">
                        {["pending", "payment_pending"].includes(order.status) && !order.paymentReceipt && (
                          <Button size="sm" onClick={() => handleOpenPayment(order)} className="bg-[#C9A96E] hover:bg-[#D4B87A] text-black text-xs">
                            <Upload className="w-3 h-3 mr-1" />
                            Pay
                          </Button>
                        )}
                        {["pending", "payment_pending"].includes(order.status) && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCancel(order._id)}
                            disabled={cancellingId === order._id}
                            className="border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs"
                          >
                            {cancellingId === order._id ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3 mr-1" />}
                            Cancel
                          </Button>
                        )}
                        {order.paymentReceipt && (
                          <a href={order.paymentReceipt} target="_blank" rel="noopener noreferrer" className="text-[10px] text-[#C9A96E] hover:underline">
                            View Receipt
                          </a>
                        )}
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
                  <span className="text-sm text-[#71717A]">Page {orders.page} of {orders.totalPages}</span>
                  <Button size="sm" variant="outline" onClick={() => handleOrderPageChange(orderPage + 1)} disabled={!orders.hasMore} className="border-[#262626]">
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* ═══ Order Dialog ═══ */}
      <Dialog open={!!selectedCard} onOpenChange={() => setSelectedCard(null)}>
        <DialogContent className="max-w-md bg-[#111111] border-[#262626] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#FAFAFA] font-display">Order Fan Card</DialogTitle>
            <DialogDescription className="text-[#71717A]">
              {selectedCard?.title} — {selectedCard?.celebrityName}
            </DialogDescription>
          </DialogHeader>

          {selectedCard && (
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="relative w-24 h-32 rounded-lg overflow-hidden border border-[#262626]">
                  <Image src={selectedCard.design.url} alt={selectedCard.title} fill className="object-cover" sizes="96px" />
                </div>
                <div className="space-y-1">
                  <p className="font-semibold text-[#FAFAFA]">{selectedCard.title}</p>
                  <p className="text-sm text-[#71717A]">{selectedCard.celebrityName}</p>
                  <p className="text-lg font-bold text-[#C9A96E]">{formatCurrency(selectedCard.price)}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[#A1A1AA]">Delivery Type</Label>
                <Select value={deliveryType} onValueChange={(v) => setDeliveryType(v as "digital" | "physical")}>
                  <SelectTrigger className="bg-[#0a0a0a] border-[#262626]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="digital">Digital (Instant)</SelectItem>
                    <SelectItem value="physical">Physical (Shipped)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {deliveryType === "physical" && (
                <div className="space-y-3 p-3 bg-[#0a0a0a] rounded-lg border border-[#262626]">
                  <p className="text-sm text-[#A1A1AA] flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> Shipping Address
                  </p>
                  <Input placeholder="Full Name *" value={shippingForm.fullName} onChange={(e) => setShippingForm((f) => ({ ...f, fullName: e.target.value }))} className="bg-[#111111] border-[#262626]" />
                  <Input placeholder="Street Address *" value={shippingForm.street} onChange={(e) => setShippingForm((f) => ({ ...f, street: e.target.value }))} className="bg-[#111111] border-[#262626]" />
                  <div className="grid grid-cols-2 gap-2">
                    <Input placeholder="City *" value={shippingForm.city} onChange={(e) => setShippingForm((f) => ({ ...f, city: e.target.value }))} className="bg-[#111111] border-[#262626]" />
                    <Input placeholder="State" value={shippingForm.state} onChange={(e) => setShippingForm((f) => ({ ...f, state: e.target.value }))} className="bg-[#111111] border-[#262626]" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input placeholder="Country *" value={shippingForm.country} onChange={(e) => setShippingForm((f) => ({ ...f, country: e.target.value }))} className="bg-[#111111] border-[#262626]" />
                    <Input placeholder="Postal Code *" value={shippingForm.postalCode} onChange={(e) => setShippingForm((f) => ({ ...f, postalCode: e.target.value }))} className="bg-[#111111] border-[#262626]" />
                  </div>
                  <Input placeholder="Phone (optional)" value={shippingForm.phone} onChange={(e) => setShippingForm((f) => ({ ...f, phone: e.target.value }))} className="bg-[#111111] border-[#262626]" />
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedCard(null)} className="border-[#262626]">Cancel</Button>
            <Button onClick={handleOrder} disabled={isOrdering} className="bg-[#C9A96E] hover:bg-[#D4B87A] text-black">
              {isOrdering && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Place Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ Payment Upload Dialog ═══ */}
      <Dialog open={!!payingOrder} onOpenChange={() => { setPayingOrder(null); setReceiptFile(null); setSelectedPaymentMethod(""); }}>
        <DialogContent className="max-w-md bg-[#111111] border-[#262626]">
          <DialogHeader>
            <DialogTitle className="text-[#FAFAFA] font-display">Upload Payment</DialogTitle>
            <DialogDescription className="text-[#71717A]">
              Order #{payingOrder?.orderNumber} — {formatCurrency(payingOrder?.amount || 0)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[#A1A1AA]">Payment Method</Label>
              <Select value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
                <SelectTrigger className="bg-[#0a0a0a] border-[#262626]">
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map((m) => (
                    <SelectItem key={m._id} value={m._id}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedPaymentMethod && (() => {
                const method = paymentMethods.find((m) => m._id === selectedPaymentMethod);
                return method?.instructions ? (
                  <p className="text-xs text-[#C9A96E] bg-[#C9A96E]/5 p-2 rounded">{method.instructions}</p>
                ) : null;
              })()}
            </div>

            <div className="space-y-2">
              <Label className="text-[#A1A1AA]">Payment Receipt Screenshot</Label>
              <Input type="file" accept="image/*" onChange={handleReceiptUpload} className="bg-[#0a0a0a] border-[#262626]" />
              {receiptFile && (
                <div className="relative w-full h-32 rounded-lg overflow-hidden border border-[#262626]">
                  <Image src={receiptFile} alt="Receipt" fill className="object-contain" sizes="100%" />
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setPayingOrder(null); setReceiptFile(null); }} className="border-[#262626]">Cancel</Button>
            <Button onClick={handleUploadPayment} disabled={isUploadingPayment || !selectedPaymentMethod || !receiptFile} className="bg-[#C9A96E] hover:bg-[#D4B87A] text-black">
              {isUploadingPayment && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Upload Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
