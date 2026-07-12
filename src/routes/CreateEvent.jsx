import Alert from "@/components/layout-components/Alert";
import TagButton from "@/components/layout-components/Buttons/TagButton";
import TextButton from "@/components/layout-components/Buttons/TextButtons";
import CreateEventModal from "@/components/layout-components/Events/CreateEventModal";
import EventChipInModal from "@/components/layout-components/Events/EventChipInModal";
import EventCohostsModal from "@/components/layout-components/Events/EventCohostsModal";
import EventDateModal from "@/components/layout-components/Events/EventDateModal";
import EventDescriptionModal from "@/components/layout-components/Events/EventDescriptionModal";
import EventDressCodeModal from "@/components/layout-components/Events/EventDressCodeModal";
import EventImage from "@/components/layout-components/Events/EventImage";
import EventLocationModal from "@/components/layout-components/Events/EventLocationModal";
import EventTypeModal from "@/components/layout-components/Events/EventTypeModal";
import ImageTemplatesModal from "@/components/layout-components/Events/ImageTemplatesModal";
import EventName from "@/components/layout-components/Inputs/EventName";
import ListInput from "@/components/layout-components/Inputs/ListInput";
import Modal from "@/components/layout-components/Modal/Modal";
import Toggle from "@/components/layout-components/Selectors/Toggle";
import React, { useEffect, useState } from "react";
import { useModalContext } from "@/components/layout-components/Modal/ModalContext";
import { categories, DEFAULT_EVENT_IMAGES } from "@/lib/utils";
import { eventsApi } from "@/services/eventsApi";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Add,
  ArrowDown2,
  ArrowLeft2,
  Calendar2,
  Category2,
  Colorfilter,
  Crown,
  Eye,
  Gallery,
  Location,
  Lock1,
  People,
  Timer1,
  Trash,
  UserTick,
} from "iconsax-reactjs";
import { useNavigate, useLocation } from "react-router";
import { twMerge } from "tailwind-merge";
import { useAuthStore } from "@/stores/useAuthStore";
import EventEntryCodeModal from "@/components/layout-components/Events/EventEntryCodeModal";
import EventAttendeeLimitModal from "@/components/layout-components/Events/EventAttendeeLimitModal";
import CreateEventPreview from "@/routes/CreateEventPreview";

function CreateEvent() {
  // User
  const { user } = useAuthStore();
  // Navigation
  const navigate = useNavigate();
  const location = useLocation();
  // Query Client
  const queryClient = useQueryClient();

  // Image File State
  const [imageFile, setImageFile] = useState(null);
  // Event preview status
  const [isPreview, setIsPreview] = useState(false);
  // Random Image
  const randomImage =
    DEFAULT_EVENT_IMAGES[
      Math.floor(Math.random() * DEFAULT_EVENT_IMAGES.length)
    ];
  // Event Settings Open State
  const [eventSettingsOpen, setEventSettingsOpen] = useState(false);
  // Settings state to control visibility of optional fields
  const [settings, setSettings] = useState({
    hasDescription: false,
    hasDressCode: false,
    hasChipIn: false,
    hasEntryCode: false,
    hasCohosts: true,
    hasGuestListApproval: false,
    hasAttendeeLimit: false,
  });

  // Determine if there are no optional settings enabled
  const hasNoSettings =
    !settings?.hasDescription ||
    !settings?.hasChipIn ||
    !settings?.hasCohosts ||
    !settings?.hasDressCode;

  // Initial chip in details for state
  const initialChipInDetails = {
    chipInType: "",
    amount: "",
    bankDetails: {
      accountName: user?.bankDetails?.accountName || "",
      accountNumber: user?.bankDetails?.accountNumber || "",
      bankName: user?.bankDetails?.bankName || "",
      bankCode: user?.bankDetails?.bankCode || "",
    },
  };

  // Initial event state
  const initialEventState = {
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    image: randomImage,
    font: "paytone",
    isPrivate: true,
    location: {
      venue: "",
      state: "",
      city: "",
      coordinates: null,
      directions: "",
    },
    category: [],
    dressCode: {
      type: "Casual",
      details: "",
    },
    eventType: "offline",
    meetingURL: "",
    cohosts: [],
    chipInDetails: initialChipInDetails,
    entryCode: null,
    attendeeLimit: null,
    cohostImages: [],
  };

  // Event State
  const [event, setEvent] = useState(initialEventState);
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
    entryCode: "",
  });

  // Helper function to update location based on event type
  const handleSetLocation = data => {
    switch (data.eventType) {
      case "online":
        setEvent({
          ...event,
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
        setEvent({
          ...event,
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

  // Clear local images
  const clearLocalImages = () => {
    if (event?.image && event.image.startsWith("blob:")) {
      URL.revokeObjectURL(event.image);
    }

    // Also check cohosts for any blob preview URLs and revoke them.
    // Note: cohost.photo is the { public_id, url } object from the server
    // (or null) — it never holds a blob URL. The local preview lives in
    // cohost.preview, set by ImageInput's onUpload in EventCohostsModal.
    if (event?.cohosts?.length) {
      event.cohosts.forEach(cohost => {
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

  // Populate form from location state (when coming back from preview)
  useEffect(() => {
    if (location.state?.event) {
      const eventData = location.state.event;
      setEvent(eventData);

      // Update settings based on event data
      setSettings({
        hasDescription: !!eventData.description,
        hasDressCode: !!eventData.dressCode?.type,
        hasChipIn: !!eventData.chipInDetails,
        hasEntryCode: !!eventData.entryCode,
        hasCohosts: eventData.cohosts?.length > 0,
        hasGuestListApproval: false, // Not implemented yet
        hasAttendeeLimit: !!eventData.attendeeLimit,
      });

      // Clear location state to prevent re-population on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Format location for display in ListInput
  const locationFormatted =
    event?.eventType === "online"
      ? `Online event - ${event?.meetingURL || "No meeting URL set"}`
      : `${event?.location?.venue ? `${event.location.venue}, ` : ""}${event?.location?.state ? `${event.location.state}` : ""}`;

  // Format description for display in ListInput
  const descriptionFormatted = event?.description
    ? event.description.length > 50
      ? event.description.slice(0, 50) + "..."
      : event.description
    : "";

  // Format cohosts for display in ListInput
  const cohostsFormatted = event?.cohosts?.length
    ? event.cohosts.map(cohost => cohost.name || cohost.email).join(", ")
    : "";

  // Format start date for display in ListInput
  const startDateFormatted = event?.startDate
    ? format(new Date(event.startDate), "EEE,  MMM d, h:mm aa")
    : "";

  // Format end date for display in ListInput
  const endDateFormatted = event?.endDate
    ? format(new Date(event.endDate), "EEE,  MMM d, h:mm aa")
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

  // Validate required fields
  const validateRequiredFields = () => {
    const errors = {};
    if (!event.title) {
      errors.title = "Event title is required";
    }
    if (!event.startDate) {
      errors.date = "Event start date and time are required.";
    }
    if (!event.location.state.trim() && !event.meetingURL.trim()) {
      errors.location = "Event location is required.";
    }

    if (settings?.hasCohosts && event.cohosts.length <= 0) {
      errors.cohosts = "At least one cohost is required.";
    }

    if (event.category.length <= 0) {
      errors.categories = "At least one event category is required.";
    }

    // Optional fields
    if (settings?.hasDescription && !event.description.trim()) {
      errors.description = "Event description is required.";
    }
    if (settings?.hasDressCode && !event.dressCode?.type) {
      errors.dressCode = "Event dress code is required.";
    }
    if (settings?.hasChipIn && !event.chipInDetails) {
      errors.chipIn = "Event chip-in details are required.";
    }
    if (settings?.hasEntryCode && !event.entryCode) {
      errors.entryCode = "Event entry code is required.";
    }

    setValidation(errors);
    return Object.keys(errors).length === 0;
  };
  // Status state
  const [status, setStatus] = useState(null);
  // Error state
  const [error, setError] = useState(null);
  // Create event mutation
  const { mutateAsync: createEvent, isPending: isCreating } = useMutation({
    mutationFn: eventData => {
      const formData = new FormData();
      formData.append("title", eventData.title);
      formData.append("startDate", new Date(eventData.startDate).toISOString());
      formData.append("font", eventData.font);
      if (eventData.endDate) {
        formData.append("endDate", new Date(eventData.endDate).toISOString());
      }
      if (settings?.hasCohosts) {
        // Each cohost's `photo` (if kept) is already the raw
        // { public_id, url } object from EventCohostsModal — sent as-is.
        formData.append("cohosts", JSON.stringify(eventData.cohosts));
      }
      formData.append(
        "feeResponsibility",
        user.preferences?.eventFeesPaidBy || "host"
      );
      formData.append("category", JSON.stringify(eventData.category));
      formData.append("eventType", eventData.eventType);
      formData.append("isPrivate", JSON.stringify(eventData.isPrivate));
      formData.append("isPublished", JSON.stringify(!!eventData.isPublished));
      // Append image if it exists
      if (imageFile) {
        formData.append("image", imageFile);
      } else {
        formData.append("image", eventData.image);
      }
      // Append description if it exists
      if (eventData.description) {
        formData.append("description", eventData.description);
      }
      // Append optional fields
      if (eventData.chipInDetails && settings?.hasChipIn) {
        formData.append(
          "chipInDetails",
          JSON.stringify(eventData.chipInDetails)
        );
      }
      if (eventData.eventType === "offline") {
        formData.append("location", JSON.stringify(eventData.location));
      }
      if (eventData.eventType === "online") {
        formData.append("meetingURL", eventData.meetingURL);
      }
      if (eventData.dressCode) {
        formData.append("dressCode", JSON.stringify(eventData.dressCode));
      }
      if (settings?.hasEntryCode && eventData.entryCode) {
        formData.append("entryCode", eventData.entryCode);
      }
      if (settings?.hasAttendeeLimit && eventData.attendeeLimit) {
        formData.append("attendeeLimit", eventData.attendeeLimit);
      }
      // Append cohost images, one file per field named cohostImage_<index>,
      // matching that cohost's position in eventData.cohosts. Cohosts with
      // no new upload have `null` at their index in cohostImages and are
      // skipped — the backend preserves their existing photo object instead.
      if (settings?.hasCohosts && eventData.cohostImages?.length > 0) {
        eventData.cohostImages.forEach((file, index) => {
          if (file) formData.append(`cohostImage_${index}`, file);
        });
      }
      return eventsApi.createEvent(formData);
    },
    onSuccess: data => {
      if (data.status === "success") {
        // Invalidate queries to refetch the updated data
        queryClient.invalidateQueries(["user-events"]);
        queryClient.invalidateQueries(["userEventsCount"]);

        // Clear file
        setImageFile(null);
        // Set status to success
        setStatus("success");
        // Clear local images
        clearLocalImages();
        // Add event slug
        setEvent({ ...event, slug: data.data.slug });
      }
    },
    onError: err => {
      setStatus("error");
      setError(err.response?.data?.message || "Failed to create event");
    },
  });

  const { setActive } = useModalContext();

  // Handle create event
  const handleCreateEvent = isPublished => {
    if (!validateRequiredFields()) return;
    createEvent({ ...event, isPublished });
    setActive("create-event");
  };

  // Reset form
  const resetForm = () => {
    setEvent(initialEventState);
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
    setSettings(prev => ({
      ...prev,
      hasEntryCode: false,
      hasAttendeeLimit: false,
      hasGuestListApproval: false,
    }));
    setStatus(null);
    setError(null);
    setImageFile(null);
    clearLocalImages();
  };
  if (isPreview) {
    return (
      <CreateEventPreview
        event={event}
        setIsPreview={setIsPreview}
        settings={settings}
      />
    );
  }

  return (
    <div className="flex flex-col satoshi min-h-dvh bg-[#F0F0F0]">
      <main className="flex-1 px-4 flex flex-col max-w-[950px] mx-auto w-full py-10">
        {/* Navigation */}
        <div className="flex items-center justify-between gap-4">
          {/* Back button */}
          <TagButton
            text="Back"
            onClick={() => navigate(-1)}
            className="h-8 min-w-0 px-2"
            leftImg={<ArrowLeft2 size={16} />}
          />
          {/* Preview button */}
          <TagButton
            text="View Preview"
            className="h-8 min-w-0 px-2"
            rightImg={<Eye variant="Bold" size={16} />}
            onClick={() => setIsPreview(true)}
          />
        </div>
        {/* Create event form */}
        <div className="flex flex-col md:flex-row gap-6 md:gap-12 mt-10 md:mt-8">
          {/* Image section */}
          <div className="md:sticky md:top-24 md:self-start">
            <h3 className="text-sm text-[#001010] font-bold">Event Image</h3>
            <p className="text-xs mb-4 text-[#8A9191] leading-4.5 font-medium">
              Upload a JPEG or PNG file with a size of 2mb or less
            </p>
            <Modal.Open opens="image-templates">
              <div className="cursor-pointer">
                <EventImage
                  imageUrl={event.image}
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
            <div className="mb-6">
              <div className="border border-[#F9F9F9] p-[2px] bg-[#E5E7E3] rounded-full inline-flex items-center">
                <TagButton
                  text="Private"
                  className={twMerge(
                    "satoshi min-w-auto h-7.5 px-3 bg-transparent text-[#B0B5B5] border-transparent",
                    event.isPrivate &&
                      "bg-white text-[#011F0F] hover:bg-white hover:text-[#011F0F]"
                  )}
                  onClick={() => setEvent({ ...event, isPrivate: true })}
                />
                <TagButton
                  text="Public"
                  className={twMerge(
                    "satoshi min-w-auto px-3 h-7.5 bg-transparent text-[#B0B5B5] border-transparent",
                    !event.isPrivate &&
                      "bg-white text-[#011F0F] hover:bg-white hover:text-[#011F0F]"
                  )}
                  onClick={() => {
                    setSettings(prev => ({ ...prev, hasChipIn: false }));
                    setValidation(prev => ({ ...prev, chipIn: "" }));
                    setEvent(prev => ({ ...prev, chipInDetails: null }));
                    setEvent(prev => ({ ...prev, isPrivate: false }));
                  }}
                />
              </div>
              <p className="text-xs text-[#8A9191] mt-2 font-medium">
                {event.isPrivate
                  ? "Shh... it’s exclusive! Only those with the magic link can RSVP."
                  : "Open to all! Let the world (or at least your city) know what’s happening!"}
              </p>
            </div>
            {/* Event title */}
            <EventName
              value={event.title}
              font={event.font}
              error={validation.title}
              onChange={value => {
                setEvent({ ...event, title: value });
                if (validation.title && value.trim())
                  setValidation(prev => ({ ...prev, title: "" }));
              }}
              onSelect={newFont => setEvent({ ...event, font: newFont })}
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
                      ? `${startDateFormatted}${event.endDate ? ` - ${endDateFormatted}` : ""}`
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
                    rightIcon={
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          setEvent(prev => ({
                            ...prev,
                            cohosts: [],
                            cohostImages: [],
                          }));
                          setSettings(prev => ({
                            ...prev,
                            hasCohosts: false,
                          }));
                          setValidation(prev => ({ ...prev, cohosts: "" }));
                        }}
                      >
                        <Trash variant="Outline" size={16} />
                      </button>
                    }
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
                    event.category.length > 0 ? (
                      <React.Fragment>
                        {event.category.map((cat, index) => (
                          <TagButton
                            key={index}
                            className={twMerge(
                              "pointer-events-none satoshi",
                              categories[cat]
                                ? categories[cat]
                                : "text-[#001010]"
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
                          setEvent(prev => ({
                            ...prev,
                            description: "",
                          }));
                          setSettings(prev => ({
                            ...prev,
                            hasDescription: false,
                          }));
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
                    content={`${event.dressCode ? event.dressCode.type : ""}${event.dressCode?.details ? ` - ${event.dressCode.details}` : ""}`}
                    error={validation.dressCode}
                    leftIcon={<Colorfilter variant="Bold" />}
                    rightIcon={
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          setEvent(prev => ({
                            ...prev,
                            dressCode: {
                              type: "Casual",
                            },
                          }));
                          setSettings(prev => ({
                            ...prev,
                            hasDressCode: false,
                          }));
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
              {settings?.hasChipIn && event.isPrivate && (
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
                          setEvent(prev => ({
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
              {/* Event entry code */}
              {settings?.hasEntryCode && (
                <Modal.Open opens="event-entry-code">
                  <ListInput
                    placeholder="Entry Code"
                    content={event.entryCode}
                    error={validation.entryCode}
                    leftIcon={<Lock1 variant="Bold" />}
                  />
                </Modal.Open>
              )}
              {/* Event attendee limit */}
              {settings?.hasAttendeeLimit && (
                <Modal.Open opens="event-attendee-limit">
                  <ListInput
                    placeholder="Attendee Limit"
                    content={event.attendeeLimit}
                    leftIcon={<People variant="Bold" />}
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
                      className="satoshi"
                      onClick={() =>
                        setSettings(prev => ({
                          ...prev,
                          hasCohosts: !prev.hasCohosts,
                        }))
                      }
                      leftImg={<Add />}
                    />
                  )}
                  {!settings?.hasChipIn && event.isPrivate && (
                    <TagButton
                      text="Chip In"
                      leftImg={<Add />}
                      className="satoshi"
                      onClick={() => {
                        setSettings(prev => ({
                          ...prev,
                          hasChipIn: !prev.hasChipIn,
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
            {/*Event Settings */}

            {0 === 3 && (
              <div className="mt-6">
                <TextButton
                  text="Event Settings"
                  variant="tertiary"
                  onClick={() => setEventSettingsOpen(prev => !prev)}
                  className={twMerge(
                    "w-full relative h-9 text-sm flex justify-between",
                    eventSettingsOpen && "bg-[#E5E7E3]"
                  )}
                  rightImg={
                    <ArrowDown2
                      variant="Outline"
                      color="#011F0F"
                      className={`absolute right-4 transition-all duration-200 ease-in-out top-1/2 -translate-y-1/2 ${eventSettingsOpen ? "rotate-180" : ""}`}
                    />
                  }
                />
                <div
                  className={`max-h-0 overflow-hidden transition-all duration-200 ease-in-out ${eventSettingsOpen ? "max-h-[500px]" : ""}`}
                >
                  <div className="flex flex-col pt-3 gap-y-3">
                    {/* Guest List Approval */}
                    <ListInput
                      placeholder="Approve all guests before the event"
                      title="Guest List Approval"
                      leftIcon={<UserTick variant="Bold" />}
                      onClick={() =>
                        setSettings(prev => ({
                          ...prev,
                          hasGuestListApproval: !prev.hasGuestListApproval,
                        }))
                      }
                      rightIcon={
                        <Toggle
                          checked={settings.hasGuestListApproval}
                          readOnly
                          className="pointer-events-none"
                        />
                      }
                    />
                    {/* Entry Code */}
                    <ListInput
                      placeholder="Require attendees to enter a code"
                      title="Entry Code"
                      onClick={() => {
                        // toggle the entry code
                        setSettings(prev => ({
                          ...prev,
                          hasEntryCode: !prev.hasEntryCode,
                        }));
                        // clear validation
                        setValidation(prev => ({ ...prev, entryCode: "" }));
                        // if the user unchecks the entry code, remove the entry code
                        if (settings.hasEntryCode) {
                          setEvent(prev => ({ ...prev, entryCode: "" }));
                        }
                      }}
                      leftIcon={<Lock1 variant="Bold" />}
                      rightIcon={
                        <Toggle
                          checked={settings.hasEntryCode}
                          readOnly
                          className="pointer-events-none"
                        />
                      }
                    />
                    {/* Attendee Limit */}
                    <ListInput
                      placeholder="Set a limit to the number of attendees"
                      title="Attendee Limit"
                      onClick={() => {
                        setSettings(prev => ({
                          ...prev,
                          hasAttendeeLimit: !prev.hasAttendeeLimit,
                        }));
                        // if the user unchecks the attendee limit, remove the attendee limit
                        if (settings.hasAttendeeLimit) {
                          setEvent(prev => ({ ...prev, attendeeLimit: null }));
                        } else {
                          setEvent(prev => ({ ...prev, attendeeLimit: 10 }));
                        }
                      }}
                      leftIcon={<People variant="Bold" />}
                      rightIcon={
                        <Toggle
                          checked={settings.hasAttendeeLimit}
                          readOnly
                          className="pointer-events-none"
                        />
                      }
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="py-6">
              {/* Save buttons */}
              <div className="flex items-center justify-between">
                <TextButton
                  variant="secondary"
                  text="Save draft"
                  onClick={() => handleCreateEvent(false)}
                />
                <TextButton
                  variant="primary"
                  text="Create event"
                  onClick={() => handleCreateEvent(true)}
                />
              </div>
            </div>
          </div>
        </div>
      </main>
      {/* Image templates modal */}
      <ImageTemplatesModal
        onSave={data => {
          setEvent({ ...event, image: data.image });
          setImageFile(data.file);
        }}
        defaultImage={event.image}
      />
      {/* Event date modal */}
      <EventDateModal
        data={{
          startDate: event.startDate,
          endDate: event.endDate,
        }}
        onSave={newDates => {
          setEvent({
            ...event,
            startDate: newDates.startDate,
            endDate: newDates.endDate,
          });
          setValidation(prev => ({ ...prev, date: "" }));
        }}
      />
      {/* Event location modal */}
      <EventLocationModal
        locationData={event.location}
        eventType={event.eventType}
        meetingURL={event.meetingURL}
        onSave={data => {
          handleSetLocation(data);
          setValidation(prev => ({ ...prev, location: "" }));
        }}
      />
      {/* Event cohosts modal */}
      <EventCohostsModal
        cohostsData={event.cohosts}
        onSave={(newCohosts, cohostImages) => {
          setEvent({
            ...event,
            cohosts: newCohosts,
            cohostImages: cohostImages,
          });
          setValidation(prev => ({ ...prev, cohosts: "" }));
        }}
      />
      {/* Event categories modal */}
      <EventTypeModal
        categoriesData={event.category}
        onSave={data => {
          setEvent({ ...event, category: data });
          setValidation(prev => ({ ...prev, categories: "" }));
        }}
      />
      {/* Event description modal */}
      {settings.hasDescription && (
        <EventDescriptionModal
          descriptionData={event.description}
          onSave={description => {
            setEvent({ ...event, description });
            setValidation(prev => ({ ...prev, description: "" }));
          }}
        />
      )}
      {/* Event dress code modal */}
      {settings.hasDressCode && (
        <EventDressCodeModal
          dressCodeData={event.dressCode}
          onSave={data => {
            setEvent({ ...event, dressCode: data });
            setValidation(prev => ({ ...prev, dressCode: "" }));
          }}
        />
      )}
      {/* Event chip in modal */}
      {settings.hasChipIn && event.isPrivate && (
        <EventChipInModal
          chipInData={event.chipInDetails}
          onSave={data => {
            setEvent({ ...event, chipInDetails: data });
            setValidation(prev => ({ ...prev, chipIn: "" }));
          }}
        />
      )}
      {/* Event entry code modal */}
      {settings.hasEntryCode && (
        <EventEntryCodeModal
          entryCodeData={event.entryCode}
          onSave={entryCode => {
            setEvent({ ...event, entryCode });
            setValidation(prev => ({ ...prev, entryCode: "" }));
          }}
        />
      )}
      {/* Event attendee limit modal */}
      {settings.hasAttendeeLimit && (
        <EventAttendeeLimitModal
          attendeeLimitData={event.attendeeLimit}
          onSave={attendeeLimit => {
            setEvent({ ...event, attendeeLimit });
          }}
        />
      )}
      {/* Create event modal */}
      <CreateEventModal
        event={{
          title: event.title,
          slug: event.slug,
          startDate: event.startDate,
          image: event.image,
        }}
        loading={isCreating}
        status={status}
        error={error}
        resetForm={resetForm}
      />
    </div>
  );
}

export default CreateEvent;
