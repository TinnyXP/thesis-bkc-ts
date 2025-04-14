import React from "react";
import { Button, Input, Avatar } from "@heroui/react";
import { LuHardDriveUpload } from "react-icons/lu";
import { FiEdit } from "react-icons/fi";
import { BsLine } from "react-icons/bs";

interface Profile {
  username: string;
  email: string;
  avatar: string;
  isLineConnected: boolean;
}

export default function ProfileDetail() {
  const [isEditing, setIsEditing] = React.useState(false);
  const [profile, setProfile] = React.useState<Profile>({
    username: "John Doe",
    email: "john.doe@example.com",
    avatar: "https://img.heroui.chat/image/avatar?w=200&h=200&u=1",
    isLineConnected: true
  });

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    setIsEditing(false);
    // Save profile changes
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleRestoreFromLine = () => {
    // Restore profile from Line
    console.log("Restoring from Line");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-4">
        <Avatar
          src={profile.avatar}
          className="w-24 h-24"
          isBordered
          color="primary"
        />
        {isEditing && (
          <Button 
            size="sm"
            variant="flat"
            color="primary"
            startContent={<LuHardDriveUpload size={20}/>}
          >
            Change Photo
          </Button>
        )}
      </div>

      <div className="space-y-4">
        <Input
          label="Username"
          value={profile.username}
          isReadOnly={!isEditing}
          variant={isEditing ? "bordered" : "flat"}
        />
        <Input
          label="Email"
          value={profile.email}
          isReadOnly
          variant="flat"
        />
      </div>

      <div className="flex flex-wrap gap-2 justify-end">
        {!isEditing ? (
          <Button
            color="primary"
            startContent={<FiEdit size={20} />}
            onPress={handleEdit}
          >
            Edit Profile
          </Button>
        ) : (
          <>
            <Button
              variant="flat"
              color="danger"
              onPress={handleCancel}
            >
              Cancel
            </Button>
            <Button
              color="primary"
              onPress={handleSave}
            >
              Save Changes
            </Button>
          </>
        )}
        {profile.isLineConnected && (
          <Button
            variant="flat"
            color="primary"
            startContent={<BsLine size={20} />}
            onPress={handleRestoreFromLine}
          >
            Restore from Line
          </Button>
        )}
      </div>
    </div>
  );
}