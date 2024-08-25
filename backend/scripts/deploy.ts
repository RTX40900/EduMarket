import hre from "hardhat";
import "@nomicfoundation/hardhat-ethers";


async function main() {
  console.log(
    "Deploying contracts with the account:",
    (await hre.ethers.getSigners())[0].address
  );

  // We get the contract to deploy
  const CourseStorage = await hre.ethers.getContractFactory("CourseStorage");

  const coursestorage = await CourseStorage.deploy();

  await coursestorage.waitForDeployment();

  console.log("coursestorage deployed to:", coursestorage.target);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
