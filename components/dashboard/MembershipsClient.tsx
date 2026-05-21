"use client";

import { useState, useCallback } from "react";
import {
  Crown,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Check,
  Upload,
  XCircle,
  Sparkles,
  Shield,
  Zap,
  Star,
} from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";

import { MEMBERSHIP_STATUSES } from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  getActiveMembershipTiers,
  applyForMembership,
  getMyMembershipApplications,
  uploadMembershipPayment,
  cancelMembershipApplication,
} from "@/lib/actions/client/memberships";
import { getActivePaymentMethods } from "@/lib/actions/client/fan-cards";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

interface SerializedTier {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  price: number;
  currency: string;
  billingCycle: string;
  billingCycleLabel: string;
  features: string[];
  maxBookingsPerMonth: number;
  discountPercent: number;
  prioritySupport: boolean;
  earlyAccess: boolean;
  exclusiveContent: boolean;
  badge?: { url: string };
  color?: string;
  isActive: boolean;
  totalMembers: number;
}

interface SerializedApplication {
  _id: string;
  tierId: string;
  tierName: string;
  membershipCardNumber: string;
  status: string;
  amount: number;
  currency: string;
  paymentMethodUsed?: string;
  paymentReceipt?: string;
  autoRenew: boolean;
  adminNote?: string;
  appliedAt: string;
  approvedAt?: string;
  activatedAt?: string;
  expiresAt?: string;
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

interface PaginatedApplications {
  data: SerializedApplication[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
}

interface MembershipsClientProps {
  initialTiers: SerializedTier[];
  initialApplications: PaginatedApplications;
}

/* ─── Component ─── */

export default function MembershipsClient({ initialTiers, initialApplications }: MembershipsClientProps) {
  // Tab control
  const [activeTab, setActiveTab] = useState("tiers");

  // Tiers
  const [tiers] = useState<SerializedTier[]>(initialTiers);

  // Applications
  const [applications, setApplications] = useState<PaginatedApplications>(initialApplications);
  const [appFilter, setAppFilter] = useState("all");
  const [appPage, setAppPage] = useState(1);
  const [isLoadingApps, setIsLoadingApps] = useState(false);

  // Apply dialog
  const [applyingTier, setApplyingTier] = useState<SerializedTier | null>(null);
  const [autoRenew, setAutoRenew] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  // Payment dialog
  const [payingApp, setPayingApp] = useState<SerializedApplication | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodOption[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");
  const [receiptFile, setReceiptFile] = useState<string | null>(null);
  const [isUploadingPayment, setIsUploadingPayment] = useState(false);

  // Cancel
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  /* ─── Data Fetching ─── */

  const fetchApplications = useCallback(async (page: number, status?: string) => {
    setIsLoadingApps(true);
    try {
      const result = await getMyMembershipApplications({
        status: status !== "all" ? status : undefined,
        page,
      });
      if (result.success && result.data) setApplications(result.data);
    } finally {
      setIsLoadingApps(false);
    }
  }, []);

  /* ─── Apply ─── */

  const handleApply = async () => {
    if (!applyingTier) return;
    setIsApplying(true);
    try {
      const result = await applyForMembership({
        tierId: applyingTier._id,
        autoRenew,
      });
      if (result.success) {
        toast.success(`Application submitted! Card #${result.data?.membershipCardNumber}`);
        setApplyingTier(null);
        setAutoRenew(false);
        fetchApplications(1, "all");
        setAppFilter("all");
        setActiveTab("applications");
      } else {
        toast.error(result.error || "Application failed");
      }
    } finally {
      setIsApplying(false);
    }
  };

  /* ─── Payment ─── */

  const handleOpenPayment = async (app: SerializedApplication) => {
    setPayingApp(app);
    const result = await getActivePaymentMethods();
    if (result.success && result.data) setPaymentMethods(result.data);
  };

  const handleUploadPayment = async () => {
    if (!payingApp || !selectedPaymentMethod || !receiptFile) return;
    setIsUploadingPayment(true);
    try {
      const method = paymentMethods.find((m) => m._id === selectedPaymentMethod);
      const result = await uploadMembershipPayment({
        applicationId: payingApp._id,
        paymentMethodUsed: method?.label || selectedPaymentMethod,
        paymentMethodType: method?.type,
        paymentReceipt: receiptFile,
      });
      if (result.success) {
        toast.success("Payment receipt uploaded");
        setPayingApp(null);
        setReceiptFile(null);
        setSelectedPaymentMethod("");
        fetchApplications(appPage, appFilter);
      } else {
        toast.error(result.error || "Upload failed");
      }
    } finally {
      setIsUploadingPayment(false);
    }
  };

  const handleCancel = async (appId: string) => {
    setCancellingId(appId);
    try {
      const result = await cancelMembershipApplication(appId);
      if (result.success) {
        toast.success("Application cancelled");
        fetchApplications(appPage, appFilter);
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

  const handleAppFilterChange = (val: string) => { setAppFilter(val); setAppPage(1); fetchApplications(1, val); };
  const handleAppPageChange = (p: number) => { setAppPage(p); fetchApplications(p, appFilter); };

  /* ─── Status Badge ─── */

  const getStatusBadge = (status: string) => {
    const info = MEMBERSHIP_STATUSES.find((s) => s.value === status);
    return (
      <Badge variant="outline" className={`text-xs ${info?.color || ""}`}>
        {info?.label || status}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-[#FAFAFA]">Memberships</h1>
        <p className="text-sm text-[#71717A]">Unlock premium perks with exclusive membership tiers</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-[#111111] border border-[#262626]">
          <TabsTrigger value="tiers" className="data-[state=active]:bg-[#C9A96E]/20 data-[state=active]:text-[#C9A96E]">
            <Crown className="w-4 h-4 mr-2" />
            Plans ({tiers.length})
          </TabsTrigger>
          <TabsTrigger value="applications" className="data-[state=active]:bg-[#C9A96E]/20 data-[state=active]:text-[#C9A96E]">
            <Star className="w-4 h-4 mr-2" />
            My Memberships ({applications.total})
          </TabsTrigger>
        </TabsList>

        {/* ═══ Tiers Tab ═══ */}
        <TabsContent value="tiers" className="space-y-4">
          {tiers.length === 0 ? (
            <div className="text-center py-16 bg-[#111111] border border-[#262626] rounded-xl">
              <Crown className="w-16 h-16 mx-auto text-[#262626] mb-4" />
              <p className="text-[#71717A] text-lg">No membership plans available yet</p>
              <p className="text-[#52525B] text-sm mt-1">Check back soon</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tiers.map((tier, i) => {
                const isPopular = i === Math.floor(tiers.length / 2);
                return (
                  <div
                    key={tier._id}
                    className={`relative bg-[#111111] border rounded-2xl p-6 flex flex-col transition-all hover:scale-[1.02] ${
                      isPopular ? "border-[#C9A96E] shadow-lg shadow-[#C9A96E]/10" : "border-[#262626]"
                    }`}
                    style={tier.color ? { borderColor: isPopular ? tier.color : undefined } : undefined}
                  >
                    {isPopular && (
                      <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#C9A96E] text-black text-xs px-3">
                        Most Popular
                      </Badge>
                    )}

                    <div className="space-y-3 mb-4">
                      <h3 className="text-xl font-display font-bold text-[#FAFAFA]">{tier.name}</h3>
                      {tier.shortDescription && (
                        <p className="text-sm text-[#71717A]">{tier.shortDescription}</p>
                      )}
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-[#C9A96E]">{formatCurrency(tier.price)}</span>
                        <span className="text-sm text-[#71717A]">/{tier.billingCycleLabel.toLowerCase()}</span>
                      </div>
                    </div>

                    <div className="space-y-2.5 flex-1 mb-5">
                      {tier.features.map((f, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-sm text-[#A1A1AA]">
                          <Check className="w-4 h-4 text-[#C9A96E] shrink-0 mt-0.5" />
                          <span>{f}</span>
                        </div>
                      ))}

                      <div className="pt-2 space-y-1.5">
                        {tier.discountPercent > 0 && (
                          <div className="flex items-center gap-2 text-xs text-[#C9A96E]">
                            <Zap className="w-3 h-3" />
                            {tier.discountPercent}% booking discount
                          </div>
                        )}
                        {tier.prioritySupport && (
                          <div className="flex items-center gap-2 text-xs text-[#C9A96E]">
                            <Shield className="w-3 h-3" />
                            Priority support
                          </div>
                        )}
                        {tier.exclusiveContent && (
                          <div className="flex items-center gap-2 text-xs text-[#C9A96E]">
                            <Sparkles className="w-3 h-3" />
                            Exclusive content
                          </div>
                        )}
                      </div>
                    </div>

                    <Button
                      onClick={() => setApplyingTier(tier)}
                      className={`w-full ${
                        isPopular
                          ? "bg-[#C9A96E] hover:bg-[#D4B87A] text-black"
                          : "bg-[#1a1a1a] hover:bg-[#262626] text-[#FAFAFA] border border-[#262626]"
                      }`}
                    >
                      Get Started
                    </Button>

                    <p className="text-center text-[10px] text-[#52525B] mt-2">
                      {tier.totalMembers} member{tier.totalMembers !== 1 ? "s" : ""}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ═══ Applications Tab ═══ */}
        <TabsContent value="applications" className="space-y-4">
          <Select value={appFilter} onValueChange={handleAppFilterChange}>
            <SelectTrigger className="w-48 bg-[#111111] border-[#262626]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {MEMBERSHIP_STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {isLoadingApps ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-[#C9A96E]" />
            </div>
          ) : applications.data.length === 0 ? (
            <div className="text-center py-16 bg-[#111111] border border-[#262626] rounded-xl">
              <Crown className="w-16 h-16 mx-auto text-[#262626] mb-4" />
              <p className="text-[#71717A]">No memberships yet</p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {applications.data.map((app) => (
                  <div key={app._id} className="bg-[#111111] border border-[#262626] rounded-xl p-4">
                    <div className="flex flex-col sm:flex-row gap-3 justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-sm text-[#FAFAFA]">{app.membershipCardNumber}</span>
                          {getStatusBadge(app.status)}
                          {app.autoRenew && (
                            <Badge variant="outline" className="text-[9px] border-[#C9A96E]/30 text-[#C9A96E]">Auto-renew</Badge>
                          )}
                        </div>
                        <p className="text-sm text-[#A1A1AA]">{app.tierName}</p>
                        <p className="text-xs text-[#71717A]">
                          {formatCurrency(app.amount)} · Applied: {formatDate(app.appliedAt)}
                          {app.activatedAt && ` · Active since: ${formatDate(app.activatedAt)}`}
                          {app.expiresAt && ` · Expires: ${formatDate(app.expiresAt)}`}
                        </p>
                        {app.adminNote && (
                          <p className="text-xs text-[#C9A96E] italic">Note: {app.adminNote}</p>
                        )}
                      </div>
                      <div className="flex sm:flex-col gap-2 shrink-0">
                        {app.status === "pending" && !app.paymentReceipt && (
                          <Button size="sm" onClick={() => handleOpenPayment(app)} className="bg-[#C9A96E] hover:bg-[#D4B87A] text-black text-xs">
                            <Upload className="w-3 h-3 mr-1" />
                            Pay
                          </Button>
                        )}
                        {app.status === "pending" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCancel(app._id)}
                            disabled={cancellingId === app._id}
                            className="border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs"
                          >
                            {cancellingId === app._id ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3 mr-1" />}
                            Cancel
                          </Button>
                        )}
                        {app.paymentReceipt && (
                          <a href={app.paymentReceipt} target="_blank" rel="noopener noreferrer" className="text-[10px] text-[#C9A96E] hover:underline">
                            View Receipt
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {applications.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4">
                  <Button size="sm" variant="outline" onClick={() => handleAppPageChange(appPage - 1)} disabled={appPage <= 1} className="border-[#262626]">
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-[#71717A]">Page {applications.page} of {applications.totalPages}</span>
                  <Button size="sm" variant="outline" onClick={() => handleAppPageChange(appPage + 1)} disabled={!applications.hasMore} className="border-[#262626]">
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* ═══ Apply Dialog ═══ */}
      <Dialog open={!!applyingTier} onOpenChange={() => { setApplyingTier(null); setAutoRenew(false); }}>
        <DialogContent className="max-w-md bg-[#111111] border-[#262626]">
          <DialogHeader>
            <DialogTitle className="text-[#FAFAFA] font-display">Apply for Membership</DialogTitle>
            <DialogDescription className="text-[#71717A]">
              {applyingTier?.name} — {formatCurrency(applyingTier?.price || 0)}/{applyingTier?.billingCycleLabel.toLowerCase()}
            </DialogDescription>
          </DialogHeader>

          {applyingTier && (
            <div className="space-y-4">
              <div className="p-4 bg-[#0a0a0a] rounded-lg border border-[#262626] space-y-2">
                <h4 className="font-semibold text-[#FAFAFA]">{applyingTier.name}</h4>
                {applyingTier.description && (
                  <p className="text-sm text-[#71717A]">{applyingTier.description}</p>
                )}
                <div className="space-y-1 pt-2">
                  {applyingTier.features.slice(0, 5).map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-[#A1A1AA]">
                      <Check className="w-3 h-3 text-[#C9A96E]" />
                      {f}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-[#A1A1AA]">Auto-renew when expired</Label>
                <Switch checked={autoRenew} onCheckedChange={setAutoRenew} />
              </div>

              <p className="text-xs text-[#52525B]">
                After submitting, you&apos;ll need to upload a payment receipt. Your membership will be activated once admin approves.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setApplyingTier(null)} className="border-[#262626]">Cancel</Button>
            <Button onClick={handleApply} disabled={isApplying} className="bg-[#C9A96E] hover:bg-[#D4B87A] text-black">
              {isApplying && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Submit Application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ Payment Upload Dialog ═══ */}
      <Dialog open={!!payingApp} onOpenChange={() => { setPayingApp(null); setReceiptFile(null); setSelectedPaymentMethod(""); }}>
        <DialogContent className="max-w-md bg-[#111111] border-[#262626]">
          <DialogHeader>
            <DialogTitle className="text-[#FAFAFA] font-display">Upload Payment</DialogTitle>
            <DialogDescription className="text-[#71717A]">
              {payingApp?.tierName} — {formatCurrency(payingApp?.amount || 0)}
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
            <Button variant="outline" onClick={() => { setPayingApp(null); setReceiptFile(null); }} className="border-[#262626]">Cancel</Button>
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
