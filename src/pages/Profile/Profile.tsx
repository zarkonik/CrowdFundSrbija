import { useState, useEffect, useRef } from "react";
// @ts-ignore
import { DisplayCampaigns, CustomButton } from "../../components";
import { useStateContext } from "../../context";
import "./Profile.css";

const Profile = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [campaigns, setCampaigns] = useState([]);
  const [deletedCampaigns, setDeletedCampaigns] = useState([]);
  const [isLoadingDeleted, setIsLoadingDeleted] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const [paypalMode, setPaypalModeState] = useState<"sandbox" | "live" | null>(
    null,
  );
  const [isSavingMode, setIsSavingMode] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const {
    address,
    userName,
    userEmail,
    userPhotoURL,
    isAdmin,
    getUserCampaigns,
    getDeletedCampaigns,
    getPaypalMode,
    setPaypalMode,
    updateProfilePhoto,
  }: any = useStateContext();

  const handlePhotoChange = async (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoError("");
    setIsUploadingPhoto(true);
    try {
      await updateProfilePhoto(file);
    } catch (err: any) {
      setPhotoError(err?.message ?? "Could not upload photo. Please try again.");
    } finally {
      setIsUploadingPhoto(false);
      e.target.value = "";
    }
  };

  const fetchCampaigns = async () => {
    setIsLoading(true);
    const data = await getUserCampaigns();
    setCampaigns(data);
    setIsLoading(false);
  };

  const fetchDeletedCampaigns = async () => {
    setIsLoadingDeleted(true);
    const data = await getDeletedCampaigns();
    setDeletedCampaigns(data);
    setIsLoadingDeleted(false);
  };

  useEffect(() => {
    if (address) fetchCampaigns();
  }, [address]);

  useEffect(() => {
    if (isAdmin) {
      getPaypalMode().then(setPaypalModeState);
      fetchDeletedCampaigns();
    }
  }, [isAdmin]);

  const handleSwitchMode = async (mode: "sandbox" | "live") => {
    if (mode === paypalMode) return;
    setIsSavingMode(true);
    await setPaypalMode(mode);
    setPaypalModeState(mode);
    setIsSavingMode(false);
  };

  return (
    <div>
      <div className="profile-info">
        <div
          className="profile-avatar-wrap"
          onClick={() => photoInputRef.current?.click()}
        >
          {userPhotoURL ? (
            <img src={userPhotoURL} alt="avatar" className="profile-avatar" />
          ) : (
            <div className="profile-avatar-fallback">
              {(userName ?? "?").charAt(0).toUpperCase()}
            </div>
          )}
          <div className="profile-avatar-overlay">
            {isUploadingPhoto ? "Uploading..." : "Change"}
          </div>
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            className="profile-avatar-input"
            onChange={handlePhotoChange}
          />
        </div>

        <div>
          <h2 className="profile-name">{userName ?? "Anonymous"}</h2>
          {userEmail && <p className="profile-email">{userEmail}</p>}
          <p className="profile-campaign-count">
            {campaigns.length} campaign{campaigns.length === 1 ? "" : "s"}{" "}
            created
          </p>
          {photoError && <p className="profile-photo-error">{photoError}</p>}
        </div>
      </div>

      {isAdmin && (
        <div className="profile-admin-panel">
          <p className="profile-admin-title">Admin: PayPal mode</p>
          <p className="profile-admin-subtitle">
            Controls which PayPal environment every donation on the site uses
            — Sandbox (test money) or Live (real money). Current mode:{" "}
            <strong>{paypalMode ?? "loading..."}</strong>
          </p>
          <div className="profile-admin-mode-buttons">
            <CustomButton
              btnType="button"
              title="Sandbox"
              styles={`profile-admin-mode-button ${
                paypalMode === "sandbox" ? "is-active" : ""
              }`}
              handleClick={() => handleSwitchMode("sandbox")}
            />
            <CustomButton
              btnType="button"
              title="Live"
              styles={`profile-admin-mode-button ${
                paypalMode === "live" ? "is-active" : ""
              }`}
              handleClick={() => handleSwitchMode("live")}
            />
          </div>
          {isSavingMode && (
            <p className="profile-admin-subtitle">Saving...</p>
          )}
        </div>
      )}

      <DisplayCampaigns
        title="My Campaigns"
        isLoading={isLoading}
        campaigns={campaigns}
      />

      {isAdmin && (
        <DisplayCampaigns
          title="Removed Campaigns"
          isLoading={isLoadingDeleted}
          campaigns={deletedCampaigns}
        />
      )}
    </div>
  );
};

export default Profile;
