import '@nomiclabs/hardhat-ethers';
import { task } from 'hardhat/config';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { getImplementationAddress } from '@openzeppelin/upgrades-core';
import { PayableOverrides } from 'ethers';
import {
    EthersExecutionManager,
    getDeployment,
    setDeployment,
    LOCK_DIR,
    RETRY_NUMBER,
    log,
} from '../utils';

const wethContract = 'WETH9';
const routerContract = 'UniswapV2Router02';
const factoryContract = 'UniswapV2Factory';
const taskSymbol = 'UniswapV2'
const taskName = `${taskSymbol}:deploy`;

task(taskName, `Deploy ${taskSymbol}`)
    .addOptionalParam('waitNum', 'The waitNum to transaction')
    .addOptionalParam('gasPrice', 'The gasPrice to transaction')
    .setAction(async (args, hre: HardhatRuntimeEnvironment) => {
        const txConfig: PayableOverrides = {};
        txConfig.gasPrice = args['gasPrice']
            ? hre.ethers.utils.parseUnits(args['gasPrice'], 'gwei')
            : undefined;
        const waitNum = args['waitNum'] ? parseInt(args['waitNum']) : 1;
        const ethersExecutionManager = new EthersExecutionManager(
            `${LOCK_DIR}/${taskName}.lock`,
            RETRY_NUMBER,
            waitNum
        );
        await ethersExecutionManager.load();
        const operator = (await hre.ethers.getSigners())[0];
        const chainId = Number(await hre.getChainId());

        log.info(`deploy ${wethContract}`);
        const Weth = await hre.ethers.getContractFactory(wethContract);
        const deployWethResult = await ethersExecutionManager.transaction(
            Weth.deploy.bind(Weth),
            [],
            ['contractAddress', 'blockNumber'],
            `deploy ${wethContract}`,
            txConfig
        );
        const wethProxyAddress = deployWethResult.contractAddress;
        const wethImplAddress = wethProxyAddress;
        const wethFromBlock = deployWethResult.blockNumber;
        const wethVersion = '1.0.0';
        log.info(
            `${wethContract} deployed proxy at ${wethProxyAddress},impl at ${wethImplAddress},version ${wethVersion},fromBlock ${wethFromBlock}`
        );

        log.info(`deploy ${factoryContract}`);
        const Factory = await hre.ethers.getContractFactory(factoryContract);
        const deployFactoryResult = await ethersExecutionManager.transaction(
            Factory.deploy.bind(Factory),
            [operator.address],
            ['contractAddress', 'blockNumber'],
            `deploy ${factoryContract}`,
            txConfig
        );
        const factoryProxyAddress = deployFactoryResult.contractAddress;
        const factoryImplAddress = factoryProxyAddress;
        const factoryFromBlock = deployFactoryResult.blockNumber;
        const factoryVersion = '1.0.0';
        log.info(
            `${factoryContract} deployed proxy at ${factoryProxyAddress},impl at ${factoryImplAddress},version ${factoryVersion},fromBlock ${factoryFromBlock}`
        );

        log.info(`deploy ${routerContract}`);
        const Router = await hre.ethers.getContractFactory(routerContract);
        const deployRouterResult = await ethersExecutionManager.transaction(
            Router.deploy.bind(Router),
            [factoryProxyAddress,wethProxyAddress],
            ['contractAddress', 'blockNumber'],
            `deploy ${routerContract}`,
            txConfig
        );
        const routerProxyAddress = deployRouterResult.contractAddress;
        const routerImplAddress = routerProxyAddress;
        const routerFromBlock = deployRouterResult.blockNumber;
        const routerVersion = '1.0.0';
        log.info(
            `${routerContract} deployed proxy at ${routerProxyAddress},impl at ${routerImplAddress},version ${routerVersion},fromBlock ${routerFromBlock}`
        );

        const deployment = await getDeployment(chainId);

        deployment.weth = {
            proxyAddress: wethProxyAddress,
            implAddress: wethImplAddress,
            version: wethVersion,
            contract: wethContract,
            operator: operator.address,
            fromBlock: wethFromBlock,
        };

        deployment.factory = {
            proxyAddress: factoryProxyAddress,
            implAddress: factoryImplAddress,
            version: factoryVersion,
            contract: factoryContract,
            operator: operator.address,
            fromBlock: factoryFromBlock,
        };

        deployment.router = {
            proxyAddress: routerProxyAddress,
            implAddress: routerImplAddress,
            version: routerVersion,
            contract: routerContract,
            operator: operator.address,
            fromBlock: routerFromBlock,
        };

        await setDeployment(chainId, deployment);

        ethersExecutionManager.printGas();
        ethersExecutionManager.deleteLock();
    });
