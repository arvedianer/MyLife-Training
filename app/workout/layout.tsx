import { AppShell } from '@/components/layout/AppShell';

export default function WorkoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
