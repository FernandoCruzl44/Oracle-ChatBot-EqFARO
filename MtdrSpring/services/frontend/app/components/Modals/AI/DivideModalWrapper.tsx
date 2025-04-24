import { useState, useEffect } from "react";
import type { Task } from "~/types";
import { DivideModal } from "./DivideModal";

interface DivideModalWrapperProps {
  onClose: () => void;
  isVisible: boolean;
  initialTasks: Task[];
  skipToLoading?: boolean;
}

/**
 * A wrapper for DivideModal that can start directly on the loading/dividing step
 */
export function DivideModalWrapper({
  onClose,
  isVisible,
  initialTasks,
  skipToLoading = false,
}: DivideModalWrapperProps) {
  const [internalProps, setInternalProps] = useState({
    onClose,
    isVisible: false,
    initialTasks: [] as Task[],
  });

  // When the component mounts or props change, update internal state
  useEffect(() => {
    if (isVisible) {
      // Small delay to allow for transition effects
      setTimeout(() => {
        setInternalProps({
          onClose,
          isVisible: true,
          initialTasks,
        });
      }, 50);
    } else {
      setInternalProps((prev) => ({
        ...prev,
        isVisible: false,
      }));
    }
  }, [isVisible, initialTasks, onClose]);

  return (
    <DivideModal
      {...internalProps}
      // Special internal prop that will be passed to DivideModal
      // This will be read in a useEffect in DivideModal to skip to loading step
      startOnLoading={skipToLoading}
    />
  );
}
