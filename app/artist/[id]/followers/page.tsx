import FollowList from "@/components/FollowList";

export default function FollowersPage({ params }: { params: { id: string } }) {
  return <FollowList userId={params.id} mode="followers" />;
}