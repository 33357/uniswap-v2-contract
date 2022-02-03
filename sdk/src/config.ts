export interface ContractInfo {
    proxyAddress: string;
    implAddress: string;
    version: string;
    contract: string;
    operator: string;
    fromBlock: number;
}

export interface Deployment {
    weth: ContractInfo;
    router: ContractInfo;
    factory: ContractInfo;
}

export interface DeploymentFull {
    [chainId: number]: Deployment;
}

import deploymentData from './deployment.json';
export const DeploymentInfo: DeploymentFull = deploymentData;
