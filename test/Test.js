const { NftSwapV4, NftSwap } = require("@traderxyz/nft-swap-sdk");
const { expect } = require("chai");
const { getDefaultProvider, BigNumber } = require("ethers");
const { formatEther } = require("ethers/lib/utils");
const { ethers } = require("hardhat");
const { transferEther, impersonateAccount } = require("./helpers/utils");
require("dotenv").config();

//
const WHALE = process.env.WHALE;

describe("Greeter", function () {
  before(async () => {
    [deployer, SELLER, BUYER] = await ethers.getSigners();

    // Signer
    SELLER = new ethers.Wallet(process.env.PRV_KEY, await getDefaultProvider());
    BUYER = new ethers.Wallet(
      process.env.PRV_KEY_2,
      await getDefaultProvider()
    );

    whale = await impersonateAccount(WHALE);
    await transferEther(whale, SELLER.address, "1");
    await transferEther(whale, BUYER.address, "1");

    //
    USD = await ethers.getContractFactory("USD");
    usd = await USD.deploy();

    CHAIN_ID = 1; // Hardhat is 31337 Ganache is 1337
  });
  it("Should return the new greeting once it's changed", async function () {
    // Scenario: User A wants to sell their CryptoPunk for 420 WETH
    console.log(
      formatEther(
        String(BigNumber.from(await ethers.provider.getBalance(deployer.address)))
      )
    );return;

    // Set up the assets we want to swap (CryptoPunk #69 and 420 WETH)
    const CRYPTOPUNK = {
      tokenAddress: "0xb47e3cd837ddf8e4c57f05d70ab865de6e193bbb",
      tokenId: "420",
      type: "ERC721", // 'ERC721' or 'ERC1155'
    };
    const FOUR_HUNDRED_TWENTY_WETH = {
      tokenAddress: process.env.WETH_MAINNET, // WETH contract address
      amount: "420000000000000000000", // 420 Wrapped-ETH (WETH is 18 digits)
      type: "ERC20",
    };

    // [Part 1: Maker (owner of the Punk) creates trade]
    const nftSwapSdk = new NftSwap(
      await getDefaultProvider(),
      SELLER,
      CHAIN_ID
    );
    const walletAddressMaker = SELLER.address;

    // Approve NFT to trade (if required)
    await nftSwapSdk.approveTokenOrNftByAsset(CRYPTOPUNK, walletAddressMaker);
    console.log("damn!");
    return;

    // Build order
    const order = nftSwapSdk.buildOrder(
      CRYPTOPUNK, // Maker asset to swap
      FOUR_HUNDRED_TWENTY_WETH, // Taker asset to swap
      walletAddressMaker
    );
    // Sign order so order is now fillable
    const signedOrder = await nftSwapSdk.signOrder(order);

    // [Part 2: Taker that wants to buy the punk fills trade]
    const _nftSwapSdk = new NftSwap(
      await getDefaultProvider(),
      BUYER,
      CHAIN_ID
    );
    const walletAddressTaker = BUYER.address;

    // Approve USDC to trade (if required)
    let txn = await _nftSwapSdk.approveTokenOrNftByAsset(
      FOUR_HUNDRED_TWENTY_WETH,
      walletAddressTaker
    );
    await txn.wait();

    // Fill order :)
    const fillTx = await _nftSwapSdk.fillSignedOrder(signedOrder);
    const fillTxReceipt = await _nftSwapSdk.awaitTransactionHash(fillTx.hash);
    console.log(`🎉 🥳 Order filled. TxHash: ${fillTxReceipt.transactionHash}`);
  });
});
