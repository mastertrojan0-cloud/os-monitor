export default function Loading({ full = false }: { full?: boolean }) {
  if (full) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-300 border-t-blue-600" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600" />
    </div>
  );
}
