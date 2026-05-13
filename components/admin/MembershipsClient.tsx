"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Eye,
  EyeOff,
  Crown,
  Users,
  ChevronLeft,
  ChevronRight,
  Check,
  X as XIcon,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

import { MEMBERSHIP_STATUSES, MEMBERSHIP_BILLING_CYCLES } from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  getMembershipTiers,
  createMembershipTier,
  updateMembershipTier,
  deleteMembershipTier,
  toggleMembershipTierStatus,
  getMembershipApplications,
  updateMembershipApplicationStatus,
} from "@/lib/actions/admin/memberships";

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
  badge?: { url: string; publicId: string };
  color?: string;
  isActive: boolean;
  sortOrder: number;
  totalMembers: number;
  createdAt: string;
  updatedAt: string;
}

interface SerializedApplication {
  _id: string;
  userId: string;
  userName: string;
  userEmail: string;
  tierId: string;
  tierName: string;
  membershipCardNumber: string;
  status: string;
  amount: number;
  currency: string;
  paymentReceipt?: string;
  autoRenew: boolean;
  adminNote?: string;
  appliedAt: string;
  approvedAt?: string;
  activatedAt?: string;
  expiresAt?: string;
  cancelledAt?: string;
  createdAt: string;
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

/* ─── Form State ─── */

interface TierForm {
  name: string;
  description: string;
  shortDescription: string;
  price: string;
  billingCycle: string;
  features: string;
  maxBookingsPerMonth: string;
  discountPercent: string;
  prioritySupport: boolean;
  earlyAccess: boolean;
  exclusiveContent: boolean;
  badge: string;
  color: string;
  isActive: boolean;
  sortOrder: string;
}

const emptyForm: TierForm = {
  name: "",
  description: "",
  shortDescription: "",
  price: "",
  billingCycle: "monthly",
  features: "",
  maxBookingsPerMonth: "0",
  discountPercent: "0",
  prioritySupport: false,
  earlyAccess: false,
  exclusiveContent: false,
  badge: "",
  color: "#C9A96E",
  isActive: true,
  sortOrder: "0",
};

/* ─── Component ─── */

export default function MembershipsClient({ initialTiers, initialApplications }: MembershipsClientProps) {
  const router = useRouter();

  // Tiers state
  const [tiers, setTiers] = useState<SerializedTier[]>(initialTiers);

  // Applications state
  const [applications, setApplications] = useState<PaginatedApplications>(initialApplications);
  const [appFilter, setAppFilter] = useState("all");
  const [appPage, setAppPage] = useState(1);

  // Dialog state
  const [showForm, setShowForm] = useState(false);
  const [editingTier, setEditingTier] = useState<SerializedTier | null>(null);
  const [form, setForm] = useState<TierForm>(emptyForm);

  // Loading
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [updatingAppId, setUpdatingAppId] = useState<string | null>(null);
  const [isLoadingApps, setIsLoadingApps] = useState(false);

  // Delete confirm
  const [deleteConfirm, setDeleteConfirm] = useState<SerializedTier | null>(null);

  /* ─── Data Fetching ─── */

  const fetchTiers = useCallback(async () => {
    const result = await getMembershipTiers();
    if (result.success && result.data) {
      setTiers(result.data);
    }
  }, []);

  const fetchApplications = useCallback(async (page: number, status?: string) => {
    setIsLoadingApps(true);
    try {
      const result = await getMembershipApplications({
        status: status !== "all" ? status : undefined,
        page,
      });
      if (result.success && result.data) {
        setApplications(result.data);
      }
    } finally {
      setIsLoadingApps(false);
    }
  }, []);

  /* ─── Tier Actions ─── */

  const handleOpenForm = (tier?: SerializedTier) => {
    if (tier) {
      setEditingTier(tier);
      setForm({
        name: tier.name,
        description: tier.description || "",
        shortDescription: tier.shortDescription || "",
        price: String(tier.price),
        billingCycle: tier.billingCycle,
        features: tier.features.join("\n"),
        maxBookingsPerMonth: String(tier.maxBookingsPerMonth),
        discountPercent: String(tier.discountPercent),
        prioritySupport: tier.prioritySupport,
        earlyAccess: tier.earlyAccess,
        exclusiveContent: tier.exclusiveContent,
        badge: tier.badge?.url || "",
        color: tier.color || "#C9A96E",
        isActive: tier.isActive,
        sortOrder: String(tier.sortOrder),
      });
    } else {
      setEditingTier(null);
      setForm(emptyForm);
    }
    setShowForm(true);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const features = form.features
        .split("\n")
        .map((f) => f.trim())
        .filter(Boolean);

      const payload = {
        ...form,
        features,
        price: parseFloat(form.price) || 0,
        maxBookingsPerMonth: parseInt(form.maxBookingsPerMonth) || 0,
        discountPercent: parseFloat(form.discountPercent) || 0,
        sortOrder: parseInt(form.sortOrder) || 0,
      };

      const result = editingTier
        ? await updateMembershipTier(editingTier._id, payload)
        : await createMembershipTier(payload);

      if (result.success) {
        toast.success(editingTier ? "Tier updated" : "Tier created");
        setShowForm(false);
        fetchTiers();
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
      const result = await deleteMembershipTier(deleteConfirm._id);
      if (result.success) {
        toast.success("Tier deleted");
        setDeleteConfirm(null);
        fetchTiers();
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
      const result = await toggleMembershipTierStatus(id);
      if (result.success) {
        toast.success(`Tier ${result.data?.isActive ? "activated" : "deactivated"}`);
        fetchTiers();
      } else {
        toast.error(result.error || "Toggle failed");
      }
    } finally {
      setTogglingId(null);
    }
  };

  /* ─── Application Actions ─── */

  const handleAppStatusUpdate = async (appId: string, status: string) => {
    setUpdatingAppId(appId);
    try {
      const result = await updateMembershipApplicationStatus(appId, { status });
      if (result.success) {
        toast.success("Application status updated");
        fetchApplications(appPage, appFilter);
        fetchTiers(); // Refresh member counts
      } else {
        toast.error(result.error || "Update failed");
      }
    } finally {
      setUpdatingAppId(null);
    }
  };

  const handleAppFilterChange = (val: string) => {
    setAppFilter(val);
    setAppPage(1);
    fetchApplications(1, val);
  };

  const handleAppPageChange = (newPage: number) => {
    setAppPage(newPage);
    fetchApplications(newPage, appFilter);
  };

  /* ─── Status badge helper ─── */

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#FAFAFA]">Memberships</h1>
          <p className="text-sm text-[#71717A]">Manage membership tiers and applications</p>
        </div>
      </div>

      <Tabs defaultValue="tiers" className="space-y-6">
        <TabsList className="bg-[#111111] border border-[#262626]">
          <TabsTrigger value="tiers" className="data-[state=active]:bg-[#C9A96E]/20 data-[state=active]:text-[#C9A96E]">
            <Crown className="w-4 h-4 mr-2" />
            Tiers ({tiers.length})
          </TabsTrigger>
          <TabsTrigger value="applications" className="data-[state=active]:bg-[#C9A96E]/20 data-[state=active]:text-[#C9A96E]">
            <Users className="w-4 h-4 mr-2" />
            Applications ({applications.total})
          </TabsTrigger>
        </TabsList>

        {/* ═══ Tiers Tab ═══ */}
        <TabsContent value="tiers" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => handleOpenForm()} className="bg-[#C9A96E] hover:bg-[#D4B87A] text-black">
              <Plus className="w-4 h-4 mr-2" />
              Add Tier
            </Button>
          </div>

          {tiers.length === 0 ? (
            <div className="text-center py-12 bg-[#111111] border border-[#262626] rounded-xl">
              <Crown className="w-12 h-12 mx-auto text-[#333] mb-4" />
              <p className="text-[#71717A]">No membership tiers created</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tiers.map((tier) => (
                <div key={tier._id} className="bg-[#111111] border border-[#262626] rounded-xl p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-[#FAFAFA]">{tier.name}</h3>
                      <p className="text-xs text-[#71717A]">{tier.billingCycleLabel}</p>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${tier.isActive ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-red-500/20 text-red-400 border-red-500/30"}`}
                    >
                      {tier.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>

                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-[#C9A96E]">{formatCurrency(tier.price)}</span>
                    <span className="text-xs text-[#71717A]">/{tier.billingCycle}</span>
                  </div>

                  {tier.shortDescription && (
                    <p className="text-sm text-[#A1A1AA]">{tier.shortDescription}</p>
                  )}

                  <div className="space-y-1.5 pt-1">
                    {tier.features.slice(0, 4).map((feature, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-[#A1A1AA]">
                        <Check className="w-3 h-3 text-[#C9A96E] shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
                    {tier.features.length > 4 && (
                      <p className="text-xs text-[#71717A]">+{tier.features.length - 4} more</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs text-[#71717A] pt-1">
                    <span>{tier.totalMembers} member(s)</span>
                    {tier.discountPercent > 0 && <span>{tier.discountPercent}% discount</span>}
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-[#262626]">
                    <div className="flex gap-1.5">
                      {tier.prioritySupport && (
                        <Badge variant="outline" className="text-[9px] px-1.5 border-[#C9A96E]/30 text-[#C9A96E]">Priority</Badge>
                      )}
                      {tier.earlyAccess && (
                        <Badge variant="outline" className="text-[9px] px-1.5 border-[#C9A96E]/30 text-[#C9A96E]">Early</Badge>
                      )}
                      {tier.exclusiveContent && (
                        <Badge variant="outline" className="text-[9px] px-1.5 border-[#C9A96E]/30 text-[#C9A96E]">
                          <Sparkles className="w-2.5 h-2.5 mr-0.5" />VIP
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-1 ml-auto">
                      <Button size="sm" variant="ghost" onClick={() => handleOpenForm(tier)} className="h-7 w-7 p-0">
                        <Pencil className="w-3.5 h-3.5 text-[#71717A]" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleToggle(tier._id)}
                        disabled={togglingId === tier._id}
                        className="h-7 w-7 p-0"
                      >
                        {togglingId === tier._id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : tier.isActive ? <EyeOff className="w-3.5 h-3.5 text-[#71717A]" /> : <Eye className="w-3.5 h-3.5 text-[#71717A]" />}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setDeleteConfirm(tier)} className="h-7 w-7 p-0">
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ═══ Applications Tab ═══ */}
        <TabsContent value="applications" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={appFilter} onValueChange={handleAppFilterChange}>
              <SelectTrigger className="w-48 bg-[#111111] border-[#262626]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Applications</SelectItem>
                {MEMBERSHIP_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoadingApps ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-[#C9A96E]" />
            </div>
          ) : applications.data.length === 0 ? (
            <div className="text-center py-12 bg-[#111111] border border-[#262626] rounded-xl">
              <Users className="w-12 h-12 mx-auto text-[#333] mb-4" />
              <p className="text-[#71717A]">No applications found</p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {applications.data.map((app) => (
                  <div key={app._id} className="bg-[#111111] border border-[#262626] rounded-xl p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm text-[#FAFAFA]">{app.membershipCardNumber}</span>
                          {getStatusBadge(app.status)}
                          {app.autoRenew && (
                            <Badge variant="outline" className="text-[9px] border-[#C9A96E]/30 text-[#C9A96E]">Auto-renew</Badge>
                          )}
                        </div>
                        <p className="text-sm text-[#A1A1AA]">
                          <span className="text-[#FAFAFA]">{app.userName}</span> — {app.tierName}
                        </p>
                        <p className="text-xs text-[#71717A]">
                          {formatCurrency(app.amount)} · Applied: {formatDate(app.appliedAt)}
                          {app.expiresAt && ` · Expires: ${formatDate(app.expiresAt)}`}
                        </p>
                        {app.paymentReceipt && (
                          <a href={app.paymentReceipt} target="_blank" rel="noopener noreferrer" className="text-xs text-[#C9A96E] hover:underline">
                            View Payment Receipt
                          </a>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Select
                          value={app.status}
                          onValueChange={(val) => handleAppStatusUpdate(app._id, val)}
                          disabled={updatingAppId === app._id}
                        >
                          <SelectTrigger className="w-32 h-8 text-xs bg-[#0a0a0a] border-[#262626]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {MEMBERSHIP_STATUSES.map((s) => (
                              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {updatingAppId === app._id && <Loader2 className="w-4 h-4 animate-spin text-[#C9A96E]" />}
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
                  <span className="text-sm text-[#71717A]">
                    Page {applications.page} of {applications.totalPages}
                  </span>
                  <Button size="sm" variant="outline" onClick={() => handleAppPageChange(appPage + 1)} disabled={!applications.hasMore} className="border-[#262626]">
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* ═══ Create/Edit Tier Dialog ═══ */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg bg-[#111111] border-[#262626] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#FAFAFA] font-display">
              {editingTier ? "Edit Membership Tier" : "Create Membership Tier"}
            </DialogTitle>
            <DialogDescription className="text-[#71717A]">
              {editingTier ? "Update tier details and perks" : "Add a new membership tier"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[#A1A1AA]">Tier Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Gold, Platinum, Diamond"
                className="bg-[#0a0a0a] border-[#262626]"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[#A1A1AA]">Short Description</Label>
              <Input
                value={form.shortDescription}
                onChange={(e) => setForm((f) => ({ ...f, shortDescription: e.target.value }))}
                placeholder="Brief one-liner"
                className="bg-[#0a0a0a] border-[#262626]"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[#A1A1AA]">Full Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Detailed tier description..."
                className="bg-[#0a0a0a] border-[#262626]"
                rows={3}
              />
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
                <Label className="text-[#A1A1AA]">Billing Cycle *</Label>
                <Select value={form.billingCycle} onValueChange={(val) => setForm((f) => ({ ...f, billingCycle: val }))}>
                  <SelectTrigger className="bg-[#0a0a0a] border-[#262626]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MEMBERSHIP_BILLING_CYCLES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[#A1A1AA]">Features (one per line)</Label>
              <Textarea
                value={form.features}
                onChange={(e) => setForm((f) => ({ ...f, features: e.target.value }))}
                placeholder="Priority booking access&#10;10% discount on all bookings&#10;Exclusive newsletter&#10;VIP event invitations"
                className="bg-[#0a0a0a] border-[#262626]"
                rows={5}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-[#A1A1AA]">Max Bookings/Month</Label>
                <Input
                  type="number"
                  min="0"
                  value={form.maxBookingsPerMonth}
                  onChange={(e) => setForm((f) => ({ ...f, maxBookingsPerMonth: e.target.value }))}
                  className="bg-[#0a0a0a] border-[#262626]"
                  placeholder="0 = unlimited"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#A1A1AA]">Discount %</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={form.discountPercent}
                  onChange={(e) => setForm((f) => ({ ...f, discountPercent: e.target.value }))}
                  className="bg-[#0a0a0a] border-[#262626]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-[#A1A1AA]">Accent Color</Label>
                <Input
                  type="color"
                  value={form.color}
                  onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                  className="bg-[#0a0a0a] border-[#262626] h-10 p-1"
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

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-[#A1A1AA]">Priority Support</Label>
                <Switch checked={form.prioritySupport} onCheckedChange={(val) => setForm((f) => ({ ...f, prioritySupport: val }))} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-[#A1A1AA]">Early Access</Label>
                <Switch checked={form.earlyAccess} onCheckedChange={(val) => setForm((f) => ({ ...f, earlyAccess: val }))} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-[#A1A1AA]">Exclusive Content</Label>
                <Switch checked={form.exclusiveContent} onCheckedChange={(val) => setForm((f) => ({ ...f, exclusiveContent: val }))} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-[#A1A1AA]">Active</Label>
                <Switch checked={form.isActive} onCheckedChange={(val) => setForm((f) => ({ ...f, isActive: val }))} />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)} className="border-[#262626]">
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-[#C9A96E] hover:bg-[#D4B87A] text-black">
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingTier ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ Delete Confirmation ═══ */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm bg-[#111111] border-[#262626]">
          <DialogHeader>
            <DialogTitle className="text-[#FAFAFA]">Delete Tier</DialogTitle>
            <DialogDescription className="text-[#71717A]">
              Are you sure you want to delete &quot;{deleteConfirm?.name}&quot;? This action cannot be undone.
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
