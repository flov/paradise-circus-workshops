import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <main
        className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 space-y-12"
        suppressHydrationWarning
      >
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground">About Paradise</h1>
          <p className="text-lg text-muted-foreground">
            A celebration of creativity, freedom, and the incredible power of
            coming together
          </p>
        </div>

        {/* Our Story Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Our Story</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-muted-foreground">
            <div className="w-full aspect-video rounded-lg overflow-hidden">
              <iframe
                src="https://www.youtube.com/embed/Aprp6LUOEO8"
                title="Paradise Circus Video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
            <p>
              Our story begins in 2016, high in the mountains of Northern
              Thailand, where two worlds connected; one of Thai tradition and
              the other of free-spirited hippies. A collaboration between local
              Thai artisans and passionate backpackers sparked the creation of
              something truly magical.
            </p>
            <p>
              What started as a simple gathering of like-minded souls quickly
              evolved into something far greater: A mission. A mission to
              inspire and awaken the transformative power of movement and fire.
              There, in the heart of the mountains, a circus was born, a place
              where art, culture, and creativity wove into a tapestry of
              performance, passion, and personal discovery.
            </p>
            <p>
              At first, it was just a handful of people, gathered around a
              burning coconut, learning to spin poi, dance with fire staffs, and
              embrace the joy of performance. But what began as a grassroots
              community soon grew into a vibrant and diverse collective of
              artists, performers, dreamers, and explorers who sought to share
              their love for movement with others. This was more than just a
              circus; it was a way of life.
            </p>
            <p>
              Nearly a decade later, the founders of Paradise remain as
              dedicated as ever to the same values that sparked the project all
              those years ago: a commitment to community, creativity, and
              connection. The spirit of collaboration between locals and
              travelers continues to thrive. It's a place where people from all
              walks of life come together; not just to learn circus arts, but to
              discover themselves, to find their voice, and to be part of
              something larger.
            </p>
            <p>
              What began in the small, sleepy town of Pai has now grown into a
              global movement, yet the core essence remains unchanged.
            </p>
            <p>
              Paradise is a living, breathing expression of the art of movement
              and fire. Paradise is a celebration of creativity, freedom, and
              the incredible power of coming together to create something truly
              extraordinary. Our mission is the same as it was in the beginning:
              to inspire and share the beauty of movement with the world.
            </p>
            <p>
              As we look to the future, we remain steadfast in our belief that,
              no matter where you are from or where you are going, the art of
              expression can transform your life. This is where dreams take
              flight, and the impossible becomes possible. Welcome to Paradise.
            </p>
          </CardContent>
        </Card>

        {/* Founder Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Founder</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-muted-foreground">
            <div className="w-full max-w-md mx-auto rounded-lg overflow-hidden">
              <Image
                src="/joe.avif"
                alt="Founder"
                width={600}
                height={800}
                className="w-full h-auto object-cover"
              />
            </div>
            <p>
              Joe is the owner and founder of Paradise, a vibrant haven that
              blends the carefree spirit of the hippie lifestyle with a sense of
              community and creative expression. For two decades, Joe served as
              a dedicated police officer, with a promising career and the
              expectation of advancing to a high position in law enforcement.
              Yet, despite the opportunities before him, Joe chose to take a
              different path, one that would allow him to pursue his passion for
              freedom and creative living.
            </p>
            <p>
              When asked by a prominent official why he made the decision to
              forfeit a promising career to become the owner of Paradise, Joe's
              answer was simple yet profound:
            </p>
            <p className="italic text-center py-4">
              "I value freedom. I'm drawn to the hippie lifestyle, and I wanted
              to do something I truly love."
            </p>
            <p>
              In addition to his role as a business owner, Joe is a devoted
              father, husband and provider. He is a natural mentor to a diverse
              and vibrant community of international travelers, artists, and
              free spirits who have found a home at Paradise. Under his
              guidance, his establishment has flourished into a place of joy and
              connection, where people of all ages can come together to share in
              the arts, enjoy flow arts, and experience the magic of community.
            </p>
            <p>
              Joe's humble yet revered leadership fosters an environment where
              creativity, individuality, and the spirit of adventure thrive. He
              is a steady presence for those who seek not only a place to relax
              and have fun but also a sense of belonging in a global family of
              like-minded souls.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
