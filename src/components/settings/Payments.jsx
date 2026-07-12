import IconButton from "../layout-components/Buttons/IconButton";
import TagButton from "../layout-components/Buttons/TagButton";
import TextButton from "../layout-components/Buttons/TextButtons";
import UpdateBankModal from "../layout-components/Events/UpdateBankModal";
import Modal from "../layout-components/Modal/Modal";
import Toggle from "../layout-components/Selectors/Toggle";
import Alert from "../layout-components/Alert";
import LoadingSpinner from "../layout-components/LoadingSpinner";
import { useAuthStore } from "@/stores/useAuthStore";
import { paymentApi } from "@/services/paymentApi";
import { useMutation } from "@tanstack/react-query";
import { AddCircle, Bank, RefreshCircle, TickCircle } from "iconsax-reactjs";
import { useState } from "react";

function Payments() {
  const { setUser, user } = useAuthStore();
  const [eventFeesPaidBy, setEventFeesPaidBy] = useState(
    user.preferences?.eventFeesPaidBy || "host"
  );
  const [bankAccount, setBankAccount] = useState({
    bankName: user.bankDetails?.bankName || "",
    accountNumber: user.bankDetails?.accountNumber || "",
    accountName: user.bankDetails?.accountName || "",
    bankCode: user.bankDetails?.bankCode || "",
  });
  const [errorMessage, setErrorMessage] = useState("");

  const [saveStatus, setSaveStatus] = useState("idle");

  const { mutateAsync: updateBankDetails } = useMutation({
    mutationFn: data => paymentApi.updateUserBankDetails(data),
    onMutate: () => setSaveStatus("saving"),
    onSuccess: data => {
      // Update user in auth store with new bank details
      setUser({
        ...user,
        bankDetails: data.bankDetails,
        preferences: {
          ...user.preferences,
          eventFeesPaidBy: eventFeesPaidBy,
        },
      });
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    },
    onError: error => {
      setSaveStatus("idle");
      setErrorMessage(
        error.response?.data?.message || "Failed to update payment settings"
      );
    },
  });

  const handleUpdatePaymentSettings = () => {
    // Clear previous error message
    setErrorMessage("");
    // Update payment settings
    updateBankDetails({
      bankName: bankAccount.bankName,
      accountNumber: bankAccount.accountNumber,
      accountName: bankAccount.accountName,
      bankCode: bankAccount.bankCode,
      eventFeesPaidBy,
    });
  };

  return (
    <div className="satoshi">
      <div className="mb-6">
        <h1 className="paytone text-2xl leading-8 font-normal">Payments</h1>
        <p className="text-[#8A9191] text-xs font-medium">
          Your payment details will appear here
        </p>
      </div>
      {/* Bank Account */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-medium text-sm">Bank Account</h3>
          {/* Button to add or change bank account */}
          <Modal.Open opens="update-bank">
            <TagButton
              text={bankAccount.bankName ? "Change Account" : "Add Account"}
              variant="light-purple"
              className="satoshi"
              leftImg={
                bankAccount.bankName ? (
                  <RefreshCircle variant="outline" />
                ) : (
                  <AddCircle variant="outline" />
                )
              }
            />
          </Modal.Open>
        </div>
        {bankAccount.bankName ? (
          <div className="p-2 border border-white rounded-[12px] flex items-center justify-between bg-white">
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
                <p className="text-[#001010] text-sm capitalize">
                  {bankAccount.bankName}
                </p>
                <p className="text-[#8A9191] capitalize leading-3.5 text-[10px] sm:text-xs">
                  {bankAccount.accountName} | {bankAccount.accountNumber}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 border border-white rounded-[12px] flex flex-col items-center justify-center bg-gray-50">
            <Bank variant="Bold" color="#292D32" className="size-8 mb-2" />
            <p className="text-[#001010] text-sm font-medium text-center">
              No bank account added yet
            </p>
            <p className="text-[#8A9191] text-xs text-center mt-1">
              Add your bank details to receive payments
            </p>
          </div>
        )}
      </div>
      {/* Fee settings */}
      <div className="mt-3 flex justify-between items-start mb-6">
        <div>
          <h3 className="font-medium text-sm mb-1">Fees settings</h3>
          <p className="text-[#8A9191] text-xs font-medium">
            Shift the responsibility onto customers.
          </p>
        </div>
        <Toggle
          checked={eventFeesPaidBy === "guests"}
          onChange={() => {
            if (eventFeesPaidBy === "host") {
              setEventFeesPaidBy("guests");
            } else {
              setEventFeesPaidBy("host");
            }
          }}
        />
      </div>
      {/* Error Message */}
      {errorMessage && (
        <Alert type="error" title={errorMessage} className="mb-4" />
      )}
      {/* Save Button */}
      <TextButton
        text={
          saveStatus === "saving"
            ? "Saving..."
            : saveStatus === "saved"
              ? "Saved"
              : "Save Changes"
        }
        leftImg={
          saveStatus === "saving" ? (
            <LoadingSpinner />
          ) : saveStatus === "saved" ? (
            <TickCircle variant="Bold" />
          ) : undefined
        }
        disabled={saveStatus !== "idle"}
        variant={saveStatus === "saved" ? "secondary" : "primary"}
        className="transition-colors duration-300"
        onClick={handleUpdatePaymentSettings}
      />
      {/* Update Bank Modal */}
      <UpdateBankModal
        bankDetails={bankAccount}
        onSave={data => setBankAccount(data)}
      />
    </div>
  );
}

export default Payments;
