// app/components/TaskModal/Modal.tsx
interface ModalProps {
  isVisible: boolean;
  onClose: (e?: React.MouseEvent) => void;
  handleClose: (e?: React.MouseEvent) => void;
  children: React.ReactNode;
  className?: string;
  overlayClassName?: string;
  isOverlayInteractive?: boolean;
}

export function Modal({
  isVisible,
  onClose,
  handleClose,
  children,
  className,
  overlayClassName = "bg-black/70 backdrop-blur-xs",
  isOverlayInteractive = true,
}: ModalProps) {
  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-150 ${overlayClassName} ${
        isVisible ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
      onClick={(e) => {
        // Check if the click target is the overlay itself (the div)
        if (e.target === e.currentTarget) {
          // Only trigger onClose if the overlay is set to be interactive
          if (isOverlayInteractive) {
            onClose(e);
          }
          // Do not stop propagation here. If it wasn't interactive,
          // the event should pass through. If it was, it called onClose,
          // and the event continues bubbling, which is standard.
        }
      }}
    >
      <div
        className={`bg-oc-primary flex rounded-lg p-2 transition-transform duration-150 ${
          isVisible ? "translate-y-0" : "translate-y-3"
        } ${className}`}
        onClick={(e) => e.stopPropagation()} // Stop clicks *inside* the modal content from bubbling further
      >
        <div className="bg-oc-primary border-oc-outline-light relative flex w-full overflow-hidden rounded-lg border">
          <button
            onClick={handleClose}
            className="border-oc-outline-light hover:bg-oc-neutral absolute top-3 right-3 z-10 flex h-7 w-7 items-center justify-center rounded border text-stone-500 hover:text-stone-700"
          >
            <i className="fa fa-times text-xl"></i>
          </button>
          {children}
        </div>
      </div>
    </div>
  );
}
