import IconButton from "../layout-components/Buttons/IconButton";
import Modal from "../layout-components/Modal/Modal";
import Alert from "../layout-components/Alert";
import TextButton from "../layout-components/Buttons/TextButtons";
import LoadingSpinner from "../layout-components/LoadingSpinner";
import { useState } from "react";
import { useModalContext } from "../layout-components/Modal/ModalContext";
import { Trash } from "iconsax-reactjs";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { eventsApi } from "@/services/eventsApi";
import { useNavigate } from "react-router";

export default function DeleteEventModal({ eventId, showAlert = false }) {
  // Modal context
  const { close } = useModalContext();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  const { mutate: deleteEvent, isPending: loading } = useMutation({
    mutationFn: async () => {
      setError(null);
      return await eventsApi.deleteEvent(eventId);
    },
    onSuccess: () => {
      // Revalidate events list or update state as needed here
      queryClient.invalidateQueries(["user-events"]);
      queryClient.invalidateQueries(["event", eventId]);
      queryClient.invalidateQueries(["userEventsCount"]);

      // Redirect to home after short delay to allow modal to close
      setTimeout(() => {
        navigate("/home");
      }, 300);

      // Close modal
      close();
    },
    onError: error => {
      setError(error?.response?.data?.message || "Something went wrong.");
    },
  });
  return (
    <Modal.Window name="delete-event" isCloseButtonDisabled={loading}>
      <div className="satoshi font-bold text-sm">
        <IconButton
          className="pointer-events-none size-11! mb-6"
          variant="tertiary"
          icon={<Trash color="#077D8A" size={24} variant="Bold" />}
        />
        <h3 className="paytone text-[18px] mb-2 leading-[28px] font-normal">
          Are you sure you want to delete this event?
        </h3>
        <p className="text-[#8A9191]">
          This action is permanent and cannot be undone.
          <br />
          All attendees will be notified, and the event will be removed from
          public view.
        </p>
        {error && (
          <div className="mt-4">
            <Alert type="error" title={error} onClick={() => setError(null)} />
          </div>
        )}
        {showAlert && (
          <div className="mt-4">
            <Alert
              type="info"
              option="outline"
              title="Deleting this event will automatically cancel all contributions and initiate refunds where applicable."
            />
          </div>
        )}
        <div className="flex mt-12 gap-4">
          <TextButton variant="tertiary" text="No, Cancel" onClick={close} />
          <TextButton
            variant="red"
            text={loading ? <LoadingSpinner /> : "Yes, Delete"}
            onClick={deleteEvent}
            className="min-w-[106px]"
            disabled={loading}
          />
        </div>
      </div>
    </Modal.Window>
  );
}
