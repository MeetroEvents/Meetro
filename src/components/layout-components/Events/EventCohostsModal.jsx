import InputIcon from "@/assets/icons/InputIcon";
import Avatar from "../Avatar";
import IconButton from "../Buttons/IconButton";
import TagButton from "../Buttons/TagButton";
import TextButton from "../Buttons/TextButtons";
import FormGroup from "../Inputs/FormGroup";
import ImageInput from "../Inputs/ImageInput";
import InputField from "../Inputs/InputField";
import SelectInput from "../Inputs/SelectInput";
import Modal from "../Modal/Modal";
import { useModalContext } from "../Modal/ModalContext";
import { Crown, Sms, Trash, User } from "iconsax-reactjs";
import { useEffect, useState } from "react";
import { twMerge } from "tailwind-merge";

const roleOptions = [
  { id: 1, name: "Co-host" },
  { id: 2, name: "Moderator" },
  { id: 3, name: "Speaker" },
];

// Shape of a fresh, in-progress cohost being composed in step 1.
// `photo`   -> existing { public_id, url } object carried over untouched (only relevant if editing, not used here)
// `preview` -> local preview string for <Avatar> / <ImageInput> (blob URL or pasted URL)
// `file`    -> File object if a new image was picked, else null
const emptyCohost = {
  email: "",
  role: "",
  name: "",
  photo: null,
  preview: "",
  file: null,
};

export default function EventCohostsModal({ onSave, cohostsData }) {
  const { close } = useModalContext();
  const [editedCohosts, setEditedCohosts] = useState(cohostsData || []);
  const [currentStep, setCurrentStep] = useState(1);
  const [hasAccount, setHasAccount] = useState(true);
  const [cohost, setCohost] = useState(emptyCohost);
  // null while adding a brand-new cohost; holds the array index while an
  // existing cohost from the review list is being edited.
  const [editingIndex, setEditingIndex] = useState(null);

  // Validation state for form fields
  const [validation, setValidation] = useState({
    email: "",
    role: "",
    name: "",
  });

  // Initialize cohosts and step based on incoming data
  useEffect(() => {
    setEditedCohosts(cohostsData || []);
    if (cohostsData && cohostsData.length > 0) {
      setCurrentStep(2);
    } else {
      setCurrentStep(1);
    }
  }, [cohostsData]);

  // Validate form fields before adding a cohost
  const validateForm = () => {
    let isValid = true;
    const newValidation = { email: "", role: "", name: "" };
    if (!cohost.email) {
      newValidation.email = "Email is required";
      isValid = false;
    }
    if (!cohost.role) {
      newValidation.role = "Role is required";
      isValid = false;
    }
    if (!hasAccount) {
      if (!cohost.name) {
        newValidation.name = "Name is required";
        isValid = false;
      }
    }
    setValidation(newValidation);
    return isValid;
  };

  // Add a new cohost, or save changes to the one currently being edited
  const addCohost = () => {
    if (!validateForm()) return;
    if (editingIndex !== null) {
      setEditedCohosts(s => s.map((c, i) => (i === editingIndex ? cohost : c)));
      setEditingIndex(null);
    } else {
      setEditedCohosts(s => [...s, cohost]);
    }
    setCohost(emptyCohost);
    setCurrentStep(2);
  };

  // Load an existing cohost from the review list back into the step-1 form
  const editCohost = index => {
    const target = editedCohosts[index];
    setCohost({
      email: target.email || "",
      role: target.role || "",
      name: target.name || "",
      photo: target.photo || null,
      preview: target.preview || target.photo?.url || "",
      file: target.file || null,
    });
    // "No Meetro Account" cohosts are the only ones with a name/photo, since
    // that form of the step-1 form is what collects those fields.
    setHasAccount(!(target.name || target.photo || target.preview));
    setEditingIndex(index);
    setValidation({ email: "", role: "", name: "" });
    setCurrentStep(1);
  };

  // Reset all data to initial state
  const resetData = () => {
    setEditedCohosts(cohostsData || []);
    setCurrentStep((cohostsData || []).length > 0 ? 2 : 1);
    setHasAccount(true);
    setValidation({ email: "", role: "", name: "" });
    setCohost(emptyCohost);
    setEditingIndex(null);
  };

  // Remove a cohost from the list by index
  const removeCohost = index => {
    setEditedCohosts(s => s.filter((_, i) => i !== index));
    if (editingIndex === index) {
      setEditingIndex(null);
      setCohost(emptyCohost);
    }
    if (editedCohosts.length === 1) {
      setHasAccount(true);
      setCurrentStep(1);
    }
  };

  // Navigate to the previous step
  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setHasAccount(true);
      setEditingIndex(null);
      setCohost(emptyCohost);
    }
  };

  // Save the edited cohosts and close the modal.
  //
  // cohostsToSave[i] mirrors editedCohosts[i] 1:1 by index, so the parent
  // can attach any file at cohostImages[i] under the form field
  // "cohostImage_<i>" and the backend will match them up correctly.
  //
  // - If a cohost has a new `file`, we drop the old `photo` object from the
  //   payload (the upload will overwrite it server-side anyway).
  // - If a cohost has no new `file` but has an existing `photo` object
  //   (public_id + url) carried over from cohostsData, we resend it as-is
  //   so the backend preserves it instead of deleting it.
  // - Freshly-added cohosts with no account and no file at all (e.g. only
  //   pasted a URL) won't have a public_id — that's expected, they're new.
  const handleSave = () => {
    const cohostImages = editedCohosts.map(c => c.file || null);

    const cohostsToSave = editedCohosts.map(
      ({ file, preview, photo, ...rest }) => ({
        ...rest,
        ...(!file && photo ? { photo } : {}),
      })
    );

    onSave?.(cohostsToSave, cohostImages);
    close();
  };

  return (
    <Modal.Window
      name="event-cohosts"
      title={currentStep === 1 ? "Add Cohosts?" : "Review Cohosts"}
      onClose={resetData}
    >
      {/* Content goes here */}
      <div className="satoshi font-bold text-sm text-[#010E1F]">
        {currentStep === 1 ? (
          /* Step 1: Add Cohosts Form */
          <div className="flex flex-col gap-y-12">
            <div className="flex flex-col gap-4">
              {/* Cohost account status */}
              <div>
                <div className="border border-[#F9F9F9] p-[2px] bg-[#E5E7E3] rounded-full inline-flex items-center">
                  <TagButton
                    text="Has Meetro Account"
                    className={twMerge(
                      "satoshi min-w-auto h-7.5 px-3 hover:bg-transparent bg-transparent text-[#B0B5B5] border-transparent",
                      hasAccount && "bg-white text-[#011F0F] hover:bg-white"
                    )}
                    onClick={() => {
                      setHasAccount(true);
                      setValidation({ name: "", email: "", role: "" });
                      setCohost(emptyCohost);
                    }}
                  />
                  <TagButton
                    text="No Meetro Account"
                    className={twMerge(
                      "satoshi min-w-auto h-7.5 px-3 bg-transparent hover:bg-transparent text-[#B0B5B5] border-transparent",
                      !hasAccount && "bg-white text-[#011F0F] hover:bg-white"
                    )}
                    onClick={() => {
                      setHasAccount(false);
                      setValidation({
                        ...validation,
                        name: "",
                        email: "",
                        role: "",
                      });
                      setCohost(emptyCohost);
                    }}
                  />
                </div>
              </div>
              {/* Cohost photo */}
              {!hasAccount && (
                <ImageInput
                  size="sm"
                  onUpload={({ file, previewUrl }) =>
                    setCohost(c => ({
                      ...c,
                      preview: previewUrl,
                      file,
                      photo: null,
                    }))
                  }
                  imgUrl={cohost.preview}
                  setImgUrl={value =>
                    setCohost(c => ({
                      ...c,
                      preview: value,
                      file: null,
                      photo: null,
                    }))
                  }
                />
              )}
              {/* Cohost name */}
              {!hasAccount && (
                <FormGroup
                  label="Name"
                  message={
                    validation.name
                      ? {
                          text: validation.name,
                          type: "error",
                        }
                      : null
                  }
                >
                  <InputField
                    leftIcon={
                      <InputIcon>
                        <User variant="Bold" />
                      </InputIcon>
                    }
                    placeholder="Enter the name you want displayed"
                    value={cohost.name}
                    onChange={e => {
                      setCohost({ ...cohost, name: e.target.value });
                      setValidation({ ...validation, name: "" });
                    }}
                  />
                </FormGroup>
              )}

              {/* Cohost email */}
              <FormGroup
                label="Email"
                message={
                  validation.email
                    ? {
                        text: validation.email,
                        type: "error",
                      }
                    : null
                }
              >
                <InputField
                  leftIcon={
                    <InputIcon>
                      <Sms variant="Bold" />
                    </InputIcon>
                  }
                  placeholder="Enter the person's email"
                  type="email"
                  value={cohost.email}
                  onChange={e => {
                    setCohost({ ...cohost, email: e.target.value });
                    setValidation({ ...validation, email: "" });
                  }}
                />
              </FormGroup>
              {/* Cohost role */}
              <FormGroup
                label="Role"
                message={
                  validation.role
                    ? {
                        text: validation.role,
                        type: "error",
                      }
                    : null
                }
              >
                <SelectInput
                  placeholder="Choose one"
                  value={cohost.role}
                  setValue={role => {
                    setCohost({ ...cohost, role });
                    setValidation({ ...validation, role: "" });
                  }}
                  icon={
                    <InputIcon>
                      <Crown variant="Bold" />
                    </InputIcon>
                  }
                  options={roleOptions}
                />
              </FormGroup>
            </div>
            <div className="flex items-center justify-center md:justify-start gap-x-4">
              <TextButton
                text="Cancel"
                variant="tertiary"
                onClick={() => {
                  close();
                  resetData();
                }}
              />
              <TextButton
                text={editingIndex !== null ? "Save Changes" : "Add Cohost"}
                onClick={addCohost}
                className="min-w-auto"
              />
            </div>
          </div>
        ) : (
          /* Step 2: Review Cohosts */
          <div className="flex flex-col gap-y-12">
            <div className="flex flex-col gap-4">
              {/* Cohosts list */}
              {editedCohosts.length > 0 && (
                <ul className="flex flex-col gap-y-4">
                  {editedCohosts.map((cohost, index) => (
                    <li key={index} className="flex flex-col gap-1">
                      <p className="font-bold text-[18px] leading-7">
                        Collaborator {index + 1}
                      </p>
                      <div
                        className="rounded-2xl flex items-center justify-between bg-white p-4 cursor-pointer"
                        onClick={() => editCohost(index)}
                      >
                        {/*  Cohost info */}
                        <div className="flex items-center gap-2">
                          <Avatar
                            src={
                              cohost?.preview ||
                              cohost?.photo?.url ||
                              cohost?.id?.photo?.url
                            }
                            size="sm"
                          />
                          <div className="font-medium">
                            <p className="text-base text-[#001010]">
                              {cohost?.name || cohost.email}
                            </p>
                            <p className="text-xs text-[#8A9191]">
                              {cohost?.role}
                            </p>
                          </div>
                        </div>
                        {/* Delete button */}
                        <IconButton
                          variant="tertiary"
                          icon={<Trash variant="Bold" color="#DB2863" />}
                          onClick={e => {
                            e.stopPropagation();
                            removeCohost(index);
                          }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <div className="flex items-center justify-between">
                {editedCohosts.length < 3 && (
                  <TextButton
                    variant="secondary"
                    text="Add More"
                    className="sm:min-w-auto min-w-full"
                    onClick={goToPreviousStep}
                  />
                )}

                <p className="text-sm text-[#8A9191] flex-1 font-medium text-right">
                  Added {editedCohosts.length}/3 cohosts
                </p>
              </div>
            </div>
            <div className="flex items-center justify-center md:justify-start gap-x-4">
              <TextButton
                text="Back"
                variant="tertiary"
                onClick={goToPreviousStep}
              />
              <TextButton text="Save" onClick={handleSave} />
            </div>
          </div>
        )}
      </div>
    </Modal.Window>
  );
}
