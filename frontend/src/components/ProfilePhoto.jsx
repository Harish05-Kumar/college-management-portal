import React from "react";
import { UserRound } from "lucide-react";

function ProfilePhoto({ alt = "Profile photo", size = "small", src }) {
  const className = `profile-photo profile-photo-${size}`;

  if (src) {
    return <img className={className} src={src} alt={alt} />;
  }

  return (
    <div className={`${className} profile-photo-fallback`} aria-label={alt} role="img">
      <UserRound size={size === "detail" ? 64 : size === "dashboard" ? 42 : 28} />
    </div>
  );
}

export default ProfilePhoto;
