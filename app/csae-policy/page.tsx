import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: {
    absolute: "Paradise Circus | CSAE Policy",
  },
};

export default function CsaePolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground">
            Child Sexual Abuse and Exploitation (CSAE) Policy
          </h1>
          <p className="text-lg text-muted-foreground">
            Last updated: March 2026
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Our Commitment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground">
            <p>
              Paradise Circus is committed to the safety and protection of
              children. We have zero tolerance for child sexual abuse and
              exploitation (CSAE) of any kind. Our platform is designed for flow
              arts workshops and community engagement, and we take proactive
              measures to ensure it is not used for any purpose that endangers
              children.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Prohibited Content and Conduct</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground">
            <p>
              The following are strictly prohibited on our platform:
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li>
                Any content that sexually exploits or endangers children,
                including child sexual abuse material (CSAM)
              </li>
              <li>
                Any conduct that grooms, solicits, or exploits minors in any way
              </li>
              <li>
                Sharing, distributing, or requesting imagery or content that
                depicts the sexual exploitation of minors
              </li>
              <li>
                Any communication intended to lure or exploit a child
              </li>
              <li>
                Any content that normalizes or promotes sexual behavior involving
                minors
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Detection and Enforcement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground">
            <p>We take the following measures to detect and prevent CSAE:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>
                User-generated content (profile information, comments, and event
                descriptions) is monitored for policy violations
              </li>
              <li>
                We review reports of violations promptly and take immediate
                action
              </li>
              <li>
                Accounts found to be in violation of this policy are permanently
                banned without notice
              </li>
              <li>
                We cooperate fully with law enforcement investigations related
                to CSAE
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Reporting</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground">
            <p>
              If you encounter any content or behavior on our platform that you
              believe involves the sexual exploitation of a child, please report
              it immediately:
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li>
                Email us at{" "}
                <a
                  href="mailto:contact@paradise-circus.app"
                  className="text-primary hover:underline"
                >
                  contact@paradise-circus.app
                </a>{" "}
                with the subject line &quot;CSAE Report&quot;
              </li>
              <li>
                Reports can also be made to the{" "}
                <a
                  href="https://www.missingkids.org/gethelpnow/cybertipline"
                  className="text-primary hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  National Center for Missing & Exploited Children (NCMEC)
                  CyberTipline
                </a>
              </li>
            </ul>
            <p>
              All reports are taken seriously and investigated promptly. We will
              report confirmed CSAE violations to the appropriate authorities,
              including NCMEC and local law enforcement.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Consequences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground">
            <p>
              Violations of this policy will result in:
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li>Immediate removal of the offending content</li>
              <li>Permanent suspension of the user&apos;s account</li>
              <li>
                Reporting to law enforcement and relevant child safety
                organizations
              </li>
              <li>
                Preservation of relevant data for law enforcement purposes
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Contact</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground">
            <p>
              For questions about this policy or to report a concern:
              <br />
              Paradise Circus, Pai, Mae Hong Son, Thailand
              <br />
              Email:{" "}
              <a
                href="mailto:contact@paradise-circus.app"
                className="text-primary hover:underline"
              >
                contact@paradise-circus.app
              </a>
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
