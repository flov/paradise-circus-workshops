"use client"

import { Button } from "@/components/ui/button"

export function PrintButton() {
  return (
    <Button
      variant="outline"
      className="w-full bg-transparent"
      onClick={() => window.print()}
    >
      Print Confirmation
    </Button>
  )
}

