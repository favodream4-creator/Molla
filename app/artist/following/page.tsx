import FollowList from "@/components/FollowList";

export default function FollowingPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <FollowList
      userId={params.id}
      mode="following"
    />
  );
}