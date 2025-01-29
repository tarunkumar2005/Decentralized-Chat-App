import { ethers } from "hardhat";

async function main() {
  // Get the contract factory
  const DecentralizedChat = await ethers.getContractFactory("DecentralizedChat");

  // Deploy the contract
  const chat = await DecentralizedChat.deploy();
  
  // Wait for deployment confirmation
  await chat.waitForDeployment();

  console.log("Contract deployed to address:", await chat.getAddress());
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });