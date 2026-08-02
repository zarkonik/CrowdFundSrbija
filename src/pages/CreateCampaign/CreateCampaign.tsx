import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
// @ts-ignore
import { useStateContext } from "../../context";
import { storage } from "../../firebase";
// @ts-ignore
import { money } from "../../assets";
// @ts-ignore
import { CustomButton, FormField, Loader } from "../../components";
// @ts-ignore
import { categories } from "../../constants";
import "./CreateCampaign.css";

const CreateCampaign = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const { createCampaign }: any = useStateContext();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    name: "",
    title: "",
    description: "",
    category: categories[0],
    target: "",
    deadline: "",
  });

  const handleFormFieldChange = (fieldName: any, e: any) => {
    setForm({ ...form, [fieldName]: e.target.value });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    if (!imageFile) {
      alert("Please choose a campaign image");
      return;
    }

    setIsLoading(true);

    const imageRef = storageRef(
      storage,
      `campaign-images/${Date.now()}-${imageFile.name}`,
    );
    await uploadBytes(imageRef, imageFile);
    const imageUrl = await getDownloadURL(imageRef);

    await createCampaign({
      ownerName: form.name,
      title: form.title,
      description: form.description,
      category: form.category,
      image: imageUrl,
      targetCents: Math.round(parseFloat(form.target) * 100),
      deadline: Math.floor(new Date(form.deadline).getTime() / 1000),
    });

    setIsLoading(false);
    navigate("/");
  };

  return (
    <div className="create-campaign">
      {isLoading && <Loader />}
      <div className="create-campaign-header">
        <h1 className="create-campaign-title">Start a Campaign</h1>
      </div>

      <form onSubmit={handleSubmit} className="create-campaign-form">
        <div className="create-campaign-row">
          <FormField
            labelName="Your Name *"
            placeholder="John Doe"
            inputType="text"
            value={form.name}
            handleChange={(e: any) => handleFormFieldChange("name", e)}
          />
          <FormField
            labelName="Campaign Title *"
            placeholder="Write a title"
            inputType="text"
            value={form.title}
            handleChange={(e: any) => handleFormFieldChange("title", e)}
          />
        </div>

        <FormField
          labelName="Story *"
          placeholder="Write your story"
          isTextArea
          value={form.description}
          handleChange={(e: any) => handleFormFieldChange("description", e)}
        />

        <label className="create-campaign-category-field">
          <span className="create-campaign-category-label">Category *</span>
          <select
            required
            value={form.category}
            onChange={(e) => handleFormFieldChange("category", e)}
            className="create-campaign-category-select"
          >
            {categories.map((category: string) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>

        <div className="create-campaign-banner">
          <img
            src={money}
            alt="money"
            className="create-campaign-banner-icon"
          />
          <h4 className="create-campaign-banner-text">
            You will get 100% of the raised amount
          </h4>
        </div>

        <div className="create-campaign-row">
          <FormField
            labelName="Goal ($) *"
            placeholder="50.00"
            inputType="text"
            value={form.target}
            handleChange={(e: any) => handleFormFieldChange("target", e)}
          />
          <FormField
            labelName="End Date *"
            placeholder="End Date"
            inputType="date"
            value={form.deadline}
            handleChange={(e: any) => handleFormFieldChange("deadline", e)}
          />
        </div>

        <label className="create-campaign-image-field">
          <span className="create-campaign-image-label">
            Campaign image *
          </span>
          <input
            required
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
            className="create-campaign-image-input"
          />
        </label>

        <div className="create-campaign-submit-row">
          <CustomButton
            btnType="submit"
            title="Submit new campaign"
            styles="create-campaign-submit-button"
          />
        </div>
      </form>
    </div>
  );
};

export default CreateCampaign;
