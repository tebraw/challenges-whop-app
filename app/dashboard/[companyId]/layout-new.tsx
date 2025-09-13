// app/admin/layout.tsx
import { ReactNode } from 'react';
import { isCompanyOwnerServer } from '@/lib/access-control-server';
import { redirect } from 'next/navigation';

interface AdminLayoutProps {
  children: ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  // Check if user is company owner
  const hasAccess = await isCompanyOwnerServer();
  
  if (!hasAccess) {
    // Redirect to access denied page or login
    redirect('/auth/whop?redirect=/admin');
  }

  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  );
}
