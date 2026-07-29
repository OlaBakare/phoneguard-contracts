const hre = require("hardhat");

async function main() {
  const PhoneGuardRegistry = await hre.ethers.getContractFactory("PhoneGuardRegistry");
  const contract = await PhoneGuardRegistry.deploy();
  await contract.waitForDeployment();
  const address = await contract.getAddress();
  console.log("PhoneGuardRegistry deployed to:", address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
