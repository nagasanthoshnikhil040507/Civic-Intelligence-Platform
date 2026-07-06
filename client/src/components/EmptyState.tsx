export default function EmptyState({ message = "No data found" }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-muted-foreground">
      <p>{message}</p>
    </div>
  );
}
