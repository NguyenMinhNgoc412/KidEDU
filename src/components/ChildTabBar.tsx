import { BookOpen, Gamepad2, Images, UsersRound } from "lucide-react-native";
import { usePathname, useRouter } from "expo-router";
import { MobileTabBar } from "./MobileTabBar";
import { useParentGateStore } from "@/features/parent/parentGate";
import { colors } from "@/theme";

export function ChildTabBar({ active }: { active: "speech" | "games" | "collection" | "parent" }) {
  const router = useRouter();
  const pathname = usePathname();
  const items = [
    { key: "speech", label: "Tập nói", route: "/" as const, Icon: BookOpen },
    { key: "games", label: "Trò chơi", route: "/games" as const, Icon: Gamepad2 },
    { key: "collection", label: "Bộ sưu tập", route: "/collection" as const, Icon: Images },
    { key: "parent", label: "Phụ huynh", route: "/parent-gate" as const, Icon: UsersRound }
  ];
  return (
    <MobileTabBar
      items={items.map(({ key, label, route, Icon }) => ({
        label,
        active: key === active,
        icon: <Icon color={key === active ? colors.secondary : colors.muted} size={21} />,
        onPress: () => {
          if (key === active && (pathname === route || key === "parent")) return;
          useParentGateStore.getState().lock();
          router.replace(route);
        }
      }))}
    />
  );
}
