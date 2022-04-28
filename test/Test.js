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
    usd = await USD.connect(BUYER).deploy();

    BOREDPUNK = await ethers.getContractFactory("BOREDPUNK");
    boredPunk = await BOREDPUNK.deploy();
    boredPunk.connect(SELLER).safeMint(SELLER_SIGNER.address); */

    // console.log("boredPunk", boredPunk.address);
    // console.log("usd", usd.address);

    // Rinkeby Deployment...
    usd = { address: "0x2a70bfFa2e2F65c42dE7086356C8c9D5Ef7a7D45" };
    boredPunk = { address: "0x281BdCb7552bC606569fAeD0406407c79Df56Ca9" };

    Usd = await ethers.getContractAt("IERC20", usd.address);
    console.log("usd.balanceOf", await Usd.balanceOf(BUYER.address));

    CHAIN_ID = 4; // Hardhat is 31337, Ganache is 1337, Rinkeby is 4, Ropsten is 3

    gasPrice = parseInt(utils.parseUnits("132", "gwei"));
  });
  it("Scenario: User A wants to sell their BoredPunk for 420 USD", async function () {
    // Set up the assets we want to swap (CryptoPunk #69 and 420 WETH)
    const SELLER_ASSET = {
      tokenAddress: boredPunk.address,
      tokenId: "0",
      type: "ERC721", // 'ERC721' or 'ERC1155'
    };
    const BUYER_ASSET = {
      tokenAddress: usd.address,
      amount: "4200",
      type: "ERC20",
    };

    // [Part 1: Maker (owner of the Punk) creates trade]
    var nftSwapperMaker = new NftSwap(PROVIDER, SELLER_SIGNER, CHAIN_ID);
    const order = nftSwapperMaker.buildOrder(
      [SELLER_ASSET],
      [BUYER_ASSET],
      SELLER.address
    );

    const signedOrder = await nftSwapperMaker.signOrder(order, SELLER.address);
    console.log({ signedOrder });

    var _nftSwapperMaker = new NftSwap(PROVIDER, BUYER_SIGNER, CHAIN_ID);

    // Check if we need to approve the NFT for swapping
    const approvalStatusForUserB = await _nftSwapperMaker.loadApprovalStatus(
      BUYER_ASSET,
      BUYER.address
    );
    // If we do need to approve NFT for swapping, let's do that now
    if (!approvalStatusForUserB.contractApproved) {
      const approvalTx = await _nftSwapperMaker.approveTokenOrNftByAsset(
        BUYER_ASSET,
        BUYER.address
      );
      const approvalTxReceipt = await approvalTx.wait();
      console.log(
        `Approved ${usd.address} contract to swap with 0x. TxHash: ${approvalTxReceipt.transactionHash})`
      );
    }

    // Taker fills order
    const tx = await _nftSwapperMaker.fillSignedOrder(signedOrder, undefined, {
      gasPrice,
      gasLimit: "500000",
      value: parseEther("0.01"), //  Rinkeby still has protocol fees, so we give it a little bit of ETH so its happy.
    });

    const txReceipt = await tx.wait();
    console.log({ txReceipt });
    return;
    expect(txReceipt.transactionHash).toBeTruthy();
    console.log(`Swapped on Rinkeby (txHAsh: ${txReceipt.transactionIndex})`);
  });
});
