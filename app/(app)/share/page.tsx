import { Suspense } from "react"
import { ShareContent } from "@/components/share-content"

export default function SharePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      }
    >
      <ShareContent />
    </Suspense>
  )
}
