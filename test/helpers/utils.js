const { ethers } = require("hardhat");
const crypto = require("crypto");

async function impersonateAccount(acctAddress) {
  await hre.network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [acctAddress],
  });
  return await ethers.getSigner(acctAddress);
}
async function mineBlocks(blockNumber) {
  while (blockNumber > 0) {
    blockNumber--;
    await hre.network.provider.request({
      method: "evm_mine",
      params: [],
    });
  }
}
async function genAddresses() {
  // Generate private key
  // console.log("Printing for wallet address ", i);
  var id = crypto.randomBytes(32).toString("hex");
  var privateKey = "0x" + id;
  // console.log("SAVE BUT DO NOT SHARE THIS:", privateKey);

  // Generate wallet(public key) from prv key
  var wallet = new ethers.Wallet(privateKey);
  // console.log("Address: " + wallet.address);
  return wallet;
}
async function transferEther(signer, _to, _ethAmount) {
  let tx = {
    to: _to,
    value: ethers.utils.parseEther(_ethAmount), //  convert Eth to Wei
  };
  let result = await signer.sendTransaction(tx);
  return result;
}

module.exports = {
  impersonateAccount,
  mineBlocks,
  genAddresses,
  transferEther,
};
