
import React, { useRef } from 'react';

interface ProfilePictureProps {
  src?: string | null;
  preview?: string | null;
  initial: string;
  isEditable: boolean;
  onFileSelect: (file: File) => void;
}

const ProfilePicture: React.FC<ProfilePictureProps> = ({ src, preview, initial, isEditable, onFileSelect }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleContainerClick = () => {
    if (isEditable && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  const displaySrc = preview || src;

  return (
    <button
      type="button"
      className="profile-picture-container"
      onClick={handleContainerClick}
      disabled={!isEditable}
      aria-label={isEditable ? "Change profile picture" : "Profile picture"}
      style={{ cursor: isEditable ? 'pointer' : 'default' }}
    >
      {displaySrc ? (
        <img src={displaySrc} alt="Profile" className="profile-picture" />
      ) : (
        <div className="profile-placeholder">
          <span>{initial}</span>
        </div>
      )}
      {isEditable && (
        <div className="upload-overlay">
          <i className="fas fa-camera fa-2x" aria-hidden="true"></i>
          <span className="mt-2 small">Change</span>
        </div>
      )}
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        className="hidden-file-input"
        onChange={handleFileChange}
        disabled={!isEditable}
        tabIndex={-1}
      />
    </button>
  );
};

export default ProfilePicture;