import { useState, useEffect } from "react";
import { Modal } from "~/components/Modal";
import { Button } from "~/components/Button";
import { Card } from "~/components/Card";

interface AIModalProps {
  onClose: () => void;
  isVisible: boolean;
  onGenerateSelected: () => void;
  onDivideSelected: () => void;
}

export function AIModal({
  onClose,
  isVisible,
  onGenerateSelected,
  onDivideSelected,
}: AIModalProps) {
  const [isInternalVisible, setIsInternalVisible] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setTimeout(() => {
        setIsInternalVisible(true);
      }, 0);
    } else {
      setIsInternalVisible(false);
    }
  }, [isVisible]);

  const handleClose = () => {
    setIsInternalVisible(false);
    setTimeout(onClose, 150);
  };

  return (
    <Modal
      className="bg-oc-dark-gray-accent h-[500px] w-[700px]"
      isVisible={isInternalVisible}
      onClose={handleClose}
      handleClose={handleClose}
    >
      <div className="flex h-full w-full flex-col overflow-hidden">
        <div className="border-oc-outline-light/60 bg-oc-dark-gray-accent sticky top-0 border-b p-4">
          <h2 className="text-xl font-semibold text-white">
            Asistente de Inteligencia Artificial
          </h2>
        </div>

        <div className="flex-1 p-6">
          <div className="grid h-full grid-cols-2 gap-6">
            <Card className="flex h-full flex-col">
              <div className="flex h-full flex-col p-4 text-center">
                <h3 className="mb-2 text-lg font-medium text-white">Generar</h3>
                <p className="mb-6 text-sm text-gray-300">
                  Genera nuevas tareas a partir de historias de usuario.
                </p>
                <div className="flex flex-1 items-center justify-center">
                  <div className="flex h-32 w-32 items-center justify-center rounded-full bg-stone-800/50">
                    <i className="fa fa-lightbulb text-5xl text-amber-300/60"></i>
                  </div>
                </div>
                <Button
                  onClick={onGenerateSelected}
                  className="bg-oc-accent-primary hover:bg-oc-accent-primary-dark mt-auto w-full"
                >
                  Generar Tareas
                </Button>
              </div>
            </Card>

            <Card className="flex h-full flex-col">
              <div className="flex h-full flex-col p-4 text-center">
                <h3 className="mb-2 text-lg font-medium text-white">Dividir</h3>
                <p className="mb-6 text-sm text-gray-300">
                  Analiza y divide tareas grandes en subtareas más manejables.
                </p>
                <div className="flex flex-1 items-center justify-center">
                  <div className="flex h-32 w-32 items-center justify-center rounded-full bg-stone-800/50">
                    <i className="fa fa-chart-pie text-5xl text-blue-300/60"></i>
                  </div>
                </div>
                <Button
                  onClick={onDivideSelected}
                  className="bg-oc-accent-primary hover:bg-oc-accent-primary-dark mt-auto w-full"
                >
                  Dividir Tareas
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </Modal>
  );
}
