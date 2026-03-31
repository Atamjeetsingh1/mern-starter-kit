/**
 * components/ui/ConfirmDialog.jsx
 * Accessible confirmation modal — "Are you sure?" pattern.
 *
 * Usage:
 *   <ConfirmDialog
 *     isOpen={showConfirm}
 *     onClose={() => setShowConfirm(false)}
 *     onConfirm={handleDelete}
 *     title="Delete user"
 *     description="This action cannot be undone."
 *     confirmLabel="Delete"
 *     variant="danger"
 *     isLoading={isDeleting}
 *   />
 */

import React from "react";
import Modal from "../components/Modal";
import Button from "../components/Button";

const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Are you sure?",
  description = "This action cannot be undone.",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",   // "danger" | "primary"
  isLoading = false,
}) => (
  <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
    <p className="text-sm text-gray-600 mb-6">{description}</p>
    <div className="flex justify-end gap-3">
      <Button variant="secondary" onClick={onClose} disabled={isLoading}>
        {cancelLabel}
      </Button>
      <Button variant={variant} onClick={onConfirm} isLoading={isLoading}>
        {confirmLabel}
      </Button>
    </div>
  </Modal>
);

export default ConfirmDialog;