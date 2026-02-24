import { db } from "@/db"
import { participations, events } from "@/db/schema"
import { eq, desc } from "drizzle-orm"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { DeleteParticipationButton } from "./delete-participation-button"

export async function ParticipationsList() {
  const participationsList = await db
    .select({
      id: participations.id,
      eventId: participations.eventId,
      participantName: participations.participantName,
      participantEmail: participations.participantEmail,
      phone: participations.phone,
      participationDate: participations.participationDate,
      eventTitle: events.title,
      eventDate: events.date,
      eventStartTime: events.startTime,
    })
    .from(participations)
    .innerJoin(events, eq(participations.eventId, events.id))
    .orderBy(desc(participations.participationDate))

  if (participationsList.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">No participations found.</div>
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":")
    const hour = Number.parseInt(hours)
    const ampm = hour >= 12 ? "PM" : "AM"
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Participant</TableHead>
            <TableHead>Event</TableHead>
            <TableHead>Date & Time</TableHead>
            <TableHead>Participated On</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {participationsList.map((participation) => {
            // Combine date and start time to create a proper datetime for comparison
            const eventDateTime = new Date(`${participation.eventDate}T${participation.eventStartTime}`)
            const isPast = eventDateTime < new Date()

            return (
              <TableRow key={participation.id}>
                <TableCell className="font-medium">{participation.participantName}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{participation.eventTitle}</span>
                    {isPast && <Badge variant="secondary">Past</Badge>}
                  </div>
                </TableCell>
                <TableCell className="text-sm">
                  <div>{formatDate(participation.eventDate)}</div>
                  <div className="text-muted-foreground">{formatTime(participation.eventStartTime)}</div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{formatDate(participation.participationDate.toISOString())}</TableCell>
                <TableCell className="text-sm">
                  <div>{participation.participantEmail}</div>
                  {participation.phone && <div className="text-muted-foreground">{participation.phone}</div>}
                </TableCell>
                <TableCell className="text-right">
                  <DeleteParticipationButton participationId={participation.id} eventId={participation.eventId} />
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
