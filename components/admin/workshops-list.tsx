import { neon } from "@neondatabase/serverless"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { EditWorkshopButton } from "./edit-workshop-button"
import { DeleteWorkshopButton } from "./delete-workshop-button"

type Workshop = {
  id: number
  title: string
  instructor: string
  date: string
  start_time: string
  end_time: string
  max_capacity: number
  current_bookings: number
  location: string
}

export async function WorkshopsList() {
  const sql = neon(process.env.DATABASE_URL!)

  const workshops = await sql<Workshop[]>`
    SELECT * FROM workshops 
    ORDER BY date DESC, start_time DESC
  `

  if (workshops.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No workshops found. Create your first workshop to get started.
      </div>
    )
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
            <TableHead>Workshop</TableHead>
            <TableHead>Date & Time</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Instructor</TableHead>
            <TableHead>Capacity</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {workshops.map((workshop) => {
            const spotsLeft = workshop.max_capacity - workshop.current_bookings
            const isFull = spotsLeft <= 0
            const isPast = new Date(workshop.date) < new Date()

            return (
              <TableRow key={workshop.id}>
                <TableCell className="font-medium">{workshop.title}</TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div>{formatDate(workshop.date)}</div>
                    <div className="text-muted-foreground">
                      {formatTime(workshop.start_time)} - {formatTime(workshop.end_time)}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-sm">{workshop.location}</TableCell>
                <TableCell className="text-sm">{workshop.instructor}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">
                      {workshop.current_bookings}/{workshop.max_capacity}
                    </span>
                    {isFull ? (
                      <Badge variant="destructive">Full</Badge>
                    ) : isPast ? (
                      <Badge variant="secondary">Past</Badge>
                    ) : (
                      <Badge variant="outline">{spotsLeft} left</Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <EditWorkshopButton workshop={workshop} />
                    <DeleteWorkshopButton workshopId={workshop.id} workshopTitle={workshop.title} />
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
