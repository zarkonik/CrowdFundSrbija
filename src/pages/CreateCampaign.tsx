import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
// @ts-ignore
import { useStateContext } from "../context";
import { storage } from "../firebase";
// @ts-ignore
import { money } from "../assets";
// @ts-ignore
import { CustomButton, FormField, Loader } from "../components";

const CreateCampaign = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const { createCampaign }: any = useStateContext();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    name: "",
    title: "",
    description: "",
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
      title: form.title,
      description: form.description,
      image: imageUrl,
      targetCents: Math.round(parseFloat(form.target) * 100),
      deadline: Math.floor(new Date(form.deadline).getTime() / 1000),
    });

    setIsLoading(false);
    navigate("/");
  };

  return (
    <div className="bg-[#1c1c24] flex justify-center items-center flex-col rounded-[10px] sm:p-10 p-4">
      {isLoading && <Loader />}
      <div className="flex justify-center items-center p-[16px] sm:min-w-[380px] bg-[#3a3a43] rounded-[10px]">
        <h1 className="font-epilogue font-bold sm:text-[25px] text-[18px] leading-[38px] text-white">
          Start a Campaign
        </h1>
      </div>

      <form
        onSubmit={handleSubmit}
        className="w-full mt-[65px] flex flex-col gap-[30px]"
      >
        <div className="flex flex-wrap gap-[40px]">
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

        <div className="w-full flex justify-start items-center p-4 bg-[#8c6dfd] h-[120px] rounded-[10px]">
          <img
            src={money}
            alt="money"
            className="w-[40px] h-[40px] object-contain"
          />
          <h4 className="font-epilogue font-bold text-[25px] text-white ml-[20px]">
            You will get 100% of the raised amount
          </h4>
        </div>

        <div className="flex flex-wrap gap-[40px]">
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

        <label className="flex-1 w-full flex flex-col">
          <span className="font-epilogue font-medium text-[14px] leading-[22px] text-[#808191] mb-[10px]">
            Campaign image *
          </span>
          <input
            required
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
            className="py-[15px] sm:px-[25px] px-[15px] outline-none border-[1px] border-[#3a3a43] bg-transparent font-epilogue text-white text-[14px] rounded-[10px] sm:min-w-[300px]"
          />
        </label>

        <div className="flex justify-center items-center mt-[40px]">
          <CustomButton
            btnType="submit"
            title="Submit new campaign"
            styles="bg-[#1dc071]"
          />
        </div>
      </form>
    </div>
  );
};

export default CreateCampaign;
