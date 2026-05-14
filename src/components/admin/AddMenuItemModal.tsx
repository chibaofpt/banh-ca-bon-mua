"use client";

import { useState } from "react";
import MenuItemForm from "./MenuItemForm";
import type { AdminMenuItem } from "@/src/lib/types/menu";

interface AddMenuItemModalProps {
  onClose: () => void;
  onCreated: (item: AdminMenuItem) => void;
  onSubmit: (fd: FormData) => Promise<AdminMenuItem>;
}

/** Wrapper modal chứa MenuItemForm để thêm mới món. */
export default function AddMenuItemModal({ onClose, onCreated, onSubmit }: AddMenuItemModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function handleSubmit(fd: FormData) {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const item = await onSubmit(fd);
      onCreated(item);
      onClose();
    } catch (err) {
      console.error(err);
      setSubmitError("Không thể thêm món. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      
      {/* Modal Container */}
      <div className="relative bg-card rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl max-h-[85vh] overflow-y-auto">
        <h2 className="font-serif text-lg font-semibold mb-4">Thêm món mới</h2>
        
        <MenuItemForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
        
        {submitError && (
          <p className="text-xs text-destructive text-center mt-2 font-medium">
            {submitError}
          </p>
        )}
      </div>
    </div>
  );
}
