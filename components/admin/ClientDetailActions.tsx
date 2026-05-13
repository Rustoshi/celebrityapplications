"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserCheck, UserX, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { toggleClientStatus, deleteClient } from "@/lib/actions/admin/clients";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface SerializedClientFull {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  status: string;
}

interface ClientDetailActionsProps {
  client: SerializedClientFull;
}

export default function ClientDetailActions({ client }: ClientDetailActionsProps) {
  const router = useRouter();

  const [isToggling, setIsToggling] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(client.status);

  const handleToggleStatus = async () => {
    const newStatus = currentStatus === "active" ? "suspended" : "active";

    setIsToggling(true);
    const result = await toggleClientStatus(client._id, newStatus);

    if (result.success) {
      setCurrentStatus(newStatus);
      toast.success(
        newStatus === "active" ? "Client activated" : "Client suspended"
      );
      router.refresh();
    } else {
      toast.error(result.error || "Failed to update status");
    }

    setIsToggling(false);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    const result = await deleteClient(client._id);

    if (result.success) {
      toast.success("Client deleted successfully");
      router.push("/admin/clients");
    } else {
      toast.error(result.error || "Failed to delete client");
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="bg-[#111111] border border-[#262626] rounded-lg p-6">
        <h2 className="text-sm font-medium text-[#71717A] mb-4">Actions</h2>
        <div className="space-y-3">
          <Button
            onClick={handleToggleStatus}
            disabled={isToggling}
            variant="outline"
            className={`w-full justify-start ${
              currentStatus === "active"
                ? "border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10"
                : "border-green-500/30 text-green-400 hover:bg-green-500/10"
            }`}
          >
            {isToggling ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : currentStatus === "active" ? (
              <UserX className="w-4 h-4 mr-2" />
            ) : (
              <UserCheck className="w-4 h-4 mr-2" />
            )}
            {currentStatus === "active" ? "Suspend Client" : "Activate Client"}
          </Button>

          <Button
            onClick={() => setDeleteDialogOpen(true)}
            variant="outline"
            className="w-full justify-start border-red-500/30 text-red-400 hover:bg-red-500/10"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Client
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-[#111111] border-[#262626]">
          <DialogHeader>
            <DialogTitle className="text-[#FAFAFA]">Delete Client</DialogTitle>
            <DialogDescription className="text-[#A1A1AA]">
              Are you sure you want to delete{" "}
              <span className="font-medium text-[#FAFAFA]">
                {client.firstName} {client.lastName}
              </span>
              ? This will also delete all their bookings. This action cannot be undone.
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
              onClick={handleDelete}
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
    </>
  );
}
