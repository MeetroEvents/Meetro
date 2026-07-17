import TextButton from "@/components/layout-components/Buttons/TextButtons";
import React, { useEffect } from "react";
import LoadingSpinner from "@/components/layout-components/LoadingSpinner";
import { CloseCircle, TickCircle } from "iconsax-reactjs";
import { formatNaira } from "../lib/utils";

function formatPaymentDate(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatLocation(location) {
  if (!location || typeof location !== "object") {
    return "";
  }

  const parts = [location.venue, location.city, location.state]
    .filter(Boolean)
    .map(value => String(value).trim());

  return parts.join(", ");
}
import { useNavigate, useSearchParams } from "react-router";
import { paymentApi } from "../services/paymentApi";
import { useQuery, useQueryClient } from "@tanstack/react-query";

function normalizeVerificationData(response) {
  const payload = response?.data ?? response;
  const data = payload?.data ?? payload;

  if (!data || typeof data !== "object") {
    return null;
  }

  const paymentType = String(
    data.type || data.paymentType || payload.paymentType || "ticket"
  ).toLowerCase();

  const normalizedPaymentType =
    paymentType === "chipin" ? "chip-in" : paymentType;

  const statusValue = String(data.status || payload.status || "").toLowerCase();
  const isSuccessful =
    statusValue === "success" ||
    statusValue === "completed" ||
    data.success === true ||
    payload.success === true ||
    data.paymentStatus === "success";

  return {
    eventName:
      data.event?.title || data.eventName || data.event?.name || "Your event",
    date: formatPaymentDate(
      data.createdAt || data.date || data.eventDate || data.paymentDate || ""
    ),
    location: formatLocation(data.event?.location || data.location),
    amount: Number(data.amount || data.totalAmount || data.paidAmount || 0),
    guest:
      data.user?.fullName ||
      `${data.userId.firstName} ${data.userId.lastName}` ||
      "Guest",
    paymentType: normalizedPaymentType,
    status: isSuccessful ? "success" : "failed",
    message:
      data.message ||
      payload.message ||
      (isSuccessful
        ? "Your payment was completed successfully."
        : "We could not complete your payment. Please try again."),
    eventSlug: data.event?.slug || data.eventSlug || data.slug || "",
  };
}

export default function VerifyPayment() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const reference = searchParams.get("reference") || searchParams.get("trxref");

  const {
    data: verificationResponse,
    isPending,
    error,
  } = useQuery({
    queryKey: ["verify-payment", reference],
    queryFn: () => paymentApi.verifyPayment(reference),
    enabled: Boolean(reference),
    retry: false,
  });

  const transaction = normalizeVerificationData(verificationResponse);
  useEffect(() => {
    if (transaction?.status === "success") {
      queryClient.invalidateQueries({ queryKey: ["event"] });
      queryClient.invalidateQueries({ queryKey: ["user-events"] });
      queryClient.invalidateQueries({ queryKey: ["userEventsCount"] });
    }
  }, [queryClient, transaction?.status]);

  const isLoading = isPending && Boolean(reference);
  const isSuccess = transaction?.status === "success";
  const isTicketPayment = transaction?.paymentType === "ticket";
  const isChipInPayment = transaction?.paymentType === "chip-in";
  const userLabel = "Guest";
  const statusLabel = "Going";
  const errorMessage =
    error?.response?.data?.message ||
    error?.message ||
    (reference
      ? "We could not verify this payment at the moment."
      : "We could not verify this payment because no reference was provided.");

  return (
    <main>
      <div className="flex flex-col justify-center min-h-dvh bg-[#FFFFFE] px-4">
        <div className="satoshi shadow-[0px_4px_24px_0px_#028E4B1A] bg-white p-6 rounded-[32px] font-bold text-sm max-w-[432px] w-full mx-auto">
          <div className="flex pb-4 border-b border-b-[#E2E2E2] flex-col items-center text-center">
            {isLoading ? (
              <React.Fragment>
                <LoadingSpinner size={48} borderColor="border-[#61B42D]" />
                <p className="text-base mt-3">Verifying your payment...</p>
              </React.Fragment>
            ) : isSuccess ? (
              <React.Fragment>
                <TickCircle size="48" color="#7CE63A" variant="Bold" />
                <p className="text-base">Successful payment</p>
              </React.Fragment>
            ) : (
              <React.Fragment>
                <CloseCircle size="48" color="#DB2863" variant="Bold" />
                <p className="text-base">Payment Failed</p>
              </React.Fragment>
            )}
          </div>

          {!isLoading && !transaction && (
            <div className="pt-4 text-center text-[#8A96A3]">
              <p>{errorMessage}</p>
            </div>
          )}

          {transaction && (
            <React.Fragment>
              <div className="flex flex-col border-b border-b-[#E2E2E2] items-center text-center gap-2 py-4">
                <h3 className="text-[20px] leading-7.5 font-bold">
                  {transaction.eventName}
                </h3>
                {transaction.date && (
                  <p className="text-[#8A9191] font-medium text-sm">
                    {transaction.date}
                  </p>
                )}
                {transaction.location && (
                  <p className="text-[#8A9191] font-medium text-sm">
                    {transaction.location}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-4 py-4 border-b border-b-[#E2E2E2]">
                <div className="flex justify-between font-bold text-sm">
                  <span className="text-[#8A96A3]">{userLabel}</span>
                  <span className="font-bold">{transaction.guest}</span>
                </div>
                <div className="flex justify-between font-bold text-sm">
                  <span className="text-[#8A96A3]">Status</span>
                  <span className="font-bold">
                    {isSuccess ? statusLabel : "Failed"}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-sm">
                  <span className="text-[#8A96A3]">Amount</span>
                  <span className="font-bold">
                    {formatNaira(transaction.amount)}
                  </span>
                </div>
              </div>

              <div className="pt-4 text-center text-sm font-medium text-[#8A96A3]">
                <p>{transaction.message}</p>
              </div>
            </React.Fragment>
          )}

          <div className="flex gap-4 justify-center items-center pt-6 flex-wrap">
            {isSuccess && isTicketPayment ? (
              <>
                <TextButton
                  variant="tertiary"
                  text="View Ticket"
                  onClick={() => {
                    if (transaction?.eventSlug) {
                      navigate(`/events/${transaction.eventSlug}`);
                      return;
                    }
                    navigate("/home");
                  }}
                />
                <TextButton
                  text="Download Ticket"
                  onClick={() => navigate("/home")}
                />
              </>
            ) : isSuccess && isChipInPayment ? (
              <>
                <TextButton
                  variant="tertiary"
                  text="View Event"
                  onClick={() => {
                    if (transaction?.eventSlug) {
                      navigate(`/events/${transaction.eventSlug}`);
                      return;
                    }
                    navigate("/home");
                  }}
                />
                <TextButton
                  text="Back Home"
                  onClick={() => navigate("/home")}
                />
              </>
            ) : (
              <TextButton text="Back Home" onClick={() => navigate("/")} />
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
