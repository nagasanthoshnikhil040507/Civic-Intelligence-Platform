export default function ErrorScreen({ error, resetErrorBoundary }: any) {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background text-foreground">
      <h2 className="text-2xl font-bold mb-4">Something went wrong!</h2>
      <pre className="text-sm text-destructive mb-4">{error.message}</pre>
      <button onClick={resetErrorBoundary} className="px-4 py-2 bg-primary text-primary-foreground rounded-md">
        Try again
      </button>
    </div>
  );
}
