import React from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Switch,
} from "@heroui/react";
import { FaBell, FaMoon } from "react-icons/fa6";

export interface SettingsModalProps {
  isOpen: boolean;
  onOpenChange: () => void;
}

export default function SettingsModal({ isOpen, onOpenChange }: SettingsModalProps) {
  const [notifications, setNotifications] = React.useState(true);
  const [darkMode, setDarkMode] = React.useState(false);

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      size="md"
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">Settings</ModalHeader>
            <ModalBody>
              <div className="flex flex-col gap-6">
                <div className="flex justify-between items-center">
                  <div className="flex gap-2 items-center">
                    <FaBell size={22} />
                    <span>Notifications</span>
                  </div>
                  <Switch
                    isSelected={notifications}
                    onValueChange={setNotifications}
                  />
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex gap-2 items-center">
                    <FaMoon size={22} />
                    <span>Dark Mode</span>
                  </div>
                  <Switch
                    isSelected={darkMode}
                    onValueChange={setDarkMode}
                  />
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button color="danger" variant="light" onPress={onClose}>
                Close
              </Button>
              <Button color="primary" onPress={onClose}>
                Save Changes
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}