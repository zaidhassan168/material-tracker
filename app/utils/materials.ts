import { LucideIcon, Blocks, Hammer, BrickWall, PaintBucket, Wrench, PlugZap } from "lucide-react-native";

export type Material = {
  name: string;
  icon: LucideIcon;
  color: string;
};

export const MATERIAL_OPTIONS: Material[] = [
  { name: "Concrete", icon: Blocks, color: "#6B7280" },
  { name: "Steel Rebar", icon: Hammer, color: "#374151" },
  { name: "Bricks", icon: BrickWall, color: "#B45309" },
  { name: "Paint", icon: PaintBucket, color: "#4F46E5" },
  { name: "Plumbing", icon: Wrench, color: "#059669" },
  { name: "Electrical", icon: PlugZap, color: "#F59E0B" },
];
