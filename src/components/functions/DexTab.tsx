
import React from "react";
import UniswapCard from "./UniswapCard";
import LiquidityPoolsCard from "./LiquidityPoolsCard";

interface DexTabProps {
  currentChain: number | undefined;
  addTransaction: (tx: any) => void;
}

const DexTab = ({ currentChain, addTransaction }: DexTabProps) => {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <UniswapCard
          currentChain={currentChain}
          addTransaction={addTransaction}
        />
        
        <LiquidityPoolsCard />
      </div>
    </div>
  );
};

export default DexTab;
