import { toast } from "sonner"

export const useToast = () => {
  const showToast = (type, message) => {
    switch (type) {
      case "success":
        toast.success(message)
        break
      case "error":
        toast.error(message)
        break
      case "info":
        toast.info(message)
        break
      default:
        toast(message)
    }
  }

  return { showToast }
}

