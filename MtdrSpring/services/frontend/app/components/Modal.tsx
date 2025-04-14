// app/components/TaskModal/Modal.tsx
interface ModalProps {
  isVisible: boolean;
  onClose: (e?: React.MouseEvent) => void;
  handleClose: (e?: React.MouseEvent) => void;
  children: React.ReactNode;
  className?: string;
}

export function Modal({
  isVisible,
  onClose,
  handleClose,
  children,
  className,
}: ModalProps) {
  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs transition-opacity duration-150 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
      onClick={onClose}
    >
      <div
        className={`bg-oc-primary flex rounded-lg p-2 transition-transform duration-150 ${
          isVisible ? "translate-y-0" : "translate-y-3"
        } ${className}`}
        onClick={(e) => e.stopPropagation()}
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
