
import React from "react";
import ContractExplorerCard from "./ContractExplorerCard";
import ContractDeploymentCard from "./ContractDeploymentCard";

interface ContractsTabProps {
  currentChain: number | undefined;
  chains: any[];
}

const ContractsTab = ({ currentChain, chains }: ContractsTabProps) => {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <ContractExplorerCard currentChain={currentChain} />
      <ContractDeploymentCard currentChain={currentChain} chains={chains} />
    </div>
  );
};

export default ContractsTab;
