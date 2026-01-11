import { redirect } from "next/navigation";

export default async function BookRedirectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  
  // Redirect to new route (Next.js redirect uses 307 by default, which preserves SEO value)
  redirect(`/event/${slug}`);
}
