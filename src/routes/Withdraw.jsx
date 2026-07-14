import ToggleBalance from "@/components/manage-event/ToggleBalance";
import Tooltip from "@/components/layout-components/Tooltip";
import IconButton from "@/components/layout-components/Buttons/IconButton";
import TagButton from "@/components/layout-components/Buttons/TagButton";
import TextButton from "@/components/layout-components/Buttons/TextButtons";
import WithdrawModal from "@/components/manage-event/WithdrawModal";
import UpdateBankModal from "@/components/layout-components/Events/UpdateBankModal";
import Modal from "@/components/layout-components/Modal/Modal";
import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Navigate, useParams } from "react-router";
import { Bank, InfoCircle, RefreshCircle } from "iconsax-reactjs";
import { paymentApi } from "@/services/paymentApi";
import { useManageEventContext } from "@/layouts/ManageEventLayout";
import { useModalContext } from "@/components/layout-components/Modal/ModalContext";

function Withdraw() {
  const { slug: eventId } = useParams();
  const { event } = useManageEventContext();
  const [withdrawalAmount, setWithdrawalAmount] = useState(0);
  const [balance, setBalance] = useState(0);
  const { setActive } = useModalContext();

  // Fetch event data and store it in the event store
  const { data: eventData, isLoading: loading } = useQuery({
    queryKey: ["eventBalance", eventId],
    queryFn: () => paymentApi.getEventBalance(eventId),
    staleTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    gcTime: 30 * 60 * 1000,
  });

  const [bankDetails, setBankDetails] = useState(null);

  useEffect(() => {
    // Update bank details when event data is fetched
    if (eventData) {
      setBankDetails(eventData.bankDetails);
      setBalance(eventData.balance);
    }
  }, [eventData]);

  const handlePercentageClick = percentage => {
    const amount = Math.floor((percentage / 100) * balance);
    setWithdrawalAmount(amount);
  };

  const handleMaxClick = () => {
    setWithdrawalAmount(balance);
  };

  const handleAmountChange = e => {
    let value = e.target.value.replace(/[^\d]/g, "");
    // Remove leading zeros but keep at least one "0"
    value = value.replace(/^0+/, "") || "0";
    setWithdrawalAmount(value);
  };

  const handleContinue = () => {
    if (!(withdrawalAmount > 0 && withdrawalAmount <= balance)) {
      return;
    }
    setActive("withdrawal-confirm");
  };

  if (!loading && event && !event.chipInDetails) {
    return <Navigate to={`/manage/${event.slug}`} replace />;
  }

  return (
    <main className="bg-[#F0F0F0] h-full relative flex-1 flex flex-col pt-6 w-full pb-10">
      <div className="max-w-[982px] w-full mx-auto flex">
        <div className="flex flex-col gap-2 w-full">
          <h3 className="font-bold satoshi text-[#001010]">Withdraw</h3>
          <div className="p-6 border w-full flex flex-col border-white rounded-4xl bg-white/50">
            {loading ? (
              /* Loading skeleton */
              <div className="animate-pulse">
                {/* Available balance skeleton */}
                <div className="flex sm:flex-1 flex-col mb-2">
                  <div className="flex items-center gap-1 mb-2">
                    <div className="h-4 w-4 bg-gray-200 rounded-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                  </div>
                  <div className="h-8 bg-gray-200 rounded w-40"></div>
                </div>
                {/* Bank details skeleton */}
                <div className="satoshi mb-6 sm:mb-8 mt-4">
                  <div className="flex justify-between items-center gap-4 mb-1">
                    <div className="h-4 bg-gray-200 rounded w-28"></div>
                    <div className="h-8 bg-gray-200 rounded-full w-32 sm:hidden"></div>
                  </div>
                  <div className="px-2 py-3 border border-white rounded-[12px] flex items-center justify-between bg-[#F0F0F0]/90">
                    <div className="flex items-center gap-2">
                      <div className="size-6 sm:size-9 bg-gray-200 rounded-lg"></div>
                      <div className="flex flex-col gap-1">
                        <div className="h-4 bg-gray-200 rounded w-20"></div>
                        <div className="h-3 bg-gray-200 rounded w-32"></div>
                      </div>
                    </div>
                    <div className="h-9 bg-gray-200 rounded-full w-36 hidden sm:block"></div>
                  </div>
                </div>

                {/* Amount input skeleton */}
                <div className="satoshi font-bold">
                  <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                  <div className="h-16 sm:h-24 bg-gray-200 rounded w-full mb-4"></div>
                  <div className="flex flex-col sm:justify-between sm:items-center sm:flex-row gap-x-4 gap-y-6">
                    <div className="flex items-center gap-x-4 gap-y-2 flex-wrap">
                      {[1, 2, 3, 4, 5].map(i => (
                        <div
                          key={i}
                          className="h-9 bg-gray-200 rounded-full w-16"
                        ></div>
                      ))}
                    </div>
                    <div className="h-11 w-full sm:w-28 bg-gray-200 rounded-full"></div>
                  </div>
                </div>
              </div>
            ) : (
              <React.Fragment>
                {/* Available balance */}
                <div className="flex sm:flex-1 flex-col mb-2">
                  <div className="flex items-center gap-1">
                    <Tooltip
                      content="Your funds are safe. Payments are released 2 days after they're received due to standard settlement by our payment partner."
                      placement="right"
                      defaultPlacement="right"
                    >
                      <InfoCircle
                        variant="Bold"
                        className="text-[#8A9191]"
                        size={16}
                      />
                    </Tooltip>
                    <h3 className="satoshi font-bold text-[#8A96A3] text-xs sm:text-sm">
                      Available Payout
                    </h3>
                  </div>
                  <ToggleBalance balance={balance} />
                </div>
                {/* Withdrawal bank */}
                <div className="satoshi mb-6 sm:mb-8">
                  <div className="flex justify-between items-center gap-4 mb-1 sm:mb-0">
                    <p className="text-xs sm:text-sm text-[#8A96A3] font-bold">
                      Withdrawing to
                    </p>
                    <Modal.Open opens="update-bank">
                      <TagButton
                        leftImg={<RefreshCircle size={12} />}
                        text="Change Account"
                        className="satoshi min-w-0 px-1 sm:hidden"
                        size="sm"
                        variant="light-purple"
                      />
                    </Modal.Open>
                  </div>
                  <div className="px-2 py-3 border border-white rounded-[12px] flex items-center justify-between bg-[#F0F0F0]/90">
                    <div className="flex items-center gap-2">
                      {/* Bank icon */}
                      <IconButton
                        variant="tertiary"
                        className="pointer-events-none size-6 sm:size-9"
                        icon={
                          <Bank
                            variant="Bold"
                            color="#292D32"
                            className="sm:size-6 size-4"
                          />
                        }
                      />
                      {/* Bank details */}
                      <div className="font-medium">
                        <p className="text-[#001010] text-sm">
                          {bankDetails?.bankName}
                        </p>
                        <p className="text-[#8A9191] capitalize leading-3.5 text-[10px] sm:text-xs">
                          {bankDetails?.accountName} |{" "}
                          {bankDetails?.accountNumber}
                        </p>
                      </div>
                    </div>
                    {/* Change account button for larger screens */}
                    <Modal.Open opens="update-bank">
                      <TagButton
                        leftImg={<RefreshCircle size={16} />}
                        text="Change Account"
                        className="satoshi min-w-0 px-2 hidden sm:inline-flex"
                        size="lg"
                        variant="light-purple"
                      />
                    </Modal.Open>
                  </div>
                </div>
                {/* Withdrawal amount */}
                <div className="satoshi font-bold text-[#001010]">
                  <p className="text-sm text-[#8A96A3] ">Enter Amount</p>
                  <div className="flex mb-4 gap-2 sm:gap-4 items-center text-[48px] sm:text-[72px] sm:leading-24.5 leading-16.5">
                    <span>₦</span>
                    <input
                      type="number"
                      value={withdrawalAmount}
                      onChange={handleAmountChange}
                      min={0}
                      max={balance}
                      disabled={!eventData || balance === 0}
                      className="min-w-0 outline-0 flex-1 border-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-moz-number-spin-box]:hidden"
                    />
                  </div>
                  <div className="flex flex-col sm:justify-between  sm:items-center sm:flex-row gap-x-4 gap-y-6">
                    {/* Amount buttons */}
                    <ul className="flex items-center gap-x-4 gap-y-2 flex-wrap">
                      <TagButton
                        text="10%"
                        variant="tertiary"
                        className="px-2 min-w-0 satoshi"
                        size="lg"
                        onClick={() => handlePercentageClick(10)}
                      />
                      <TagButton
                        text="25%"
                        variant="tertiary"
                        className="px-2 min-w-0 satoshi"
                        size="lg"
                        onClick={() => handlePercentageClick(25)}
                      />
                      <TagButton
                        text="50%"
                        variant="tertiary"
                        className="px-2 min-w-0 satoshi"
                        size="lg"
                        onClick={() => handlePercentageClick(50)}
                      />
                      <TagButton
                        text="75%"
                        variant="tertiary"
                        className="px-2 min-w-0 satoshi"
                        size="lg"
                        onClick={() => handlePercentageClick(75)}
                      />
                      <TagButton
                        text="MAX"
                        variant="tertiary"
                        className="px-2 min-w-0 satoshi"
                        size="lg"
                        onClick={handleMaxClick}
                      />
                    </ul>
                    {/* Withdraw button */}
                    <TextButton
                      text="Continue"
                      className="w-full sm:w-auto"
                      onClick={handleContinue}
                    />
                  </div>
                </div>
              </React.Fragment>
            )}
          </div>
        </div>
      </div>
      <WithdrawModal
        withdrawDetails={{
          withdrawalAmount,
          eventId: event?.id,
          feeResponsibility: event?.feeResponsibility || "host", // Default to host if not provided
          ...bankDetails,
        }}
      />
      <UpdateBankModal
        bankDetails={bankDetails}
        onSave={data => setBankDetails(data)}
      />
    </main>
  );
}

export default Withdraw;
