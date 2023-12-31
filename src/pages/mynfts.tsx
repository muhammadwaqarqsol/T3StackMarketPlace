import dynamic from "next/dynamic";

const NFTList = dynamic(() => import("../components/mynfts/NFTListing"), {
  ssr: false,
});

// Define the correct typing for userPage
const NFT = NFTList;

export default function NftList() {
  return <NFT />;
}
