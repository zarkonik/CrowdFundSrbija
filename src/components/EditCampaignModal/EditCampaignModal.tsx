import { useState } from "react";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { useStateContext } from "../../context";
import { storage } from "../../firebase";
import CustomButton from "../CustomButton/CustomButton";
import FormField from "../FormField/FormField";
import Loader from "../Loader/Loader";
// @ts-ignore
import { categories } from "../../constants";
import "./EditCampaignModal.css";

type EditCampaignModalProps = {
  campaign: any;
  hasDonations: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

const toDateInputValue = (unixSeconds: number) =>
  new Date(unixSeconds * 1000).toISOString().split("T")[0];

const EditCampaignModal = ({
  campaign,
  hasDonations,
  onClose,
  onSuccess,
}: EditCampaignModalProps) => {
  const { updateCampaign }: any = useStateContext();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    name: campaign.ownerName,
    title: campaign.title,
    description: campaign.description,
    category: campaign.category,
    target: (campaign.targetCents / 100).toString(),
    deadline: toDateInputValue(campaign.deadline),
  });

  const handleFormFieldChange = (fieldName: string, e: any) => {
    setForm({ ...form, [fieldName]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!hasDonations) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (new Date(form.deadline) < today) {
        setError("End date can't be in the past");
        return;
      }
    }

    setIsLoading(true);

    try {
      let imageUrl = campaign.image;
      if (imageFile) {
        const imageRef = storageRef(
          storage,
          `campaign-images/${Date.now()}-${imageFile.name}`,
        );
        await uploadBytes(imageRef, imageFile);
        imageUrl = await getDownloadURL(imageRef);
      }

      const updates: any = {
        ownerName: form.name,
        title: form.title,
        description: form.description,
        category: form.category,
        image: imageUrl,
      };

      if (!hasDonations) {
        updates.targetCents = Math.round(parseFloat(form.target) * 100);
        updates.deadline = Math.floor(
          new Date(form.deadline).getTime() / 1000,
        );
      }

      await updateCampaign(campaign.pId, updates);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="edit-campaign-modal-overlay">
      {isLoading && <Loader />}
      <div className="edit-campaign-modal">
        <h4 className="edit-campaign-modal-title">Edit Campaign</h4>

        <form className="edit-campaign-modal-form" onSubmit={handleSubmit}>
          <div className="edit-campaign-modal-row">
            <FormField
              labelName="Creator Name *"
              placeholder="John Doe"
              inputType="text"
              value={form.name}
              handleChange={(e: any) => handleFormFieldChange("name", e)}
            />
            <FormField
              labelName="Campaign Title *"
              placeholder="Campaign title"
              inputType="text"
              value={form.title}
              handleChange={(e: any) => handleFormFieldChange("title", e)}
              maxLength={70}
            />
          </div>

          <FormField
            labelName="Story *"
            placeholder="Campaign story"
            isTextArea
            value={form.description}
            handleChange={(e: any) => handleFormFieldChange("description", e)}
          />

          <label className="edit-campaign-modal-category-field">
            <span className="edit-campaign-modal-category-label">
              Category *
            </span>
            <select
              required
              value={form.category}
              onChange={(e) => handleFormFieldChange("category", e)}
              className="edit-campaign-modal-category-select"
            >
              {categories.map((category: string) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>

          {hasDonations && (
            <p className="edit-campaign-modal-locked-notice">
              This campaign already has donations, so the goal and deadline
              are locked — changing them after people have donated wouldn't
              be fair to backers who gave under the original terms.
            </p>
          )}

          <div className="edit-campaign-modal-row">
            <FormField
              labelName="Goal ($) *"
              placeholder="50.00"
              inputType="text"
              value={form.target}
              handleChange={(e: any) => handleFormFieldChange("target", e)}
              disabled={hasDonations}
            />
            <FormField
              labelName="End Date *"
              placeholder="End Date"
              inputType="date"
              value={form.deadline}
              min={new Date().toISOString().split("T")[0]}
              handleChange={(e: any) => handleFormFieldChange("deadline", e)}
              disabled={hasDonations}
            />
          </div>

          <label className="edit-campaign-modal-image-field">
            <span className="edit-campaign-modal-image-label">
              Replace campaign image (optional)
            </span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
              className="edit-campaign-modal-image-input"
            />
          </label>

          {error && <p className="edit-campaign-modal-error">{error}</p>}

          <div className="edit-campaign-modal-actions">
            <CustomButton
              btnType="submit"
              title="Save Changes"
              styles="edit-campaign-modal-save-button"
              handleClick={() => {}}
            />
            <CustomButton
              btnType="button"
              title="Cancel"
              styles="edit-campaign-modal-cancel-button"
              handleClick={onClose}
            />
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditCampaignModal;
