/**
 * useToast Hook - Migrated to Ant Design Notifications
 * 
 * DEPRECATED: This hook has been replaced with useNotification()
 * For backward compatibility, it now wraps the new notification system.
 * 
 * Migration path:
 * OLD: const { toast } = useToast();
 * NEW: const { error, success } = useNotification();
 * 
 * This maintains API compatibility while using Ant Design under the hood.
 */

import * as React from "react"
import type { ToastProps } from "@/types/toast"
import { notificationService } from "@/services/notificationService"

const TOAST_LIMIT = 1

interface State {
  toasts: ToastProps[]
}

export const reducer = (state: State, action: { type: string, toast?: ToastProps, toastId?: string }) => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast!, ...state.toasts].slice(0, TOAST_LIMIT),
      }
    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast!.id ? { ...t, ...action.toast } : t
        ),
      }
    case "DISMISS_TOAST": {
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toastId || action.toastId === undefined
            ? { ...t, open: false }
            : t
        ),
      }
    }
    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        }
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }
    default:
      return state
  }
}

const listeners: Array<(state: State) => void> = []

let memoryState: State = { toasts: [] }

function dispatch(action: { type: string, toast?: ToastProps, toastId?: string }) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => {
    listener(memoryState)
  })
}

/**
 * Legacy toast function - now uses Ant Design notifications
 * Maps the old toast API to the new notification service
 */
export function toast({ ...props }: Omit<ToastProps, "id">) {
  const id = Math.random().toString(36).substr(2, 9)
  const update = (props: ToastProps) =>
    dispatch({ type: "UPDATE_TOAST", toast: { ...props, id } })
  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id })

  // Determine notification type based on variant
  const type = props.variant === "destructive" ? "error" : "info"
  const message = String(props.title || "")
  const description = props.description ? String(props.description) : undefined

  // Show using new notification service
  if (message || description) {
    notificationService.notify({
      type,
      message: message || "Notification",
      description,
      duration: 4.5,
    })
  }

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open: boolean) => {
        if (!open) dismiss()
      },
    },
  })

  return {
    id,
    dismiss,
    update,
  }
}

/**
 * useToast Hook - Legacy hook maintained for backward compatibility
 * Uses Ant Design notifications internally
 */
export function useToast() {
  const [state, setState] = React.useState<State>(memoryState)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [state])

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  }
}