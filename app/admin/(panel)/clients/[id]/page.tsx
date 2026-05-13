import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Building2,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  ExternalLink,
} from "lucide-react";

import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { BOOKING_TYPES } from "@/lib/constants";
import { getClientById, getClientBookings } from "@/lib/actions/admin/clients";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import StatusBadge from "@/components/admin/StatusBadge";
import ClientDetailActions from "@/components/admin/ClientDetailActions";
import { adminPageTitle } from "@/lib/site-config";

export const metadata = {
  title: adminPageTitle("Client Details"),
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ClientDetailPage({ params }: PageProps) {
  const { id } = await params;

  const [clientResult, bookingsResult] = await Promise.all([
    getClientById(id),
    getClientBookings(id),
  ]);

  if (!clientResult.success || !clientResult.data) {
    notFound();
  }

  const client = clientResult.data;
  const bookings = bookingsResult.success && bookingsResult.data ? bookingsResult.data : [];

  const getTypeLabel = (value: string) => {
    const type = BOOKING_TYPES.find((t) => t.value === value);
    return type?.label || value;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link href="/admin/clients">
          <Button
            variant="ghost"
            size="icon"
            className="text-[#A1A1AA] hover:text-[#FAFAFA]"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1 flex items-start gap-4">
          <Avatar className="w-16 h-16">
            <AvatarImage src={client.avatar} />
            <AvatarFallback className="bg-[#1a1a1a] text-[#C9A96E] text-xl">
              {client.firstName.charAt(0)}
              {client.lastName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-[#FAFAFA]">
                {client.firstName} {client.lastName}
              </h1>
              <StatusBadge status={client.status} type="user" />
            </div>
            <p className="text-[#71717A]">{client.email}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Info Card */}
          <div className="bg-[#111111] border border-[#262626] rounded-lg p-6">
            <h2 className="text-sm font-medium text-[#71717A] mb-4">Contact Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#0a0a0a] flex items-center justify-center">
                  <Mail className="w-4 h-4 text-[#71717A]" />
                </div>
                <div>
                  <p className="text-xs text-[#71717A]">Email</p>
                  <p className="text-sm text-[#FAFAFA]">{client.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#0a0a0a] flex items-center justify-center">
                  <Phone className="w-4 h-4 text-[#71717A]" />
                </div>
                <div>
                  <p className="text-xs text-[#71717A]">Phone</p>
                  <p className="text-sm text-[#FAFAFA]">{client.phone || "—"}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#0a0a0a] flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-[#71717A]" />
                </div>
                <div>
                  <p className="text-xs text-[#71717A]">Location</p>
                  <p className="text-sm text-[#FAFAFA]">
                    {[client.city, client.country].filter(Boolean).join(", ") || "—"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#0a0a0a] flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-[#71717A]" />
                </div>
                <div>
                  <p className="text-xs text-[#71717A]">Company</p>
                  <p className="text-sm text-[#FAFAFA]">{client.company || "—"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Account Info Card */}
          <div className="bg-[#111111] border border-[#262626] rounded-lg p-6">
            <h2 className="text-sm font-medium text-[#71717A] mb-4">Account Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#0a0a0a] flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-[#71717A]" />
                </div>
                <div>
                  <p className="text-xs text-[#71717A]">Member Since</p>
                  <p className="text-sm text-[#FAFAFA]">{formatDate(client.createdAt)}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#0a0a0a] flex items-center justify-center">
                  <Clock className="w-4 h-4 text-[#71717A]" />
                </div>
                <div>
                  <p className="text-xs text-[#71717A]">Last Login</p>
                  <p className="text-sm text-[#FAFAFA]">
                    {client.lastLoginAt ? formatDateTime(client.lastLoginAt) : "Never"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#0a0a0a] flex items-center justify-center">
                  {client.emailVerified ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500" />
                  )}
                </div>
                <div>
                  <p className="text-xs text-[#71717A]">Email Verified</p>
                  <p className="text-sm text-[#FAFAFA]">
                    {client.emailVerified ? "Yes" : "No"}
                  </p>
                </div>
              </div>

              {client.gender && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#0a0a0a] flex items-center justify-center">
                    <span className="text-sm text-[#71717A]">👤</span>
                  </div>
                  <div>
                    <p className="text-xs text-[#71717A]">Gender</p>
                    <p className="text-sm text-[#FAFAFA] capitalize">
                      {client.gender.replace(/_/g, " ")}
                    </p>
                  </div>
                </div>
              )}

              {client.dateOfBirth && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#0a0a0a] flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-[#71717A]" />
                  </div>
                  <div>
                    <p className="text-xs text-[#71717A]">Date of Birth</p>
                    <p className="text-sm text-[#FAFAFA]">
                      {formatDate(client.dateOfBirth)}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {client.bio && (
              <div className="mt-4 pt-4 border-t border-[#262626]">
                <p className="text-xs text-[#71717A] mb-1">Bio</p>
                <p className="text-sm text-[#FAFAFA]">{client.bio}</p>
              </div>
            )}
          </div>

          {/* Booking History */}
          <div className="bg-[#111111] border border-[#262626] rounded-lg overflow-hidden">
            <div className="p-4 border-b border-[#262626]">
              <h2 className="font-medium text-[#FAFAFA]">Booking History</h2>
              <p className="text-sm text-[#71717A]">{bookings.length} bookings</p>
            </div>

            {bookings.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-[#71717A]">No bookings yet</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-[#262626] hover:bg-transparent">
                    <TableHead className="text-[#A1A1AA]">Booking ID</TableHead>
                    <TableHead className="text-[#A1A1AA]">Celebrity</TableHead>
                    <TableHead className="text-[#A1A1AA]">Type</TableHead>
                    <TableHead className="text-[#A1A1AA]">Status</TableHead>
                    <TableHead className="text-[#A1A1AA]">Amount</TableHead>
                    <TableHead className="text-[#A1A1AA]">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.map((booking) => (
                    <TableRow
                      key={booking._id}
                      className="border-[#262626] hover:bg-[#0a0a0a]/50"
                    >
                      <TableCell>
                        <Link
                          href={`/admin/bookings/${booking._id}`}
                          className="font-mono text-sm text-[#C9A96E] hover:underline"
                        >
                          {booking.bookingId}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {booking.celebrity ? (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full overflow-hidden bg-[#1a1a1a] flex items-center justify-center">
                              {booking.celebrity.profileImage?.url ? (
                                <Image
                                  src={booking.celebrity.profileImage.url}
                                  alt={booking.celebrity.name}
                                  width={24}
                                  height={24}
                                  className="object-cover w-full h-full"
                                />
                              ) : (
                                <span className="text-[8px] text-[#C9A96E]">
                                  {booking.celebrity.name.charAt(0)}
                                </span>
                              )}
                            </div>
                            <span className="text-sm text-[#FAFAFA]">
                              {booking.celebrity.name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[#71717A]">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-[#A1A1AA]">
                          {getTypeLabel(booking.type)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={booking.status} type="booking" />
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium text-[#C9A96E]">
                          {formatCurrency(booking.amount)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-[#71717A]">
                          {formatDate(booking.createdAt)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>

        {/* Right Column - Stats & Actions */}
        <div className="space-y-6">
          {/* Stats Card */}
          <div className="bg-[#111111] border border-[#262626] rounded-lg p-6">
            <h2 className="text-sm font-medium text-[#71717A] mb-4">Statistics</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#A1A1AA]">Total Bookings</span>
                <span className="text-lg font-bold text-[#FAFAFA]">
                  {client.totalBookings}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#A1A1AA]">Total Spent</span>
                <span className="text-lg font-bold text-[#C9A96E]">
                  {formatCurrency(client.totalSpent)}
                </span>
              </div>
            </div>
          </div>

          {/* Actions Card */}
          <ClientDetailActions client={client} />
        </div>
      </div>
    </div>
  );
}
