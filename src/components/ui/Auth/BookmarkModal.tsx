import React from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Listbox,
  ListboxItem,
} from "@heroui/react";
import { FaBookmark } from "react-icons/fa6";

export interface BookmarkModalProps {
  isOpen: boolean;
  onOpenChange: () => void;
}

interface Bookmark {
  id: string;
  title: string;
  url: string;
}

export default function BookmarkModal({ isOpen, onOpenChange }: BookmarkModalProps) {
  const bookmarks: Bookmark[] = [
    { id: "1", title: "HeroUI Documentation", url: "https://heroui.dev" },
    { id: "2", title: "React Documentation", url: "https://react.dev" },
    { id: "3", title: "TypeScript Documentation", url: "https://typescriptlang.org" },
  ];

  return (
    <Modal 
      isOpen={isOpen} 
      onOpenChange={onOpenChange}
      size="md"
      scrollBehavior="inside"
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">Bookmarks</ModalHeader>
            <ModalBody>
              <Listbox
                aria-label="Bookmark list"
                variant="flat"
                className="p-0 gap-0 divide-y divide-default-200"
              >
                {bookmarks.map((bookmark) => (
                  <ListboxItem
                    key={bookmark.id}
                    startContent={<FaBookmark size={22}/>}
                    description={bookmark.url}
                  >
                    {bookmark.title}
                  </ListboxItem>
                ))}
              </Listbox>
            </ModalBody>
            <ModalFooter>
              <Button color="danger" variant="light" onPress={onClose}>
                Close
              </Button>
              <Button color="primary" onPress={onClose}>
                Add Bookmark
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}