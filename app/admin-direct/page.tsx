// app/admin-direct/page.tsx
// This page is disabled - redirecting to main admin page

import { redirect } from 'next/navigation';

export default function AdminDirectPage() {
  // Server-side redirect - funktioniert sofort
  redirect('/admin');
}
