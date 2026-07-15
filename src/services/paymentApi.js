import API from "@/lib/axios";

export const paymentApi = {
  getTransactions: async (eventId, page = 1, search = "") => {
    const transactionsResponse = await API.get(
      `/payments/transactions/${eventId}?page=${page}&search=${search}`
    );

    return transactionsResponse.data;
  },
  updateUserBankDetails: async data => {
    const updateResponse = await API.patch(`/payments/update-user-bank`, data);
    return updateResponse.data.data;
  },
  updateEventBankDetails: async data => {
    const updateResponse = await API.patch(`/payments/update-event-bank`, data);
    return updateResponse.data.data;
  },
  getEventBalance: async eventId => {
    const balanceResponse = await API.get(`/payments/balance/${eventId}`);
    return balanceResponse.data.data;
  },
  withdrawFunds: async (eventId, amount) => {
    const withdrawResponse = await API.post(`/payments/withdraw`, {
      amount,
      eventId,
    });
    return withdrawResponse.data.data;
  },
  verifyBank: async (bankCode, accountNumber) => {
    const verifyResponse = await API.post(`/payments/verify-account`, {
      bankCode,
      accountNumber,
    });
    return verifyResponse.data;
  },
  chipIn: async (eventId, amount) => {
    const chipInResponse = await API.post(`/payments/chip-in`, {
      eventId,
      amount,
    });
    return chipInResponse.data.data;
  },
};
