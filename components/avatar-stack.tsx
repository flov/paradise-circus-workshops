import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { getInitials } from "@/lib/utils"
import { cn } from "@/lib/utils"

type Participant = {
  name: string
  email: string
  imageUrl?: string | null
}

type AvatarStackProps = {
  participants: Participant[]
  maxVisible?: number
  size?: "sm" | "md" | "lg"
  className?: string
}

const sizeClasses = {
  sm: "size-8",
  md: "size-10",
  lg: "size-12",
}

export function AvatarStack({ 
  participants, 
  maxVisible = 5,
  size = "md",
  className 
}: AvatarStackProps) {
  if (participants.length === 0) {
    return null
  }

  const visibleParticipants = participants.slice(0, maxVisible)
  const remainingCount = participants.length - maxVisible
  const sizeClass = sizeClasses[size]

  return (
    <div className={cn("flex items-center", className)}>
      <div className="flex items-center -space-x-2">
        {visibleParticipants.map((participant, index) => (
          <Avatar
            key={`${participant.email}-${index}`}
            className={cn(
              sizeClass,
              "border-2 border-background ring-2 ring-background",
              "hover:z-10 transition-all"
            )}
          >
            {participant.imageUrl && (
              <AvatarImage 
                src={participant.imageUrl} 
                alt={participant.name || "Participant"}
              />
            )}
            <AvatarFallback className="bg-primary/10 text-primary font-medium text-xs">
              {getInitials(participant.name || participant.email)}
            </AvatarFallback>
          </Avatar>
        ))}
        
        {remainingCount > 0 && (
          <div
            className={cn(
              sizeClass,
              "border-2 border-background ring-2 ring-background",
              "rounded-full bg-muted flex items-center justify-center",
              "text-xs font-medium text-muted-foreground",
              "hover:z-10 transition-all"
            )}
            aria-label={`${remainingCount} more participants`}
          >
            +{remainingCount}
          </div>
        )}
      </div>
    </div>
  )
}

