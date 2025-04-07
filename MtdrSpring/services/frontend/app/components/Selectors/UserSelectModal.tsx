// app/components/UserSelectModal.tsx
import { useRef, useEffect, useState } from "react";
import { generateAvatarColor } from "~/lib/utils";
import type { User } from "~/types";

interface UserSelectModalProps {
  users: User[];
  currentUser: User | null;
  onUserChange: (userId: number) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  anchorRef: React.RefObject<HTMLElement | null>;
}

const MAX_VISIBLE_USERS = 5;
const USER_HEIGHT = 56;
const MODAL_WIDTH = 250;
const ANCHOR_OFFSET = 5;
const SIDEBAR_THRESHOLD = 50;

export default function UserSelectModal({
  users,
  currentUser,
  onUserChange,
  isOpen,
  setIsOpen,
  anchorRef,
}: UserSelectModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top?: string; left?: string }>({});

  const modalHeight = Math.min(users.length, MAX_VISIBLE_USERS) * USER_HEIGHT;

  const updatePosition = () => {
    const anchorRect = anchorRef.current?.getBoundingClientRect();
    if (anchorRect) {
      let newPosition: { top?: string; left?: string } = {
        top: `${anchorRect.top - modalHeight}px`,
        left: `${anchorRect.right - MODAL_WIDTH - ANCHOR_OFFSET}px`,
      };

      const sidebarExpanded = anchorRect.left > SIDEBAR_THRESHOLD;

      if (!sidebarExpanded) {
        newPosition = {
          top: `${anchorRect.top - modalHeight - ANCHOR_OFFSET}px`,
          left: `${anchorRect.left + ANCHOR_OFFSET}px`,
        };
      }

      setPosition(newPosition);
    }
  };

  useEffect(() => {
    updatePosition();

    function handleResize() {
      updatePosition();
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [anchorRef, users]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, setIsOpen, anchorRef]);

  if (!isOpen) return null;

  return (
    <div
      ref={modalRef}
      className="fixed z-50 bg-oc-primary rounded-lg shadow-lg border border-oc-outline-light w-[250px]"
      style={{ ...position, height: `${modalHeight + 8}px` }}
    >
      <div
        className={`py-1 px-1 space-y-1 overflow-y-scroll`}
        style={{ maxHeight: `${modalHeight + 4}px` }}
      >
        {users.length === 0 && (
          <div className="px-4 py-2 text-sm text-stone-400">
            No hay usuarios disponibles
          </div>
        )}

        {users.map((user) => (
          <button
            key={user.id}
            onClick={() => {
              onUserChange(user.id);
              setIsOpen(false);
            }}
            className={`w-full text-left px-4 py-2 rounded text-sm ${
              currentUser?.id === user.id
                ? "bg-stone-700 text-blue-400"
                : "text-white hover:bg-stone-800 dark:text-stone-400 dark:hover:bg-stone-600"
            }`}
          >
            <div className="flex items-center">
              <span
                style={{
                  backgroundColor: generateAvatarColor(user.name)
                    .backgroundColor,
                  color: generateAvatarColor(user.name).color,
                }}
                className="w-[20px] h-[20px] text-xs rounded-xl border border-oc-outline-light/60 flex items-center justify-center font-bold flex-shrink-0 mr-2"
              >
                {user.name.slice(0, 1).toUpperCase()}
              </span>
              <div>
                <div className="font-medium">{user.name}</div>
                <div className="text-xs text-stone-400 truncate">
                  {user.email}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
