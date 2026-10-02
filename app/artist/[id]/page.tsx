import ArtistProfile from "@/components/ArtistProfile";

export default function Page({ params }: { params: { id: string } }) {
  return <ArtistProfile artistId={params.id} />;
}
