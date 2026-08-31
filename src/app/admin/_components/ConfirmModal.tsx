import { AlertTriangle } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Xác nhận xóa",
  message = "Bạn có chắc chắn muốn thực hiện hành động này không? Hành động này không thể hoàn tác.",
  confirmText = "Đồng ý",
  cancelText = "Hủy"
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm whitespace-normal text-left">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {title}
          </h3>
          <p className="text-sm text-gray-500 mb-6">
            {message}
          </p>
          
          <div className="flex w-full gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors cursor-pointer"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onConfirm();
              }}
              className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium shadow-sm shadow-red-200 transition-colors cursor-pointer"
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
