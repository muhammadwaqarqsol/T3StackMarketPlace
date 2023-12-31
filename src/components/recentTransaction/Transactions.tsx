import React, { useState } from "react";
import CreatedNFTs from "./CreateNFT";
import RecentBought from "./RecentBought";
import RecentSold from "./RecentSold";
const Transactions = () => {
  return (
    <div className="relative m-10 flex flex-col items-center justify-center">
      <h1 className="text-2xl font-bold text-green-400">Created NFTs</h1>
      <CreatedNFTs />
      <h1 className="text-2xl font-bold text-blue-400">Bought NFTs</h1>
      <RecentBought />
      <h1 className="text-2xl font-bold text-red-400">Sold NFTs</h1>
      <RecentSold />
    </div>
  );
};

export default Transactions;
