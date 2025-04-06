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
      className={`fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-50 transition-opacity duration-150 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
      onClick={onClose}
    >
      <div
        className={`rounded-lg flex p-2 bg-oc-primary transition-transform duration-150 ${
          isVisible ? "translate-y-0" : "translate-y-3"
        } ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-oc-primary border border-oc-outline-light relative rounded-lg w-full flex overflow-hidden">
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 border border-oc-outline-light w-7 h-7 rounded flex items-center justify-center hover:bg-oc-neutral text-stone-500 hover:text-stone-700"
          >
            <i className="fa fa-times text-xl"></i>
          </button>
          {children}
        </div>
      </div>
    </div>
  );
}
