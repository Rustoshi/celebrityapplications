"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Mail,
  Search,
  ArrowLeft,
  Send,
  Trash2,
  Archive,
  MailOpen,
  MailCheck,
  Loader2,
  Phone,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

import { formatDateTime, truncateText } from "@/lib/utils";
import {
  getMessages,
  getMessageById,
  replyToMessage,
  updateMessageStatus,
  deleteMessage,
} from "@/lib/actions/admin/messages";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import StatusBadge from "@/components/admin/StatusBadge";

interface SerializedMessage {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: string;
  adminReply?: string;
  repliedAt?: string;
  createdAt: string;
}

interface MessagesClientProps {
  initialData: {
    data: SerializedMessage[];
    total: number;
    page: number;
    totalPages: number;
    hasMore: boolean;
  };
  initialFilters: {
    query: string;
    status: string;
    page: number;
  };
}

export default function MessagesClient({ initialData, initialFilters }: MessagesClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [data, setData] = useState(initialData);
  const [filters, setFilters] = useState(initialFilters);
  const [searchInput, setSearchInput] = useState(initialFilters.query);
  const [isLoading, setIsLoading] = useState(false);

  const [selectedMessage, setSelectedMessage] = useState<SerializedMessage | null>(null);
  const [isLoadingMessage, setIsLoadingMessage] = useState(false);
  const [showMobileDetail, setShowMobileDetail] = useState(false);

  const [replyText, setReplyText] = useState("");
  const [isSendingReply, setIsSendingReply] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<SerializedMessage | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchMessages = useCallback(async (newFilters: typeof filters) => {
    setIsLoading(true);
    try {
      const result = await getMessages({
        query: newFilters.query || undefined,
        status: newFilters.status !== "all" ? newFilters.status : undefined,
        page: newFilters.page,
      });

      if (result.success && result.data) {
        setData(result.data);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast.error("Failed to fetch messages");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateURL = useCallback(
    (newFilters: typeof filters) => {
      const params = new URLSearchParams();
      if (newFilters.query) params.set("query", newFilters.query);
      if (newFilters.status !== "all") params.set("status", newFilters.status);
      if (newFilters.page > 1) params.set("page", String(newFilters.page));

      const queryString = params.toString();
      router.push(`/admin/messages${queryString ? `?${queryString}` : ""}`, { scroll: false });
    },
    [router]
  );

  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchInput !== filters.query) {
        const newFilters = { ...filters, query: searchInput, page: 1 };
        setFilters(newFilters);
        updateURL(newFilters);
        fetchMessages(newFilters);
      }
    }, 400);

    return () => clearTimeout(handler);
  }, [searchInput, filters, updateURL, fetchMessages]);

  useEffect(() => {
    const query = searchParams.get("query") || "";
    const status = searchParams.get("status") || "all";
    const page = parseInt(searchParams.get("page") || "1", 10);

    const newFilters = { query, status, page };
    if (
      newFilters.query !== filters.query ||
      newFilters.status !== filters.status ||
      newFilters.page !== filters.page
    ) {
      setFilters(newFilters);
      setSearchInput(query);
      fetchMessages(newFilters);
    }
  }, [searchParams]);

  const handleFilterChange = (key: "status", value: string) => {
    const newFilters = { ...filters, [key]: value, page: 1 };
    setFilters(newFilters);
    updateURL(newFilters);
    fetchMessages(newFilters);
  };

  const handlePageChange = (newPage: number) => {
    const newFilters = { ...filters, page: newPage };
    setFilters(newFilters);
    updateURL(newFilters);
    fetchMessages(newFilters);
  };

  const handleSelectMessage = async (message: SerializedMessage) => {
    setIsLoadingMessage(true);
    setShowMobileDetail(true);

    const result = await getMessageById(message._id);

    if (result.success && result.data) {
      setSelectedMessage(result.data);
      setReplyText("");

      if (message.status === "unread") {
        setData((prev) => ({
          ...prev,
          data: prev.data.map((m) =>
            m._id === message._id ? { ...m, status: "read" } : m
          ),
        }));
      }
    } else {
      toast.error("Failed to load message");
    }

    setIsLoadingMessage(false);
  };

  const handleSendReply = async () => {
    if (!selectedMessage || !replyText.trim()) return;

    setIsSendingReply(true);
    const result = await replyToMessage(selectedMessage._id, replyText);

    if (result.success && result.data) {
      toast.success("Reply sent successfully");
      setSelectedMessage(result.data);
      setReplyText("");

      setData((prev) => ({
        ...prev,
        data: prev.data.map((m) =>
          m._id === selectedMessage._id ? { ...m, status: "replied" } : m
        ),
      }));
    } else {
      toast.error(result.error || "Failed to send reply");
    }

    setIsSendingReply(false);
  };

  const handleStatusChange = async (status: string) => {
    if (!selectedMessage) return;

    const result = await updateMessageStatus(selectedMessage._id, status);

    if (result.success && result.data) {
      toast.success("Status updated");
      setSelectedMessage(result.data);

      setData((prev) => ({
        ...prev,
        data: prev.data.map((m) =>
          m._id === selectedMessage._id ? { ...m, status } : m
        ),
      }));
    } else {
      toast.error(result.error || "Failed to update status");
    }
  };

  const handleDeleteClick = (message: SerializedMessage) => {
    setMessageToDelete(message);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!messageToDelete) return;

    setIsDeleting(true);
    const result = await deleteMessage(messageToDelete._id);

    if (result.success) {
      toast.success("Message deleted");
      setData((prev) => ({
        ...prev,
        data: prev.data.filter((m) => m._id !== messageToDelete._id),
        total: prev.total - 1,
      }));

      if (selectedMessage?._id === messageToDelete._id) {
        setSelectedMessage(null);
        setShowMobileDetail(false);
      }

      setDeleteDialogOpen(false);
      setMessageToDelete(null);
    } else {
      toast.error(result.error || "Failed to delete message");
    }

    setIsDeleting(false);
  };

  const getStatusDot = (status: string) => {
    switch (status) {
      case "unread":
        return "bg-blue-500";
      case "read":
        return "bg-gray-500";
      case "replied":
        return "bg-green-500";
      case "archived":
        return "bg-[#71717A]";
      default:
        return "bg-gray-500";
    }
  };

  const startIndex = (data.page - 1) * 12 + 1;
  const endIndex = Math.min(data.page * 12, data.total);

  return (
    <div className="h-[calc(100vh-8rem)]">
      {/* Mobile: Show either list or detail */}
      <div className="lg:hidden h-full">
        {showMobileDetail && selectedMessage ? (
          <div className="h-full flex flex-col bg-[#111111] border border-[#262626] rounded-lg">
            <div className="p-4 border-b border-[#262626] flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setShowMobileDetail(false);
                  setSelectedMessage(null);
                }}
                className="text-[#A1A1AA] hover:text-[#FAFAFA]"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h2 className="font-medium text-[#FAFAFA] truncate flex-1">
                {selectedMessage.subject}
              </h2>
            </div>
            <ScrollArea className="flex-1">
              <MessageDetail
                message={selectedMessage}
                replyText={replyText}
                setReplyText={setReplyText}
                onSendReply={handleSendReply}
                isSendingReply={isSendingReply}
                onStatusChange={handleStatusChange}
                onDelete={() => handleDeleteClick(selectedMessage)}
              />
            </ScrollArea>
          </div>
        ) : (
          <div className="h-full flex flex-col">
            <MessageList
              data={data}
              filters={filters}
              searchInput={searchInput}
              setSearchInput={setSearchInput}
              onFilterChange={handleFilterChange}
              onSelectMessage={handleSelectMessage}
              selectedMessageId={selectedMessage?._id}
              isLoading={isLoading}
              getStatusDot={getStatusDot}
              onPageChange={handlePageChange}
              startIndex={startIndex}
              endIndex={endIndex}
            />
          </div>
        )}
      </div>

      {/* Desktop: Split view */}
      <div className="hidden lg:grid lg:grid-cols-5 gap-6 h-full">
        {/* Left Panel - Message List */}
        <div className="col-span-2 flex flex-col">
          <MessageList
            data={data}
            filters={filters}
            searchInput={searchInput}
            setSearchInput={setSearchInput}
            onFilterChange={handleFilterChange}
            onSelectMessage={handleSelectMessage}
            selectedMessageId={selectedMessage?._id}
            isLoading={isLoading}
            getStatusDot={getStatusDot}
            onPageChange={handlePageChange}
            startIndex={startIndex}
            endIndex={endIndex}
          />
        </div>

        {/* Right Panel - Message Detail */}
        <div className="col-span-3 bg-[#111111] border border-[#262626] rounded-lg overflow-hidden">
          {isLoadingMessage ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-8 w-3/4 bg-[#1a1a1a]" />
              <Skeleton className="h-4 w-1/2 bg-[#1a1a1a]" />
              <Skeleton className="h-32 w-full bg-[#1a1a1a]" />
            </div>
          ) : selectedMessage ? (
            <ScrollArea className="h-full">
              <MessageDetail
                message={selectedMessage}
                replyText={replyText}
                setReplyText={setReplyText}
                onSendReply={handleSendReply}
                isSendingReply={isSendingReply}
                onStatusChange={handleStatusChange}
                onDelete={() => handleDeleteClick(selectedMessage)}
              />
            </ScrollArea>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <Mail className="w-12 h-12 mx-auto text-[#71717A] mb-4" />
                <p className="text-[#71717A]">Select a message to view</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-[#111111] border-[#262626]">
          <DialogHeader>
            <DialogTitle className="text-[#FAFAFA]">Delete Message</DialogTitle>
            <DialogDescription className="text-[#A1A1AA]">
              Are you sure you want to delete this message from{" "}
              <span className="font-medium text-[#FAFAFA]">{messageToDelete?.name}</span>? This
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

function MessageList({
  data,
  filters,
  searchInput,
  setSearchInput,
  onFilterChange,
  onSelectMessage,
  selectedMessageId,
  isLoading,
  getStatusDot,
  onPageChange,
  startIndex,
  endIndex,
}: {
  data: MessagesClientProps["initialData"];
  filters: MessagesClientProps["initialFilters"];
  searchInput: string;
  setSearchInput: (value: string) => void;
  onFilterChange: (key: "status", value: string) => void;
  onSelectMessage: (message: SerializedMessage) => void;
  selectedMessageId?: string;
  isLoading: boolean;
  getStatusDot: (status: string) => string;
  onPageChange: (page: number) => void;
  startIndex: number;
  endIndex: number;
}) {
  return (
    <>
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center gap-3 mb-4">
          <h1 className="font-display text-2xl font-bold text-[#FAFAFA]">Messages</h1>
          <Badge variant="outline" className="border-[#262626] text-[#A1A1AA]">
            {data.total}
          </Badge>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717A]" />
            <Input
              placeholder="Search messages..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-10 bg-[#0a0a0a] border-[#262626] focus:border-[#C9A96E]"
            />
          </div>
          <Select
            value={filters.status}
            onValueChange={(value) => onFilterChange("status", value)}
          >
            <SelectTrigger className="w-full sm:w-[140px] bg-[#0a0a0a] border-[#262626]">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent className="bg-[#111111] border-[#262626]">
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="unread">Unread</SelectItem>
              <SelectItem value="read">Read</SelectItem>
              <SelectItem value="replied">Replied</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Message List */}
      <div className="flex-1 bg-[#111111] border border-[#262626] rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="p-3 space-y-2">
                <Skeleton className="h-4 w-1/3 bg-[#1a1a1a]" />
                <Skeleton className="h-3 w-2/3 bg-[#1a1a1a]" />
                <Skeleton className="h-3 w-full bg-[#1a1a1a]" />
              </div>
            ))}
          </div>
        ) : data.data.length === 0 ? (
          <div className="p-8 text-center">
            <Mail className="w-10 h-10 mx-auto text-[#71717A] mb-3" />
            <p className="text-[#71717A]">No messages found</p>
          </div>
        ) : (
          <ScrollArea className="h-[calc(100vh-20rem)]">
            <div className="divide-y divide-[#262626]">
              {data.data.map((message) => (
                <button
                  key={message._id}
                  onClick={() => onSelectMessage(message)}
                  className={`w-full text-left p-4 hover:bg-[#0a0a0a]/50 transition-colors ${
                    selectedMessageId === message._id ? "bg-[#0a0a0a]" : ""
                  } ${message.status === "unread" ? "border-l-2 border-[#C9A96E]" : ""}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-2 ${getStatusDot(message.status)}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="font-medium text-[#FAFAFA] truncate">{message.name}</p>
                        <span className="text-xs text-[#71717A] whitespace-nowrap">
                          {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm text-[#A1A1AA] truncate mb-1">{message.subject}</p>
                      <p className="text-xs text-[#71717A] line-clamp-2">
                        {truncateText(message.message, 80)}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Pagination */}
      {data.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-[#71717A]">
            {startIndex}-{endIndex} of {data.total}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(data.page - 1)}
              disabled={data.page <= 1 || isLoading}
              className="border-[#262626] hover:bg-[#1a1a1a] h-8 text-xs"
            >
              Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(data.page + 1)}
              disabled={!data.hasMore || isLoading}
              className="border-[#262626] hover:bg-[#1a1a1a] h-8 text-xs"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

function MessageDetail({
  message,
  replyText,
  setReplyText,
  onSendReply,
  isSendingReply,
  onStatusChange,
  onDelete,
}: {
  message: SerializedMessage;
  replyText: string;
  setReplyText: (value: string) => void;
  onSendReply: () => void;
  isSendingReply: boolean;
  onStatusChange: (status: string) => void;
  onDelete: () => void;
}) {
  return (
    <div className="p-6 space-y-6">
      {/* Sender Info */}
      <div>
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-semibold text-[#FAFAFA] mb-1">{message.subject}</h2>
            <div className="flex items-center gap-2 text-sm text-[#A1A1AA]">
              <span>{message.name}</span>
              <span className="text-[#71717A]">•</span>
              <a href={`mailto:${message.email}`} className="text-[#C9A96E] hover:underline">
                {message.email}
              </a>
            </div>
            {message.phone && (
              <div className="flex items-center gap-1 text-sm text-[#71717A] mt-1">
                <Phone className="w-3 h-3" />
                {message.phone}
              </div>
            )}
          </div>
          <StatusBadge status={message.status} type="message" />
        </div>

        <p className="text-xs text-[#71717A]">Received {formatDateTime(message.createdAt)}</p>
      </div>

      {/* Message Body */}
      <div className="bg-[#0a0a0a] border border-[#262626] rounded-lg p-4">
        <p className="text-[#FAFAFA] whitespace-pre-wrap">{message.message}</p>
      </div>

      {/* Admin Reply Section */}
      {message.adminReply ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <MailCheck className="w-4 h-4 text-green-500" />
            <span className="text-sm font-medium text-green-400">Your Reply</span>
            {message.repliedAt && (
              <span className="text-xs text-[#71717A]">
                {formatDateTime(message.repliedAt)}
              </span>
            )}
          </div>
          <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-4">
            <p className="text-[#FAFAFA] whitespace-pre-wrap">{message.adminReply}</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <label className="text-sm font-medium text-[#A1A1AA]">Reply</label>
          <Textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Type your reply..."
            rows={4}
            className="bg-[#0a0a0a] border-[#262626] resize-none"
          />
          <Button
            onClick={onSendReply}
            disabled={isSendingReply || !replyText.trim()}
            className="bg-[#C9A96E] hover:bg-[#D4B87A] text-black"
          >
            {isSendingReply ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send Reply
              </>
            )}
          </Button>
        </div>
      )}

      {/* Action Buttons */}
      <div className="pt-4 border-t border-[#262626] flex flex-wrap gap-2">
        {message.status !== "unread" && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onStatusChange("unread")}
            className="border-[#262626] hover:bg-[#1a1a1a]"
          >
            <Mail className="w-4 h-4 mr-2" />
            Mark Unread
          </Button>
        )}
        {message.status === "unread" && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onStatusChange("read")}
            className="border-[#262626] hover:bg-[#1a1a1a]"
          >
            <MailOpen className="w-4 h-4 mr-2" />
            Mark Read
          </Button>
        )}
        {message.status !== "archived" && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onStatusChange("archived")}
            className="border-[#262626] hover:bg-[#1a1a1a]"
          >
            <Archive className="w-4 h-4 mr-2" />
            Archive
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={onDelete}
          className="border-red-500/30 text-red-400 hover:bg-red-500/10"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Delete
        </Button>
      </div>
    </div>
  );
}
