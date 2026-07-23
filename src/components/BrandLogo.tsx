export function BrandLogo({ className = '' }: { className?: string }) {
  return (
    <span
      className={`block overflow-hidden bg-white ${className}`}
      role="img"
      aria-label="Three-N Services"
    >
      <span
        className="block size-full bg-no-repeat"
        style={{
          backgroundImage: "url('/three-n-services-logo.jpeg')",
          backgroundPosition: 'center 53%',
          backgroundSize: '145% auto',
        }}
      />
    </span>
  );
}
