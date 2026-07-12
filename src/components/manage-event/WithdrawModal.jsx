import {
  calculateFee,
  formatCurrency,
  formatDate,
  formatNaira,
} from "@/lib/utils";
import { paymentApi } from "@/services/paymentApi";
import { useMutation } from "@tanstack/react-query";
import { CloseCircle, ReceiveSquare2, TickCircle } from "iconsax-reactjs";
import { useState } from "react";
import { Link } from "react-router";
import IconButton from "../layout-components/Buttons/IconButton";
import TextButton from "../layout-components/Buttons/TextButtons";
import Modal from "../layout-components/Modal/Modal";
import LoadingSpinner from "../layout-components/LoadingSpinner";

function WithdrawModal({ withdrawDetails }) {
  // Active window
  const [window, setWindow] = useState("withdraw");
  const [transactionDetail, setTransactionDetail] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  // Fee responsibility
  const feeResponsibility = withdrawDetails.feeResponsibility;

  // Calculate fees
  const fees = calculateFee(withdrawDetails.withdrawalAmount);

  const { mutate: withdraw, isPending: loading } = useMutation({
    mutationFn: () =>
      paymentApi.withdrawFunds(
        withdrawDetails.eventId,
        withdrawDetails.withdrawalAmount
      ),
    onSuccess: data => {
      // Handle successful withdrawal
      setTransactionDetail(data.transaction);
      setWindow("transaction-success");
    },
    onError: error => {
      // Handle withdrawal error
      setErrorMessage(
        error?.response?.data?.message ||
          "An error occurred while processing your withdrawal. Please try again."
      );
      setWindow("transaction-failed");
    },
  });

  // Reset to initial state
  const resetWindow = () => {
    setWindow("withdraw");
    setErrorMessage("");
    setTransactionDetail(null);
  };

  const renderContent = () => {
    switch (window) {
      case "withdraw":
        return (
          <div className="satoshi font-bold text-sm">
            <IconButton
              className="pointer-events-none size-11! mb-6"
              variant="tertiary"
              icon={<ReceiveSquare2 color="#077D8A" size={24} variant="Bold" />}
            />
            <h3 className="paytone text-[18px] mb-2 leading-[28px] font-normal">
              You’re About to withdraw
            </h3>
            <p className="text-[#8A9191]">
              You're about to proceed with your withdrawal. Make sure the
              details are correct
            </p>
            <div className="flex flex-col mt-6 gap-y-6">
              <div className="flex flex-col gap-2">
                <h2 className="md:text-[72px] leading-[49px] text-[36px] md:leading-[97px] tracking-[-2%]">
                  {formatCurrency(withdrawDetails.withdrawalAmount)}
                </h2>
              </div>
              <div className="bg-white border gap-y-4 border-[#E5E7E3] p-4 rounded-[16px] flex flex-col">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[#8A9191] whitespace-nowrap">
                    Account Name
                  </span>
                  <p className="capitalize overflow-hidden overflow-ellipsis whitespace-nowrap">
                    {withdrawDetails.accountName}
                  </p>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[#8A9191]">Account Number</span>
                  <p>{withdrawDetails.accountNumber}</p>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[#8A9191] whitespace-nowrap">Bank</span>
                  <p className="overflow-hidden overflow-ellipsis whitespace-nowrap">
                    {withdrawDetails.bankName}
                  </p>
                </div>
                {feeResponsibility === "host" && (
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[#8A9191] whitespace-nowrap">
                      Fees
                    </span>
                    <p className="overflow-hidden overflow-ellipsis whitespace-nowrap">
                      {formatNaira(fees)}
                    </p>
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-y-4">
                {/* Withdraw button */}
                <TextButton
                  text={loading ? <LoadingSpinner /> : "Withdraw Funds"}
                  className="min-w-full md:min-w-[151px]"
                  onClick={() => withdraw()}
                  disabled={loading}
                />
                <p>
                  {"By continuing, you agree to our "}
                  <Link to="/" className="text-[#7A60BF]">
                    Terms of Service
                  </Link>
                  {" and "}
                  <Link to="/" className="text-[#7A60BF]">
                    Privacy Policy.
                  </Link>
                </p>
              </div>
            </div>
          </div>
        );
      case "transaction-success":
        return (
          <div className="satoshi font-bold text-sm text-[#010E1F]">
            <div className="flex flex-col gap-y-12">
              <div className="bg-white rounded-[32px] shadow-[0_4px_24px_0_rgba(2,142,75,0.1)] overflow-hidden">
                <div className="flex flex-col justify-center gap-y-3 p-6 items-center border border-[#f0f0f0]">
                  <TickCircle color="#61B42D" size={48} variant="Bold" />
                  <h3 className="text-base">Withdraw successful</h3>
                </div>
                <div className="p-6 flex flex-col gap-y-1 items-center border border-[#f0f0f0]">
                  <h3 className="text-[30px] leading-[38px] md:text-[48px] md:leading-[65px]">
                    {formatCurrency(transactionDetail?.amount)}
                  </h3>
                </div>
                <div className="bg-white border gap-y-4 p-6 border-[#E5E7E3] flex flex-col">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[#8A9191] whitespace-nowrap">
                      Account Name
                    </span>
                    <p className="capitalize overflow-hidden overflow-ellipsis whitespace-nowrap">
                      {transactionDetail?.bankDetails?.accountName}
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[#8A9191]">Account Number</span>
                    <p>{transactionDetail?.bankDetails?.accountNumber}</p>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[#8A9191] whitespace-nowrap">
                      Bank
                    </span>
                    <p className="overflow-hidden overflow-ellipsis whitespace-nowrap">
                      {transactionDetail?.bankDetails?.bankName}
                    </p>
                  </div>
                  {feeResponsibility === "host" && (
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-[#8A9191] whitespace-nowrap">
                        Fees
                      </span>
                      <p className="overflow-hidden overflow-ellipsis whitespace-nowrap">
                        {formatNaira(fees)}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[#8A9191] whitespace-nowrap">
                      Date
                    </span>
                    <p className="overflow-hidden overflow-ellipsis whitespace-nowrap">
                      {formatDate(transactionDetail?.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-center md:justify-start gap-x-4">
                <TextButton text="Back to home" />
              </div>
            </div>
          </div>
        );
      case "transaction-failed":
        return (
          <div className="satoshi font-bold text-sm text-[#010E1F]">
            <div className="flex flex-col gap-y-12">
              <div className="bg-white rounded-[32px] shadow-[0_4px_24px_0_rgba(2,142,75,0.1)] overflow-hidden">
                <div className="flex flex-col justify-center gap-y-3 p-6 items-center border border-[#f0f0f0]">
                  <CloseCircle size={48} variant="Bold" color="#C7245A" />
                  <div className="text-center">
                    <h3 className="text-base">Withdraw failed</h3>
                    {errorMessage && (
                      <p className="text-sm mt-1 font-medium text-[#8A9191] text-center max-w-md">
                        {errorMessage}
                      </p>
                    )}
                  </div>
                </div>
                <div className="p-6 flex flex-col gap-y-1 items-center border border-[#f0f0f0]">
                  <h3 className="text-[30px] leading-[38px] md:text-[48px] md:leading-[65px]">
                    {formatCurrency(withdrawDetails.withdrawalAmount)}
                  </h3>
                </div>
                <div className="bg-white border gap-y-4 p-6 border-[#E5E7E3] flex flex-col">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[#8A9191] whitespace-nowrap">
                      Account Name
                    </span>
                    <p className="capitalize overflow-hidden overflow-ellipsis whitespace-nowrap">
                      {withdrawDetails.accountName}
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[#8A9191]">Account Number</span>
                    <p>{withdrawDetails.accountNumber}</p>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[#8A9191] whitespace-nowrap">
                      Bank
                    </span>
                    <p className="overflow-hidden overflow-ellipsis whitespace-nowrap">
                      {withdrawDetails.bankName}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-center md:justify-start gap-x-4">
                <TextButton text="Try Again" onClick={resetWindow} />
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Modal.Window
      isCloseButtonDisabled={loading}
      name="withdrawal-confirm"
      title={window !== "withdraw" ? "Transaction Detail" : ""}
      onClose={resetWindow}
    >
      {renderContent()}
    </Modal.Window>
  );
}

export default WithdrawModal;
