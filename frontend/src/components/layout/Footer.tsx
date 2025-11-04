export default function Footer() {
  return (
    <footer className="mt-8 border-t border-neutral-200">
      <div className="max-w-4xl mx-auto px-6 py-4 text-xs text-neutral-500 flex items-center justify-between">
        <span>© {new Date().getFullYear()} AI Booking</span>
        <span>Built with Next.js • RTK Query • Socket.io</span>
      </div>
    </footer>
  );
}
