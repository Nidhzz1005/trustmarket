const hre = require("hardhat");

async function main() {
  const TrustMarket = await hre.ethers.getContractFactory("TrustMarket");
  const trustMarket = await TrustMarket.deploy();

  await trustMarket.waitForDeployment();

  console.log(`TrustMarket deployed to ${trustMarket.target}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
