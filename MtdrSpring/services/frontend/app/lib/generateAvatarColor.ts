export const generateAvatarColor = (
  name: string
): { backgroundColor: string; color: string } => {
  const hash = name.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const hue = (hash * 37) % 360;

  return {
    backgroundColor: `hsl(${hue}, 60%, 80%)`,
    color: `hsl(${hue}, 50%, 30%)`,
  };
};
