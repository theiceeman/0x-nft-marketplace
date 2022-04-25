const { NftSwapV3: NftSwap, NftSwapV3 } = require("@traderxyz/nft-swap-sdk");
const { expect } = require("chai");
const { getDefaultProvider, BigNumber, utils } = require("ethers");
const { formatEther, parseEther } = require("ethers/lib/utils");
const { ethers } = require("hardhat");
const { transferEther, impersonateAccount } = require("./helpers/utils");
require("dotenv").config();

//
// const ETHER_WHALE = process.env.ETHER_WHALE;

describe("NftSwap", function () {
  before(async () => {
    [deployer] = await ethers.getSigners();
    PROVIDER = await getDefaultProvider();
    // console.log(PROVIDER)

    // Signer
    SELLER = new ethers.Wallet(process.env.PRV_KEY, await getDefaultProvider());
    BUYER = new ethers.Wallet(
      process.env.PRV_KEY_2,
      await getDefaultProvider()
    );

    SELLER_SIGNER = SELLER.connect(await getDefaultProvider());
    BUYER_SIGNER = SELLER.connect(await getDefaultProvider());

    // etherWhale = await impersonateAccount(ETHER_WHALE);
    // await transferEther(etherWhale, SELLER.address, "10");
    // await transferEther(etherWhale, BUYER.address, "10");

    //
    /*     
    USD = await ethers.getContractFactory("USD");
    usd = await USD.deploy();
    usd.connect(deployer).transfer(BUYER.address, parseEther("50000"));

    BOREDPUNK = await ethers.getContractFactory("BOREDPUNK");
    boredPunk = await BOREDPUNK.deploy();
    boredPunk.safeMint(SELLER_SIGNER.address);
    */

    usd = { address: '0x9b507d6f46fce3001e314b8ee6ff4f8b6cd15d9c' };
    boredPunk = { address: '0xbfadcd8007f59c5d37cc1bb73d8d69cd1ed4953e' };

    CHAIN_ID = 4; // Hardhat is 31337 Ganache is 1337

    gasPrice = parseInt(utils.parseUnits("132", "gwei"));
  });
  it("Scenario: User A wants to sell their BoredPunk for 420 USD", async function () {
    // Set up the assets we want to swap (CryptoPunk #69 and 420 WETH)
    const BOREDPUNK = {
      tokenAddress: boredPunk.address,
      tokenId: "0",
      type: "ERC721", // 'ERC721' or 'ERC1155'
    };
    const FOUR_HUNDRED_TWENTY_WETH = {
      tokenAddress: usd.address,
      amount: "420000000000000000000",
      type: "ERC20",
    };

    // [Part 1: Maker (owner of the Punk) creates trade]
    const nftSwapperMaker = new NftSwap(
      await getDefaultProvider(),
      SELLER_SIGNER,
      CHAIN_ID
    );
    const order = nftSwapperMaker.buildOrder(
      [BOREDPUNK],
      [FOUR_HUNDRED_TWENTY_WETH],
      SELLER.address,
      {
        // Fix dates and salt so we have reproducible tests
        expiration: new Date(3000, 10, 1),
      }
    );

    const normalizedOrder = nftSwapperMaker.normalizeOrder(order);
    const signedOrder = await nftSwapperMaker.signOrder(
      normalizedOrder,
      SELLER.address,
      SELLER_SIGNER
    );

    const normalizedSignedOrder = nftSwapperMaker.normalizeOrder(signedOrder);

    expect(normalizedSignedOrder.makerAddress.toLowerCase()).to.equal(
      SELLER.address.toLowerCase()
    );

    // Uncomment to actually fill order
    const tx = await nftSwapperMaker.fillSignedOrder(signedOrder, undefined, {
      gasPrice,
      gasLimit: "500000",
      value: parseEther("0.01"), //  Rinkeby still has protocol fees, so we give it a little bit of ETH so its happy.
    });
    console.log(tx);
    return;

    const txReceipt = await tx.wait();
    expect(txReceipt.transactionHash).toBeTruthy();
    console.log(`Swapped on Rinkeby (txHAsh: ${txReceipt.transactionIndex})`);
  });
});
