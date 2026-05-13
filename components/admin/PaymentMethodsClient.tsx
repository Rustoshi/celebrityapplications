"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CreditCard,
  Building2,
  Wallet,
  Bitcoin,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  GripVertical,
} from "lucide-react";
import { toast } from "sonner";

import { PAYMENT_METHOD_TYPES } from "@/lib/constants";
import {
  getPaymentMethods,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
  togglePaymentMethodStatus,
} from "@/lib/actions/admin/payment-methods";

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

interface PaymentMethodDetails {
  walletAddress?: string;
  network?: string;
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
  routingNumber?: string;
  swiftCode?: string;
  ibanNumber?: string;
  bankAddress?: string;
  email?: string;
  paypalLink?: string;
  acceptedBrands?: string[];
  redemptionInstructions?: string;
  [key: string]: unknown;
}

interface SerializedPaymentMethod {
  _id: string;
  type: string;
  label: string;
  instructions?: string;
  details: PaymentMethodDetails;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
}

interface PaymentMethodsClientProps {
  initialData: SerializedPaymentMethod[];
}

const getTypeIcon = (type: string) => {
  switch (type) {
    case "crypto":
      return Bitcoin;
    case "bank_transfer":
    case "wire_transfer":
      return Building2;
    case "paypal":
      return Wallet;
    default:
      return CreditCard;
  }
};

const getTypeLabel = (type: string) => {
  const found = PAYMENT_METHOD_TYPES.find((t) => t.value === type);
  return found?.label || type;
};

const getDetailPreview = (method: SerializedPaymentMethod) => {
  const { type, details } = method;
  switch (type) {
    case "crypto":
      return details.walletAddress
        ? `${details.walletAddress.slice(0, 12)}...${details.walletAddress.slice(-8)}`
        : "";
    case "bank_transfer":
    case "wire_transfer":
      return details.bankName || "";
    case "paypal":
      return details.email || "";
    case "credit_card":
    case "debit_card":
      return details.acceptedBrands?.join(", ") || "";
    default:
      return "";
  }
};

export default function PaymentMethodsClient({ initialData }: PaymentMethodsClientProps) {
  const router = useRouter();

  const [methods, setMethods] = useState(initialData);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [methodToDelete, setMethodToDelete] = useState<SerializedPaymentMethod | null>(null);
  const [editingMethod, setEditingMethod] = useState<SerializedPaymentMethod | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [formData, setFormData] = useState({
    type: "crypto",
    label: "",
    instructions: "",
    isActive: true,
    sortOrder: 0,
    details: {} as PaymentMethodDetails,
  });

  const resetForm = () => {
    setFormData({
      type: "crypto",
      label: "",
      instructions: "",
      isActive: true,
      sortOrder: methods.length,
      details: {},
    });
    setEditingMethod(null);
  };

  const openAddDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (method: SerializedPaymentMethod) => {
    setEditingMethod(method);
    setFormData({
      type: method.type,
      label: method.label,
      instructions: method.instructions || "",
      isActive: method.isActive,
      sortOrder: method.sortOrder,
      details: { ...method.details },
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    const data = {
      type: formData.type,
      label: formData.label,
      instructions: formData.instructions,
      isActive: formData.isActive,
      sortOrder: formData.sortOrder,
      details: formData.details,
    };

    let result;
    if (editingMethod) {
      result = await updatePaymentMethod(editingMethod._id, data);
    } else {
      result = await createPaymentMethod(data);
    }

    if (result.success) {
      toast.success(editingMethod ? "Payment method updated" : "Payment method created");
      setDialogOpen(false);
      resetForm();

      const refreshResult = await getPaymentMethods();
      if (refreshResult.success && refreshResult.data) {
        setMethods(refreshResult.data);
      }
      router.refresh();
    } else {
      toast.error(result.error || "Failed to save payment method");
    }

    setIsSubmitting(false);
  };

  const handleToggleStatus = async (method: SerializedPaymentMethod) => {
    setMethods((prev) =>
      prev.map((m) => (m._id === method._id ? { ...m, isActive: !m.isActive } : m))
    );

    const result = await togglePaymentMethodStatus(method._id);

    if (!result.success) {
      setMethods((prev) =>
        prev.map((m) => (m._id === method._id ? { ...m, isActive: method.isActive } : m))
      );
      toast.error(result.error || "Failed to toggle status");
    }
  };

  const handleDeleteClick = (method: SerializedPaymentMethod) => {
    setMethodToDelete(method);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!methodToDelete) return;

    setIsDeleting(true);
    const result = await deletePaymentMethod(methodToDelete._id);

    if (result.success) {
      toast.success("Payment method deleted");
      setMethods((prev) => prev.filter((m) => m._id !== methodToDelete._id));
      setDeleteDialogOpen(false);
      setMethodToDelete(null);
    } else {
      toast.error(result.error || "Failed to delete payment method");
    }

    setIsDeleting(false);
  };

  const updateDetail = (key: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      details: { ...prev.details, [key]: value },
    }));
  };

  const renderDetailFields = () => {
    switch (formData.type) {
      case "crypto":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="walletAddress">
                Wallet Address <span className="text-red-400">*</span>
              </Label>
              <Input
                id="walletAddress"
                value={(formData.details.walletAddress as string) || ""}
                onChange={(e) => updateDetail("walletAddress", e.target.value)}
                placeholder="0x..."
                className="bg-[#0a0a0a] border-[#262626]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="network">Network</Label>
              <Input
                id="network"
                value={(formData.details.network as string) || ""}
                onChange={(e) => updateDetail("network", e.target.value)}
                placeholder="e.g., Ethereum, Bitcoin, BSC"
                className="bg-[#0a0a0a] border-[#262626]"
              />
            </div>
          </>
        );

      case "bank_transfer":
      case "wire_transfer":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="bankName">
                Bank Name <span className="text-red-400">*</span>
              </Label>
              <Input
                id="bankName"
                value={(formData.details.bankName as string) || ""}
                onChange={(e) => updateDetail("bankName", e.target.value)}
                placeholder="e.g., Wells Fargo"
                className="bg-[#0a0a0a] border-[#262626]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="accountName">Account Name</Label>
              <Input
                id="accountName"
                value={(formData.details.accountName as string) || ""}
                onChange={(e) => updateDetail("accountName", e.target.value)}
                placeholder="Account holder name"
                className="bg-[#0a0a0a] border-[#262626]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="accountNumber">
                Account Number <span className="text-red-400">*</span>
              </Label>
              <Input
                id="accountNumber"
                value={(formData.details.accountNumber as string) || ""}
                onChange={(e) => updateDetail("accountNumber", e.target.value)}
                placeholder="Account number"
                className="bg-[#0a0a0a] border-[#262626]"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="routingNumber">Routing Number</Label>
                <Input
                  id="routingNumber"
                  value={(formData.details.routingNumber as string) || ""}
                  onChange={(e) => updateDetail("routingNumber", e.target.value)}
                  className="bg-[#0a0a0a] border-[#262626]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="swiftCode">Swift Code</Label>
                <Input
                  id="swiftCode"
                  value={(formData.details.swiftCode as string) || ""}
                  onChange={(e) => updateDetail("swiftCode", e.target.value)}
                  className="bg-[#0a0a0a] border-[#262626]"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ibanNumber">IBAN Number</Label>
              <Input
                id="ibanNumber"
                value={(formData.details.ibanNumber as string) || ""}
                onChange={(e) => updateDetail("ibanNumber", e.target.value)}
                className="bg-[#0a0a0a] border-[#262626]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bankAddress">Bank Address</Label>
              <Textarea
                id="bankAddress"
                value={(formData.details.bankAddress as string) || ""}
                onChange={(e) => updateDetail("bankAddress", e.target.value)}
                rows={2}
                className="bg-[#0a0a0a] border-[#262626] resize-none"
              />
            </div>
          </>
        );

      case "paypal":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="email">
                PayPal Email <span className="text-red-400">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={(formData.details.email as string) || ""}
                onChange={(e) => updateDetail("email", e.target.value)}
                placeholder="paypal@example.com"
                className="bg-[#0a0a0a] border-[#262626]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paypalLink">PayPal.me Link</Label>
              <Input
                id="paypalLink"
                value={(formData.details.paypalLink as string) || ""}
                onChange={(e) => updateDetail("paypalLink", e.target.value)}
                placeholder="https://paypal.me/yourname"
                className="bg-[#0a0a0a] border-[#262626]"
              />
            </div>
          </>
        );

      case "credit_card":
      case "debit_card":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="acceptedBrands">Accepted Brands (comma-separated)</Label>
              <Input
                id="acceptedBrands"
                value={
                  Array.isArray(formData.details.acceptedBrands)
                    ? formData.details.acceptedBrands.join(", ")
                    : ""
                }
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    details: {
                      ...prev.details,
                      acceptedBrands: e.target.value.split(",").map((s) => s.trim()),
                    },
                  }))
                }
                placeholder="Visa, Mastercard, Amex"
                className="bg-[#0a0a0a] border-[#262626]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="redemptionInstructions">Redemption Instructions</Label>
              <Textarea
                id="redemptionInstructions"
                value={(formData.details.redemptionInstructions as string) || ""}
                onChange={(e) => updateDetail("redemptionInstructions", e.target.value)}
                rows={3}
                className="bg-[#0a0a0a] border-[#262626] resize-none"
              />
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-2xl font-bold text-[#FAFAFA]">Payment Methods</h1>
          <Badge variant="outline" className="border-[#262626] text-[#A1A1AA]">
            {methods.length}
          </Badge>
        </div>
        <Button onClick={openAddDialog} className="bg-[#C9A96E] hover:bg-[#D4B87A] text-black">
          <Plus className="w-4 h-4 mr-2" />
          Add Payment Method
        </Button>
      </div>

      {/* Methods List */}
      {methods.length === 0 ? (
        <div className="bg-[#111111] border border-[#262626] rounded-lg p-12 text-center">
          <CreditCard className="w-12 h-12 mx-auto text-[#71717A] mb-4" />
          <h3 className="text-lg font-medium text-[#FAFAFA] mb-2">No payment methods</h3>
          <p className="text-sm text-[#71717A] mb-4">
            Add payment methods for clients to use when booking
          </p>
          <Button onClick={openAddDialog} className="bg-[#C9A96E] hover:bg-[#D4B87A] text-black">
            <Plus className="w-4 h-4 mr-2" />
            Add First Method
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {methods.map((method) => {
            const Icon = getTypeIcon(method.type);
            const preview = getDetailPreview(method);

            return (
              <div
                key={method._id}
                className="bg-[#111111] border border-[#262626] rounded-lg p-4 flex items-center gap-4"
              >
                <div className="text-[#71717A] cursor-grab">
                  <GripVertical className="w-5 h-5" />
                </div>

                <div className="w-12 h-12 rounded-lg bg-[#0a0a0a] flex items-center justify-center">
                  <Icon className="w-6 h-6 text-[#C9A96E]" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-[#FAFAFA]">{method.label}</h3>
                    <Badge variant="outline" className="border-[#262626] text-[#71717A] text-xs">
                      {getTypeLabel(method.type)}
                    </Badge>
                  </div>
                  {preview && (
                    <p className="text-sm text-[#71717A] truncate mt-0.5">{preview}</p>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={method.isActive}
                      onCheckedChange={() => handleToggleStatus(method)}
                    />
                    <span className="text-sm text-[#71717A]">
                      {method.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEditDialog(method)}
                    className="text-[#71717A] hover:text-[#FAFAFA]"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteClick(method)}
                    className="text-[#71717A] hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[#111111] border-[#262626] max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#FAFAFA]">
              {editingMethod ? "Edit Payment Method" : "Add Payment Method"}
            </DialogTitle>
            <DialogDescription className="text-[#A1A1AA]">
              {editingMethod
                ? "Update the payment method details below."
                : "Configure a new payment method for clients."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => {
                  setFormData((prev) => ({
                    ...prev,
                    type: value,
                    details: {},
                  }));
                }}
              >
                <SelectTrigger className="bg-[#0a0a0a] border-[#262626]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#111111] border-[#262626]">
                  {PAYMENT_METHOD_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="label">
                Label <span className="text-red-400">*</span>
              </Label>
              <Input
                id="label"
                value={formData.label}
                onChange={(e) => setFormData((prev) => ({ ...prev, label: e.target.value }))}
                placeholder="e.g., Bitcoin, Wells Fargo Bank"
                className="bg-[#0a0a0a] border-[#262626]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="instructions">Instructions</Label>
              <Textarea
                id="instructions"
                value={formData.instructions}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, instructions: e.target.value }))
                }
                placeholder="Payment instructions for clients..."
                rows={3}
                className="bg-[#0a0a0a] border-[#262626] resize-none"
              />
            </div>

            <div className="border-t border-[#262626] pt-4">
              <p className="text-sm font-medium text-[#A1A1AA] mb-3">
                {getTypeLabel(formData.type)} Details
              </p>
              {renderDetailFields()}
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, isActive: checked }))
                  }
                />
                <Label htmlFor="isActive" className="text-sm text-[#A1A1AA]">
                  Active
                </Label>
              </div>

              <div className="flex items-center gap-2">
                <Label htmlFor="sortOrder" className="text-sm text-[#A1A1AA]">
                  Sort Order
                </Label>
                <Input
                  id="sortOrder"
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, sortOrder: parseInt(e.target.value) || 0 }))
                  }
                  className="w-20 bg-[#0a0a0a] border-[#262626]"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              className="border-[#262626] hover:bg-[#1a1a1a]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !formData.label}
              className="bg-[#C9A96E] hover:bg-[#D4B87A] text-black"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : editingMethod ? (
                "Update"
              ) : (
                "Create"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-[#111111] border-[#262626]">
          <DialogHeader>
            <DialogTitle className="text-[#FAFAFA]">Delete Payment Method</DialogTitle>
            <DialogDescription className="text-[#A1A1AA]">
              Are you sure you want to delete{" "}
              <span className="font-medium text-[#FAFAFA]">{methodToDelete?.label}</span>? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              className="border-[#262626] hover:bg-[#1a1a1a]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
