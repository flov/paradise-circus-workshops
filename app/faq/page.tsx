import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-background">
      <main
        className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 space-y-8"
        suppressHydrationWarning
      >
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground">
            Frequently Asked Questions
          </h1>
          <p className="text-lg text-muted-foreground">
            Everything you need to know about Paradise Circus
          </p>
        </div>

        {/* FAQ Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">General Information</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion>
              <AccordionItem value="what-is-paradise">
                <AccordionTrigger value="what-is-paradise">
                  What is Paradise Circus?
                </AccordionTrigger>
                <AccordionContent value="what-is-paradise">
                  Paradise Circus is a Thai owned and operated Event Venue and
                  Training Center nestled in the beautiful mountains of Northern
                  Thailand. We are the home of The Paradise Circus and together
                  we provide a collaborative space for flow artists, musicians,
                  dancers, acrobats, fire performers, circus performers and much
                  more. We are a premier Circus Arts hub and Training Ground
                  that strives to provide a space for all people, in a radically
                  inclusive way, to empower and inspire growth.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="opening-hours">
                <AccordionTrigger value="opening-hours">
                  What are your opening hours?
                </AccordionTrigger>
                <AccordionContent value="opening-hours">
                  We are open Monday through Sunday from 10:00 AM to 12:00 AM
                  (midnight).
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Workshops & Booking</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion>
              <AccordionItem value="book-workshop">
                <AccordionTrigger value="book-workshop">
                  How do I book a workshop?
                </AccordionTrigger>
                <AccordionContent value="book-workshop">
                  You can browse our available workshops on the homepage and
                  click on any workshop to view details and book your spot.
                  Simply fill out the booking form with your information and
                  you'll receive a confirmation email with all the details.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="workshop-types">
                <AccordionTrigger value="workshop-types">
                  What types of workshops do you offer?
                </AccordionTrigger>
                <AccordionContent value="workshop-types">
                  We offer a wide variety of circus arts workshops including
                  flow arts (poi, staff, hoops), fire performance, acrobatics,
                  dance, and more. Our workshops are taught by experienced
                  instructors from our international community of talented
                  artists.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="experience-level">
                <AccordionTrigger value="experience-level">
                  Do I need prior experience to join a workshop?
                </AccordionTrigger>
                <AccordionContent value="experience-level">
                  No prior experience is necessary! Our workshops welcome people
                  of all skill levels, from complete beginners to advanced
                  practitioners. Our instructors are skilled at adapting to
                  different levels and creating an inclusive learning
                  environment.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="cancel-booking">
                <AccordionTrigger value="cancel-booking">
                  Can I cancel my booking?
                </AccordionTrigger>
                <AccordionContent value="cancel-booking">
                  If you cannot come, please have a look in your booking
                  confirmation. There you will find a link to cancel your
                  booking.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Visiting Paradise</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion>
              <AccordionItem value="circus-show">
                <AccordionTrigger value="circus-show">
                  Do you have circus shows?
                </AccordionTrigger>
                <AccordionContent value="circus-show">
                  Yes! We host circus shows every Thursday and Sunday at 8:30
                  PM. Come and experience the magic of our performances!
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="community">
                <AccordionTrigger value="community">
                  How can I get involved in the community?
                </AccordionTrigger>
                <AccordionContent value="community">
                  We welcome everyone to join our community! You can participate
                  in workshops, attend our circus shows, or simply visit our
                  space. Our international community of artists, performers, and
                  dreamers is always open to new members who share our passion
                  for movement, art, and creativity. Every Monday at 12:00, we
                  have a Community Meeting where you can get to know more about
                  Paradise and how to get involved.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="inclusive">
                <AccordionTrigger value="inclusive">
                  Is Paradise inclusive and welcoming to all?
                </AccordionTrigger>
                <AccordionContent value="inclusive">
                  Absolutely! We are committed to providing a space for all
                  people, in a radically inclusive way, to empower and inspire
                  growth. Paradise welcomes people from all walks of life,
                  backgrounds, and skill levels. Our mission is to create a
                  space where everyone can discover themselves, find their
                  voice, and be part of something larger.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
