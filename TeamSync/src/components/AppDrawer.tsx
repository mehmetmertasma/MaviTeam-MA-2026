import { AppDataDrawer } from "@/components/AppDataDrawer";

type AppDrawerProps = {
  visible: boolean;
  onClose: () => void;
};

export function AppDrawer(props: AppDrawerProps) {
  return <AppDataDrawer {...props} />;
}

export default AppDrawer;
