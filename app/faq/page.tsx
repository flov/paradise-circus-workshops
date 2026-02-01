import type { Metadata } from "next";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, or } from "drizzle-orm";

export const metadata: Metadata = {
  title: {
    absolute: "Paradise Circus | FAQ",
  },
};

async function getFlowWizardUsername(): Promise<string | null> {
  try {
    const result = await db
      .select({ username: users.username })
      .from(users)
      .where(
        or(
          eq(users.displayName, "The Flow Wizard"),
          eq(users.username, "flow-wizard"),
          eq(users.username, "the-flow-wizard"),
        ),
      )
      .limit(1);

    return result.length > 0 ? result[0].username : null;
  } catch (error) {
    console.error("Error fetching Flow Wizard username:", error);
    return null;
  }
}

export default async function FAQPage() {
  const flowWizardUsername = await getFlowWizardUsername();

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
            <CardTitle className="text-2xl">Workshops</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion>
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

              <AccordionItem value="workshop-cost">
                <AccordionTrigger value="workshop-cost">
                  How much do workshops cost?
                </AccordionTrigger>
                <AccordionContent value="workshop-cost">
                  All workshops at Paradise Circus are donation-driven with a
                  minimum recommended donation of 100 Baht. Our instructors
                  volunteer their time and knowledge to share with the
                  community. Donations are welcome and help support the artists
                  and keep Paradise running. Give what feels right for you.
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

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Contributing</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion>
              <AccordionItem value="open-source">
                <AccordionTrigger value="open-source">
                  Is this website open source? Can I contribute?
                </AccordionTrigger>
                <AccordionContent value="open-source">
                  Yes! This website is completely open source and built with
                  modern web technologies. The platform runs on the latest
                  version of Next.js and uses serverless functions deployed on
                  Vercel. The entire codebase is available on{" "}
                  <Link
                    href="https://github.com/flov/paradise-circus-workshops"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline font-medium"
                  >
                    GitHub
                  </Link>
                  .
                  <br />
                  <br />
                  We welcome contributions from developers! If you have a
                  feature idea, bug fix, or improvement you'd like to
                  contribute, feel free to open a pull request on GitHub. For
                  questions or to discuss your contribution ideas, you can
                  contact{" "}
                  <Link
                    href={"/artists/the_flow_wizard"}
                    className="text-primary hover:underline font-medium"
                  >
                    The Flow Wizard
                  </Link>{" "}
                  or simply open a pull request and we'll review it.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
