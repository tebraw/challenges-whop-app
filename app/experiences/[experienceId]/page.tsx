import { redirect } from 'next/navigation';

interface Props {
  params: Promise<{
    experienceId: string;
  }>;
}

export default async function ExperiencePage({ params }: Props) {
  const { experienceId } = await params;
  
  // Redirect experience-based access to the main app
  // This handles Whop experience URLs and redirects them to the appropriate interface
  redirect(`/?experience=${experienceId}`);
}
