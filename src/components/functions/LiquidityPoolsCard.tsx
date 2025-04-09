
import React from "react";
import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import FunctionCard from "./FunctionCard";

const LiquidityPoolsCard = () => {
  return (
    <FunctionCard 
      title="Liquidity Pools" 
      description="Provide or remove liquidity from Uniswap pools" 
      icon={Share2}
    >
      <div className="space-y-6">
        <div className="space-y-4">
          <h3 className="font-medium">Active Liquidity Positions</h3>
          <div className="bg-muted/50 p-4 rounded-md text-center">
            <p className="text-muted-foreground">You have no active liquidity positions</p>
            <Button variant="outline" size="sm" className="mt-2">
              Create New Position
            </Button>
          </div>
        </div>
        
        <div className="space-y-4">
          <h3 className="font-medium">Popular Liquidity Pools</h3>
          <div className="grid gap-2">
            {[
              { pair: "ETH/USDC", apr: "4.2%", tvl: "$1.2B" },
              { pair: "ETH/DAI", apr: "3.8%", tvl: "$890M" },
              { pair: "WBTC/ETH", apr: "5.1%", tvl: "$620M" }
            ].map((pool) => (
              <div key={pool.pair} className="flex items-center justify-between p-3 bg-background border rounded-md">
                <div>
                  <p className="font-medium">{pool.pair}</p>
                  <p className="text-xs text-muted-foreground">TVL: {pool.tvl}</p>
                </div>
                <div className="text-right">
                  <p className="text-primary font-medium">{pool.apr} APR</p>
                  <Button variant="outline" size="sm" className="mt-1">Add</Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </FunctionCard>
  );
};

export default LiquidityPoolsCard;
