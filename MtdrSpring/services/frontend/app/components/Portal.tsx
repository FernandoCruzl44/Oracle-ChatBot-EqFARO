// app/components/Portal.tsx
import { useEffect, useRef } from "react";
import ReactDOM from "react-dom";

interface PortalProps {
  children: React.ReactNode;
}

export default function Portal({ children }: PortalProps) {
  const elRef = useRef<HTMLDivElement | null>(null);

  if (!elRef.current) {
    elRef.current = document.createElement("div");
  }

  useEffect(() => {
    const portalRoot = document.getElementById("portal-root");
    if (portalRoot && elRef.current) {
      portalRoot.appendChild(elRef.current);
    }
    return () => {
      if (portalRoot && elRef.current) {
        portalRoot.removeChild(elRef.current);
      }
    };
  }, []);

  return ReactDOM.createPortal(children, elRef.current);
}
