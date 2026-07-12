import Alert from "@/components/layout-components/Alert";
import TagButton from "@/components/layout-components/Buttons/TagButton";
import TextButton from "@/components/layout-components/Buttons/TextButtons";
import EventChipInModal from "@/components/layout-components/Events/EventChipInModal";
import EventCohostsModal from "@/components/layout-components/Events/EventCohostsModal";
import EventDateModal from "@/components/layout-components/Events/EventDateModal";
import EventDescriptionModal from "@/components/layout-components/Events/EventDescriptionModal";
import EventDressCodeModal from "@/components/layout-components/Events/EventDressCodeModal";
import EventImage from "@/components/layout-components/Events/EventImage";
import EventLocationModal from "@/components/layout-components/Events/EventLocationModal";
import EventTypeModal from "@/components/layout-components/Events/EventTypeModal";
import ImageTemplatesModal from "@/components/layout-components/Events/ImageTemplatesModal";
import UpdateEventModal from "@/components/layout-components/Events/UpdateEventModal";
import EventName from "@/components/layout-components/Inputs/EventName";
import ListInput from "@/components/layout-components/Inputs/ListInput";
import Modal from "@/components/layout-components/Modal/Modal";
import { useModalContext } from "@/components/layout-components/Modal/ModalContext";
import { useManageEventContext } from "@/layouts/ManageEventLayout";
import { categories } from "@/lib/utils";
import { eventsApi } from "@/services/eventsApi";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Add,
  Calendar2,
  Category2,
  Colorfilter,
  Crown,
  Gallery,
  Location,
  Timer1,
  Trash,
} from "iconsax-reactjs";
import React, { useEffect, useState } from "react";
import { twMerge } from "tailwind-merge";

// Fallback shape for chip-in details when a user removes chip-in and might
// re-add it later in the same session. Mirrors CreateEvent's constant.
const initialChipInDetails = {
  chipInType: "",
  amount: "",
  bankDetails: {
    accountName: "",
    accountNumber: "",
    bankName: "",
    bankCode: "",
  },
};

function EditEvent() {
  const { event } = useManageEventContext();
  const { setActive } = useModalContext();
  // Validation state for required fields
  const [validation, setValidation] = useState({
    title: "",
    date: "",
    location: "",
    description: "",
    dressCode: "",
    chipIn: "",
    cohosts: "",
    categories: "",
  });
  // Initial event data for comparison and undo functionality
  const [initialEvent, setInitialEvent] = useState(null);
  const [editedEvent, setEditedEvent] = useState(null);
  // Settings state to control visibility of optional fields
  const [settings, setSettings] = useState(null);
  const queryClient = useQueryClient();
  // File state to hold the uploaded image file.
  const [imageFile, setImageFile] = useState(null);
  // Cohost image files, index-matched to editedEvent.cohosts. null entries
  // mean "no new upload for this cohost, keep their existing photo".
  const [cohostImages, setCohostImages] = useState([]);
  // Show update count alert
  const [showUpdateAlert, setShowUpdateAlert] = useState(true);

  // Event privacy state derived from event data
  const isPrivate = event?.isPrivate;

  // Set initial event data when it loads and when event changes
  useEffect(() => {
    if (event) {
      const eventData = {
        title: event.title || "",
        description: event.description || "",
        startDate: event.startDate || "",
        endDate: event.endDate || "",
        image: event.image || "",
        font: event.font || "paytone",
        isPrivate: Boolean(event.isPrivate),
        location: {
          venue: event.location?.venue || "",
          state: event.location?.state || "",
          city: event.location?.city || "",
          coordinates: event.location?.coordinates || null,
          directions: event.location?.directions || "",
        },
        isPublished: Boolean(event.isPublished),
        category: event.category || [],
        dressCode: event.dressCode || null,
        eventType: event.eventType || "",
        meetingURL: event.meetingURL || "",
        // NOTE: cohosts here must include the RAW photo object
        // ({ public_id, url }), not a flattened URL string, or existing
        // cohost photos will be lost on save. This depends on
        // useManageEventContext fetching the event via an edit-mode
        // endpoint that doesn't flatten cohost.photo through
        // formatEventData's public-view shape.
        cohosts: event.cohosts || [],
        updateCount: event.updateCount || 0,
        chipInDetails: event.chipInDetails || null,
      };

      setInitialEvent(eventData);
      setEditedEvent(eventData);
      setCohostImages((eventData.cohosts || []).map(() => null));

      setSettings({
        hasDescription: eventData?.description ? true : false,
        hasChipIn: eventData?.chipInDetails ? true : false,
        hasDressCode: eventData?.dressCode ? true : false,
        hasCohosts: eventData?.cohosts?.length > 0 ? true : false,
      });
    }
  }, [event]);

  const clearLocalImages = () => {
    if (editedEvent?.image && editedEvent.image.startsWith("blob:")) {
      URL.revokeObjectURL(editedEvent.image);
    }

    // Also check cohosts for any blob preview URLs and revoke them.
    // cohost.photo is the { public_id, url } object from the server (or
    // undefined) — never a blob URL. The local preview lives in
    // cohost.preview, set by ImageInput's onUpload in EventCohostsModal.
    if (editedEvent?.cohosts?.length) {
      editedEvent.cohosts.forEach(cohost => {
        if (cohost.preview && cohost.preview.startsWith("blob:")) {
          URL.revokeObjectURL(cohost.preview);
        }
      });
    }
  };

  // Clean up object URLs when component unmounts
  useEffect(() => {
    return () => clearLocalImages();
  }, []);

  // Format start date for display in ListInput
  const startDateFormatted = editedEvent?.startDate
    ? format(new Date(editedEvent.startDate), "EEE,  MMM d, h:mm aa")
    : "";

  // Format end date for display in ListInput
  const endDateFormatted = editedEvent?.endDate
    ? format(new Date(editedEvent.endDate), "EEE,  MMM d, h:mm aa")
    : "";

  // Helper function to update location based on event type
  const handleSetLocation = data => {
    switch (data.eventType) {
      case "online":
        setEditedEvent({
          ...editedEvent,
          eventType: "online",
          meetingURL: data.meetingURL,
          location: {
            venue: "",
            state: "",
            city: "",
            coordinates: null,
            directions: "",
          },
        });
        break;
      case "offline":
        setEditedEvent({
          ...editedEvent,
          eventType: "offline",
          location: {
            venue: data.location.venue,
            state: data.location.state,
            city: data.location.city,
            coordinates: data.location.coordinates,
            directions: data.location.directions,
          },
          meetingURL: "",
        });
        break;
      default:
    }
  };

  // Undo changes handler
  const handleUndoChanges = () => {
    setEditedEvent(initialEvent);
    setCohostImages((initialEvent.cohosts || []).map(() => null));
    setSettings({
      hasDescription: initialEvent.description ? true : false,
      hasChipIn: initialEvent.chipInDetails ? true : false,
      hasDressCode: initialEvent.dressCode ? true : false,
      hasCohosts: initialEvent.cohosts?.length > 0 ? true : false,
    });
    setImageFile(null);
    setValidation({
      title: "",
      date: "",
      location: "",
      description: "",
      dressCode: "",
      chipIn: "",
      cohosts: "",
      categories: "",
    });
  };

  // Determine if there are no optional settings enabled
  const hasNoSettings =
    !settings?.hasDescription ||
    !settings?.hasChipIn ||
    !settings?.hasCohosts ||
    !settings?.hasDressCode;

  // Format location for display in ListInput
  const locationFormatted =
    editedEvent?.eventType === "online"
      ? `Online event - ${editedEvent?.meetingURL || "No meeting URL set"}`
      : `${editedEvent?.location?.venue ? `${editedEvent.location.venue}, ` : ""}${editedEvent?.location?.state ? `${editedEvent.location.state}` : ""}`;

  // Format description for display in ListInput
  const descriptionFormatted = editedEvent?.description
    ? editedEvent.description.length > 50
      ? editedEvent.description.slice(0, 50) + "..."
      : editedEvent.description
    : "";

  // Format chip in details for display
  const chipInDetailsFormatted = event?.chipInDetails
    ? event.chipInDetails?.chipInType === "fixed"
      ? `Fixed - ₦${event.chipInDetails?.amount}`
      : event.chipInDetails?.chipInType === "target"
        ? `Target - ₦${event.chipInDetails?.amount}`
        : event.chipInDetails?.chipInType === "donation"
          ? `Flexible - ₦${event.chipInDetails?.amount}`
          : ""
    : "";

  // Format cohosts for display in ListInput
  const cohostsFormatted = editedEvent?.cohosts?.length
    ? editedEvent.cohosts.map(cohost => cohost.name || cohost.email).join(", ")
    : "";

  // Validate fields
  const validateRequiredFields = () => {
    // Errors are strings
    const errors = {};

    if (!editedEvent.title.trim()) {
      errors.title = "Event title is required.";
    }
    if (!editedEvent.startDate) {
      errors.date = "Event start date and time are required.";
    }

    if (!editedEvent.location.state.trim() && !editedEvent.meetingURL.trim()) {
      errors.location = "Event location is required.";
    }

    if (settings?.hasCohosts && editedEvent.cohosts.length <= 0) {
      errors.cohosts = "At least one cohost is required.";
    }

    if (editedEvent.category.length <= 0) {
      errors.categories = "At least one event category is required.";
    }

    // Optional fields
    if (settings?.hasDescription && !editedEvent.description.trim()) {
      errors.description = "Event description is required.";
    }
    if (settings?.hasDressCode && !editedEvent.dressCode?.type) {
      errors.dressCode = "Event dress code is required.";
    }
    if (settings?.hasChipIn && !editedEvent.chipInDetails) {
      errors.chipIn = "Event chip-in details are required.";
    }

    setValidation(errors);
    return Object.values(errors).every(value => value === "");
  };
  // Status state
  const [status, setStatus] = useState(null);
  // Error state
  const [error, setError] = useState(null);
  // Update event mutation
  const { mutateAsync: updateEvent, isPending: isUpdating } = useMutation({
    mutationFn: () => {
      const formData = new FormData();
      formData.append("title", editedEvent.title);
      formData.append(
        "startDate",
        new Date(editedEvent.startDate).toISOString()
      );
      formData.append("font", editedEvent.font);
      if (editedEvent.endDate) {
        formData.append("endDate", new Date(editedEvent.endDate).toISOString());
      }
      if (settings?.hasCohosts) {
        // Each cohost's `photo` (if kept) is the raw { public_id, url }
        // object carried from editedEvent.cohosts — sent as-is so the
        // backend preserves it when no new file is uploaded for that index.
        formData.append("cohosts", JSON.stringify(editedEvent.cohosts));
      }
      formData.append("category", JSON.stringify(editedEvent.category));
      formData.append("eventType", editedEvent.eventType);
      // Append image if it exists
      if (imageFile) {
        formData.append("image", imageFile);
      } else {
        formData.append("image", editedEvent.image);
      }
      // Append description if it exists
      if (editedEvent.description) {
        formData.append("description", editedEvent.description);
      }
      // Append optional fields
      if (editedEvent.chipInDetails && settings?.hasChipIn) {
        formData.append(
          "chipInDetails",
          JSON.stringify(editedEvent.chipInDetails)
        );
      }
      if (editedEvent.location) {
        formData.append("location", JSON.stringify(editedEvent.location));
      }
      if (editedEvent.meetingURL) {
        formData.append("meetingURL", editedEvent.meetingURL);
      }
      if (editedEvent.dressCode) {
        formData.append("dressCode", JSON.stringify(editedEvent.dressCode));
      }
      // Append cohost images, one file per field named cohostImage_<index>,
      // matching that cohost's position in editedEvent.cohosts. Cohosts
      // with no new upload have `null` at their index and are skipped —
      // the backend preserves their existing photo object instead.
      if (settings?.hasCohosts && cohostImages.length > 0) {
        cohostImages.forEach((file, index) => {
          if (file) formData.append(`cohostImage_${index}`, file);
        });
      }
      return eventsApi.updateEvent(event._id, formData);
    },
    onSuccess: data => {
      if (data.status === "success") {
        // Invalidate queries to refetch the updated data
        queryClient.invalidateQueries(["user-events"]);
        queryClient.invalidateQueries(["event", event._id]);

        // Clear file
        setImageFile(null);
        // Set status to success
        setStatus("success");
        // Clear local images
        clearLocalImages();
      }
    },
    onError: err => {
      setStatus("error");
      setError(
        err.response?.data?.message ||
          "Failed to update event. Please try again."
      );
    },
  });

  // Handle save changes
  const handleSaveChanges = () => {
    if (!validateRequiredFields()) {
      return;
    }
    updateEvent();
    setActive("update-event");
  };

  if (!editedEvent) {
    return <div> Loading.... </div>;
  }
  return (
    <div className="max-w-[950px] satoshi mt-10 w-full mx-auto flex flex-col md:flex-row md:gap-12 gap-6">
      {/* Image section */}
      <div className="md:sticky md:top-43 md:self-start">
        <h3 className="text-sm text-[#001010] font-bold">Event Image</h3>
        <p className="text-xs mb-4 text-[#8A9191] leading-4.5 font-medium">
          Upload a JPEG or PNG file with a size of 2mb or less
        </p>
        <Modal.Open opens="image-templates">
          <div className="cursor-pointer">
            <EventImage
              imageUrl={editedEvent.image}
              className="max-md:max-w-full"
            />
          </div>
        </Modal.Open>
        <div className="mt-4">
          <Alert
            option="outline"
            type="info"
            title="Images with a 1 : 1 ratio (a square) work best"
          />
        </div>
      </div>
      {/* Details section */}
      <div className="flex-1">
        {/* Event privacy */}
        {!editedEvent.isPublished && (
          <div className="mb-6">
            <div className="border border-[#F9F9F9] p-[2px] bg-[#E5E7E3] rounded-full inline-flex items-center">
              <TagButton
                text="Private"
                className={twMerge(
                  "satoshi min-w-auto h-7.5 px-3 pointer-events-none bg-transparent text-[#B0B5B5] border-transparent",
                  isPrivate && "bg-white text-[#011F0F]"
                )}
              />
              <TagButton
                text="Public"
                className={twMerge(
                  "satoshi min-w-auto px-3 h-7.5 pointer-events-none bg-transparent text-[#B0B5B5] border-transparent",
                  !isPrivate && "bg-white text-[#011F0F]"
                )}
              />
            </div>
            <p className="text-xs text-[#8A9191] mt-2 font-medium">
              {isPrivate
                ? "Shh... it’s exclusive! Only those with the magic link can RSVP."
                : "Open to all! Let the world (or at least your city) know what’s happening!"}
            </p>
          </div>
        )}
        {/* Event title */}
        <EventName
          value={editedEvent.title}
          font={editedEvent.font}
          error={validation.title}
          onChange={value => {
            setEditedEvent({ ...editedEvent, title: value });
            if (validation.title && value.trim())
              setValidation(prev => ({ ...prev, title: "" }));
          }}
          onSelect={newFont =>
            setEditedEvent({ ...editedEvent, font: newFont })
          }
        />
        {/* Additional details */}
        <div className="flex flex-col gap-3 mt-6">
          <TextButton
            text="Event details"
            variant="tertiary"
            className="w-full h-9 text-sm pointer-events-none text-left justify-start"
          />
          {/* Event date */}
          <Modal.Open opens="event-date">
            <ListInput
              placeholder="When is your Event?"
              error={validation.date}
              content={
                startDateFormatted
                  ? `${startDateFormatted}${editedEvent.endDate ? ` - ${endDateFormatted}` : ""}`
                  : ""
              }
              leftIcon={<Timer1 variant="Bold" />}
            />
          </Modal.Open>
          {/* Event location */}
          <Modal.Open opens="event-location">
            <ListInput
              error={validation.location}
              placeholder="Where is your Event?"
              content={locationFormatted}
              leftIcon={<Location variant="Bold" />}
            />
          </Modal.Open>
          {/* Event cohosts and collaborators */}
          {settings?.hasCohosts && (
            <Modal.Open opens="event-cohosts">
              <ListInput
                error={validation.cohosts}
                placeholder="Add Cohosts, Collaborators, Speakers e.t.c"
                leftIcon={<Crown variant="Bold" />}
                content={cohostsFormatted}
              />
            </Modal.Open>
          )}
          {/* Event categories */}
          <Modal.Open opens="event-type">
            <ListInput
              placeholder="Event Type"
              leftIcon={<Category2 variant="Bulk" />}
              error={validation.categories}
              tags={
                editedEvent.category.length > 0 ? (
                  <React.Fragment>
                    {editedEvent.category.map((cat, index) => (
                      <TagButton
                        key={index}
                        className={twMerge(
                          "pointer-events-none  satoshi",
                          categories[cat] ? categories[cat] : "text-[#001010]"
                        )}
                        text={cat}
                      />
                    ))}
                  </React.Fragment>
                ) : null
              }
            />
          </Modal.Open>
          {/* Event description */}
          {settings?.hasDescription && (
            <Modal.Open opens="event-description">
              <ListInput
                placeholder="Event Description"
                leftIcon={<Calendar2 variant="Bold" />}
                content={descriptionFormatted}
                error={validation.description}
                rightIcon={
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      setEditedEvent(prev => ({ ...prev, description: "" }));
                      setSettings(prev => ({ ...prev, hasDescription: false }));
                      setValidation(prev => ({ ...prev, description: "" }));
                    }}
                  >
                    <Trash variant="Outline" size={16} />
                  </button>
                }
              />
            </Modal.Open>
          )}
          {/* Event dress code */}
          {settings?.hasDressCode && (
            <Modal.Open opens="event-dress-code">
              <ListInput
                placeholder="Dress Code"
                content={`${editedEvent.dressCode ? editedEvent.dressCode.type : ""}${editedEvent.dressCode?.details ? ` - ${editedEvent.dressCode.details}` : ""}`}
                error={validation.dressCode}
                leftIcon={<Colorfilter variant="Bold" />}
                rightIcon={
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      setEditedEvent(prev => ({
                        ...prev,
                        dressCode: {
                          type: "Casual",
                        },
                      }));
                      setSettings(prev => ({ ...prev, hasDressCode: false }));
                      setValidation(prev => ({ ...prev, dressCode: "" }));
                    }}
                  >
                    <Trash variant="Outline" size={16} />
                  </button>
                }
              />
            </Modal.Open>
          )}
          {/* Event chip in */}
          {settings?.hasChipIn && editedEvent.isPrivate && (
            <Modal.Open opens="event-chip-in">
              <ListInput
                placeholder="Chip In"
                content={chipInDetailsFormatted}
                error={validation.chipIn}
                leftIcon={<Gallery variant="Bold" />}
                rightIcon={
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      setEditedEvent(prev => ({
                        ...prev,
                        chipInDetails: initialChipInDetails,
                      }));
                      setSettings(prev => ({
                        ...prev,
                        hasChipIn: false,
                      }));
                      setValidation(prev => ({ ...prev, chipIn: "" }));
                    }}
                  >
                    <Trash variant="Outline" size={16} />
                  </button>
                }
              />
            </Modal.Open>
          )}
          {/* Optional fields based on settings */}
          {hasNoSettings && (
            <div className="flex items-center gap-x-4 gap-y-3">
              {!settings?.hasDescription && (
                <TagButton
                  text="Description"
                  className="satoshi"
                  onClick={() =>
                    setSettings(prev => ({
                      ...prev,
                      hasDescription: !prev.hasDescription,
                    }))
                  }
                  leftImg={<Add />}
                />
              )}
              {!settings?.hasCohosts && (
                <TagButton
                  text="Cohosts"
                  leftImg={<Add />}
                  className="satoshi"
                  onClick={() => {
                    setSettings(prev => ({
                      ...prev,
                      hasCohosts: !prev.hasCohosts,
                    }));
                  }}
                />
              )}
              {!settings?.hasDressCode && (
                <TagButton
                  text="Dress code"
                  leftImg={<Add />}
                  className="satoshi"
                  onClick={() => {
                    setSettings(prev => ({
                      ...prev,
                      hasDressCode: !prev.hasDressCode,
                    }));
                  }}
                />
              )}
            </div>
          )}
        </div>
        <div className="py-6">
          {/* Amount of edits */}
          {showUpdateAlert && (
            <Alert
              type="info"
              option="outline"
              className="mb-4 !rounded-2xl"
              subtitle="You can update your event details but not forever 😅
To keep things neat for your guests, you can only make up to 3 major edits (like name, date, or location)."
              onClick={() => setShowUpdateAlert(false)}
              title={
                <span className="flex justify-between items-center">
                  <span>✏️ Heads up, Creator!</span>
                  <span>{editedEvent.updateCount}/3 edits</span>
                </span>
              }
            />
          )}
          {/* Save buttons */}
          <div className="flex items-center justify-between">
            <TextButton
              variant="secondary"
              text="Undo Changes"
              onClick={handleUndoChanges}
            />
            <TextButton
              variant="primary"
              text="Save Changes"
              onClick={handleSaveChanges}
            />
          </div>
        </div>
      </div>
      {/* Image templates modal */}
      <ImageTemplatesModal
        onSave={data => {
          setEditedEvent({ ...editedEvent, image: data.image });
          setImageFile(data.file);
        }}
        defaultImage={editedEvent.image}
      />
      {/* Event date modal */}
      <EventDateModal
        data={{
          startDate: editedEvent.startDate,
          endDate: editedEvent.endDate,
        }}
        onSave={newDates => {
          setEditedEvent({
            ...editedEvent,
            startDate: newDates.startDate,
            endDate: newDates.endDate,
          });
          setValidation(prev => ({ ...prev, date: "" }));
        }}
      />
      {/* Event location modal */}
      <EventLocationModal
        locationData={editedEvent.location}
        eventType={editedEvent.eventType}
        meetingURL={editedEvent.meetingURL}
        onSave={data => {
          handleSetLocation(data);
          setValidation(prev => ({ ...prev, location: "" }));
        }}
      />
      {/* Event cohosts modal */}
      <EventCohostsModal
        cohostsData={editedEvent.cohosts}
        onSave={(newCohosts, newCohostImages) => {
          setEditedEvent({ ...editedEvent, cohosts: newCohosts });
          setCohostImages(newCohostImages);
          setValidation(prev => ({ ...prev, cohosts: "" }));
        }}
      />
      {/* Event categories modal */}
      <EventTypeModal
        categoriesData={editedEvent.category}
        onSave={data => {
          setEditedEvent({ ...editedEvent, category: data });
          setValidation(prev => ({ ...prev, categories: "" }));
        }}
      />
      {/* Event description modal */}
      {settings.hasDescription && (
        <EventDescriptionModal
          descriptionData={editedEvent.description}
          onSave={description => {
            setEditedEvent({ ...editedEvent, description });
            setValidation(prev => ({ ...prev, description: "" }));
          }}
        />
      )}
      {/* Event dress code modal */}
      {settings.hasDressCode && (
        <EventDressCodeModal
          dressCodeData={editedEvent.dressCode}
          onSave={data => {
            setEditedEvent({ ...editedEvent, dressCode: data });
            setValidation(prev => ({ ...prev, dressCode: "" }));
          }}
        />
      )}
      {/* Event chip in modal */}
      {settings.hasChipIn && editedEvent.isPrivate && (
        <EventChipInModal
          chipInData={editedEvent.chipInDetails}
          onSave={data => {
            setEditedEvent({ ...editedEvent, chipInDetails: data });
            setValidation(prev => ({ ...prev, chipIn: "" }));
          }}
        />
      )}
      {/* Event updating modal */}
      <UpdateEventModal
        event={{
          title: editedEvent.title,
          slug: event.slug,
          startDate: editedEvent.startDate,
          image: editedEvent.image,
        }}
        loading={isUpdating}
        status={status}
        error={error}
      />
    </div>
  );
}

export default EditEvent;
