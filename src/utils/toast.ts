import Toast from "react-native-toast-message";

type ToastVariant = "success" | "error" | "warning" | "info";

function showToast(
  type: ToastVariant,
  title: string,
  message?: string,
) {
  Toast.show({
    type,
    text1: title,
    text2: message,
    position: "top",
    visibilityTime: type === "error" ? 5000 : 3500,
  });
}

export function showSuccessToast(title: string, message?: string) {
  showToast("success", title, message);
}

export function showErrorToast(title: string, message?: string) {
  showToast("error", title, message);
}

export function showWarningToast(title: string, message?: string) {
  showToast("warning", title, message);
}

export function showInfoToast(title: string, message?: string) {
  showToast("info", title, message);
}
