import '@nomiclabs/hardhat-ethers';
import {task} from 'hardhat/config';
import {HardhatRuntimeEnvironment} from 'hardhat/types';
import * as utils from '../utils';

const taskSymbol = 'UniswapV2'
const taskName = `${taskSymbol}:verify`;

task(taskName, `verify ${taskSymbol}`).setAction(
  async (_, hre: HardhatRuntimeEnvironment) => {
    const deployment = await utils.getDeployment(
      Number(await hre.getChainId())
    );
    
    utils.log.info(
      `verify ${deployment.weth.contract},implAddress: ${deployment.weth.implAddress}`
    );
    await hre.run('verify:verify', {
      address: deployment.weth.implAddress,
      constructorArguments: [],
    });

    const operator = (await hre.ethers.getSigners())[0];
    utils.log.info(
      `verify ${deployment.factory.contract},implAddress: ${deployment.factory.implAddress}`
    );
    await hre.run('verify:verify', {
      address: deployment.factory.implAddress,
      constructorArguments: [operator.address],
    });

    utils.log.info(
      `verify ${deployment.router.contract},implAddress: ${deployment.router.implAddress}`
    );
    await hre.run('verify:verify', {
      address: deployment.router.implAddress,
      constructorArguments: [deployment.factory.proxyAddress,deployment.weth.proxyAddress],
    });
  }
);
