export default function KanthaDivider({ className = "" }: { className?: string }) {
  return (
    <div className={`w-full py-4 ${className}`}>
      <svg viewBox="0 0 400 8" className="w-full h-2" xmlns="http://www.w3.org/2000/svg">
        <line x1="0" y1="4" x2="400" y2="4" stroke="currentColor" strokeWidth="1.5" strokeDasharray="8 6" className="text-mustard" />
        <line x1="2" y1="2" x2="398" y2="6" stroke="currentColor" strokeWidth="0.75" strokeDasharray="4 10" className="text-terracotta/40" />
      </svg>
    </div>
  );
}
