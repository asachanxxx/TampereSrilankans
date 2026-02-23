import { PublicLayout } from "@/components/layout/PublicLayout";
import { CheckCircle, Users, CalendarDays, Heart } from "lucide-react";

export default function AboutPage() {
  return (
    <PublicLayout>
      {/* Hero */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto max-w-6xl px-4 text-center">
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            About Sri Lankan Association in Tampere
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Connecting the Sri Lankan community in Tampere through culture,
            friendship, and memorable events.
          </p>
        </div>
      </section>

      {/* Main content */}
      <section className="py-16">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-4">Who We Are</h2>
              <p className="text-muted-foreground mb-4">
                We are a community organisation based in Tampere, Finland, dedicated
                to bringing together Sri Lankans and friends of Sri Lanka living in
                and around Tampere. Our events celebrate Sri Lankan culture, build
                lasting friendships, and create a home away from home.
              </p>
              <p className="text-muted-foreground mb-6">
                From cultural festivals and traditional celebrations to sports days
                and community gatherings, we organise events for all ages throughout
                the year.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <span>Curated selection of cultural and community events</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <span>Easy online registration and digital ticket management</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <span>Open to the whole community — everyone is welcome</span>
                </li>
              </ul>
            </div>
            <div className="rounded-2xl overflow-hidden aspect-video relative bg-gradient-to-br from-primary/20 to-primary/5">
              <img
                src="/images/about-section.jpg"
                alt="Sri Lankan Association in Tampere community"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Stats / highlights */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="rounded-full bg-primary/10 p-4">
                <CalendarDays className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Regular Events</h3>
              <p className="text-muted-foreground text-sm">
                Throughout the year we host cultural celebrations, sports days,
                and social gatherings for the whole family.
              </p>
            </div>
            <div className="flex flex-col items-center gap-3">
              <div className="rounded-full bg-primary/10 p-4">
                <Users className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Growing Community</h3>
              <p className="text-muted-foreground text-sm">
                Members from all backgrounds are welcome. Join a warm and
                welcoming community right here in Tampere.
              </p>
            </div>
            <div className="flex flex-col items-center gap-3">
              <div className="rounded-full bg-primary/10 p-4">
                <Heart className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Volunteer-Run</h3>
              <p className="text-muted-foreground text-sm">
                Every event is organised by passionate volunteers who care about
                keeping our culture alive abroad.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-16">
        <div className="container mx-auto max-w-6xl px-4 text-center">
          <h2 className="text-2xl font-bold mb-3">Get in Touch</h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Interested in joining, volunteering, or sponsoring an event? We'd love to
            hear from you. Reach out via our social media channels or email us directly.
          </p>
        </div>
      </section>
    </PublicLayout>
  );
}
