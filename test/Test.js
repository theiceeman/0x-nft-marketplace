const { NftSwapV3: NftSwap, signOrder } = require("@traderxyz/nft-swap-sdk");
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
    // [deployer] = await ethers.getSigners();
    // PROVIDER = await getDefaultProvider();
    PROVIDER = new ethers.providers.StaticJsonRpcProvider(
      process.env.RINKEBY_NODE
    );

    // Signer
    SELLER = new ethers.Wallet(process.env.PRV_KEY, PROVIDER);
    BUYER = new ethers.Wallet(process.env.PRV_KEY_2, PROVIDER);

    SELLER_SIGNER = SELLER.connect(PROVIDER);
    BUYER_SIGNER = SELLER.connect(PROVIDER);

    /* USD = await ethers.getContractFactory("USD");
    usd = await USD.deploy();
    usd.connect(SELLER).transfer(BUYER.address, parseEther("50000"));

    BOREDPUNK = await ethers.getContractFactory("BOREDPUNK");
    boredPunk = await BOREDPUNK.deploy();
    boredPunk.connect(SELLER).safeMint(SELLER_SIGNER.address); */

    // console.log('boredPunk',boredPunk.address)
    // console.log('usd',usd.address)

    // Rinkeby Deployment...
    usd = { address: "0x20de04b91238d7927B61f07deA051A0042F4e9f1" };
    boredPunk = { address: "0x7DC5442C68C2C89a6A80BEF37ABCF1b08E6a4556" };

    CHAIN_ID = 4; // Hardhat is 31337, Ganache is 1337, Rinkeby is 4, Ropsten is 3

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
    var nftSwapperMaker = new NftSwap(PROVIDER, SELLER_SIGNER, CHAIN_ID);
    const order = nftSwapperMaker.buildOrder(
      [BOREDPUNK],
      [FOUR_HUNDRED_TWENTY_WETH],
      SELLER.address
    );

    const signedOrder = await nftSwapperMaker.signOrder(order, SELLER.address);
    console.log({ signedOrder });

    var nftSwapperMaker = new NftSwap(PROVIDER, BUYER_SIGNER, CHAIN_ID);

    // Uncomment to actually fill order
    const tx = await nftSwapperMaker.fillSignedOrder(signedOrder, undefined, {
      gasPrice,
      gasLimit: "500000",
      value: parseEther("0.05"), //  Rinkeby still has protocol fees, so we give it a little bit of ETH so its happy.
    });

    const txReceipt = await tx.wait();
    console.log({ txReceipt });
    return;
    expect(txReceipt.transactionHash).toBeTruthy();
    console.log(`Swapped on Rinkeby (txHAsh: ${txReceipt.transactionIndex})`);
  });
});
