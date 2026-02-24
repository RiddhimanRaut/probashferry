interface AvatarProps {
  src?: string | null;
  name: string;
  size?: number;
}

export default function Avatar({ src, name, size = 32 }: AvatarProps) {
  const initials = name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        width={size}
        height={size}
        className="rounded-full object-cover"
        style={{ width: size, height: size }}
        referrerPolicy="no-referrer"
      />
    );
  }

  return (
    <div
      className="rounded-full bg-terracotta/10 text-terracotta flex items-center justify-center text-xs font-medium"
      style={{ width: size, height: size }}
    >
      {initials}
    </div>
  );
}
