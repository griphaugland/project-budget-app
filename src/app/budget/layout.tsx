// Simple layout that just renders children
// The budget page handles its own authentication and navigation
export default function BudgetLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
