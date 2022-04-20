const { NftSwapV4, NftSwap } = require("@traderxyz/nft-swap-sdk");
const { expect } = require("chai");
const { getDefaultProvider } = require("ethers");
const { ethers } = require("hardhat");

describe("Greeter", function () {
  before(async () => {
    [deployer, seller, buyer] = await ethers.getSigners();

    //
    USD = await ethers.getContractFactory("USD");
    usd = await USD.deploy();

    CHAIN_ID = 3;
  });
  it("Should return the new greeting once it's changed", async function () {
    // Scenario: User A wants to sell their CryptoPunk for 420 WETH

    // Set up the assets we want to swap (CryptoPunk #69 and 420 WETH)
    const CRYPTOPUNK = {
      tokenAddress: "0xb47e3cd837ddf8e4c57f05d70ab865de6e193bbb",
      tokenId: "69",
      type: "ERC721", // 'ERC721' or 'ERC1155'
    };
    const FOUR_HUNDRED_TWENTY_WETH = {
      tokenAddress: "0x6b175474e89094c44da98b954eedeac495271d0f", // WETH contract address
      amount: "420000000000000000000", // 420 Wrapped-ETH (WETH is 18 digits)
      type: "ERC20",
    };

    // [Part 1: Maker (owner of the Punk) creates trade]
    const nftSwapSdk = new NftSwapV4(await getDefaultProvider(), seller, CHAIN_ID);
    const walletAddressMaker = seller.address;

    // Approve NFT to trade (if required)
    await nftSwapSdk.approveTokenOrNftByAsset(CRYPTOPUNK, walletAddressMaker);

    // Build order
    const order = nftSwapSdk.buildOrder(
      CRYPTOPUNK, // Maker asset to swap
      FOUR_HUNDRED_TWENTY_WETH, // Taker asset to swap
      walletAddressMaker
    );
    // Sign order so order is now fillable
    const signedOrder = await nftSwapSdk.signOrder(order);

    // [Part 2: Taker that wants to buy the punk fills trade]
    const _nftSwapSdk = new NftSwap( await getDefaultProvider(), buyer, CHAIN_ID);
    const walletAddressTaker = buyer.address;

    // Approve USDC to trade (if required)
    await _nftSwapSdk.approveTokenOrNftByAsset(
      FOUR_HUNDRED_TWENTY_WETH,
      walletAddressTaker
    );

    // Fill order :)
    const fillTx = await _nftSwapSdk.fillSignedOrder(signedOrder);
    const fillTxReceipt = await _nftSwapSdk.awaitTransactionHash(fillTx.hash);
    console.log(`🎉 🥳 Order filled. TxHash: ${fillTxReceipt.transactionHash}`);
  });
});
