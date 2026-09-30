import Profile from "@/components/Profile";
import BottomNav from "@/components/BottomNav";
import { trackEvent } from "@/lib/analytics/trackEvent";

export default function Page() {
  return (
    <>
      <Profile />
      <BottomNav />
    </>
  );
}
