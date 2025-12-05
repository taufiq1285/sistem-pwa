/**
 * DeleteConfirmDialog Component
 * Reusable confirmation dialog for delete operations
 * Displays warning and requires confirmation before delete
 */

import { XCircle, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title: string;
  itemName: string;
  itemType: string;
  description?: string;
  consequences?: string[];
  isLoading?: boolean;
}

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  itemName,
  itemType,
  description,
  consequences = [],
  isLoading = false,
}: DeleteConfirmDialogProps) {
  const defaultConsequences = [
    `Data ${itemType} akan dihapus permanent`,
    'Tindakan ini tidak dapat dibatalkan',
    'Data yang terkait mungkin terpengaruh',
  ];

  const displayConsequences = consequences.length > 0 ? consequences : defaultConsequences;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-red-600 dark:text-red-400 flex items-center gap-2">
            <XCircle className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription className="text-base">
            <strong>Perhatian!</strong> Tindakan ini tidak dapat dibatalkan.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Item Info to Delete */}
          <div className="p-4 border-2 border-red-500 rounded-lg bg-red-50 dark:bg-red-950/30">
            <p className="text-sm font-semibold text-red-800 dark:text-red-300 mb-2">
              {itemType} yang akan dihapus:
            </p>
            <p className="text-lg font-bold text-gray-900 dark:text-white break-words">
              {itemName}
            </p>
            {description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{description}</p>
            )}
          </div>

          {/* Warning Box */}
          <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-400 rounded-md">
            <p className="text-sm text-yellow-800 dark:text-yellow-300 font-medium">
              ⚠️ Konsekuensi penghapusan:
            </p>
            <ul className="text-sm text-yellow-700 dark:text-yellow-400 mt-2 ml-4 list-disc space-y-1">
              {displayConsequences.map((consequence, index) => (
                <li key={index}>{consequence}</li>
              ))}
            </ul>
          </div>

          {/* Confirmation Question */}
          <p className="text-center font-semibold text-gray-900 dark:text-white">
            Apakah Anda yakin ingin menghapus {itemType} ini?
          </p>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="min-w-[100px]"
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={onConfirm}
              disabled={isLoading}
              className="min-w-[100px] bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {isLoading ? 'Menghapus...' : 'Ya, Hapus'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
