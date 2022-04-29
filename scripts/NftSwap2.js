
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
    gasPrice = parseInt(utils.parseUnits("132", "gwei"));
    // PROVIDER = await getDefaultProvider();
    PROVIDER = new ethers.providers.StaticJsonRpcProvider(
      process.env.RINKEBY_NODE
    );

    // Signer
    SELLER = new ethers.Wallet(process.env.PRV_KEY, PROVIDER);
    BUYER = new ethers.Wallet(process.env.PRV_KEY_2, PROVIDER);

    SELLER_SIGNER = SELLER.connect(PROVIDER);
    BUYER_SIGNER = SELLER.connect(PROVIDER);

    // Rinkeby Deployment...
    usd = { address: "0xa61C61D12596560E5D00a213EE8913e30C8a78A7" };
    boredPunk = { address: "0x9c0994f15cd0A976B4d3F98838d4096ddC8ccA8F" };
    // boredPunk = await ethers.getContractAt("BOREDPUNK", boredPunk.address);

    /* USD = await ethers.getContractFactory("USD");
    usd = await USD.connect(BUYER).deploy();

    BOREDPUNK = await ethers.getContractFactory("BOREDPUNK");
    boredPunk = await BOREDPUNK.deploy(); 
    await boredPunk.connect(SELLER).mint(SELLER.address, {
      gasPrice,
      gasLimit: 800000,
    });*/

    console.log("boredPunk", boredPunk.address);
    console.log("usd", usd.address);

    usd = await ethers.getContractAt("IERC20", usd.address);
    console.log("usd.balanceOf", await usd.balanceOf(BUYER.address));

    boredPunk = await ethers.getContractAt("IERC20", boredPunk.address);
    console.log(
      "boredPunk.balanceOf",
      await boredPunk.balanceOf(SELLER.address)
    );

    CHAIN_ID = 4; // Hardhat is 31337, Ganache is 1337, Rinkeby is 4, Ropsten is 3
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
    let nftSwapperMaker = new NftSwap(PROVIDER, SELLER_SIGNER, CHAIN_ID);

    // Check if we need to approve the NFT for swapping
    var approvalStatusForSeller = await nftSwapperMaker.loadApprovalStatus(
      SELLER_ASSET,
      SELLER.address
    );
    // If we do need to approve NFT for swapping, let's do that now
    if (!approvalStatusForSeller.contractApproved) {
      var approvalTx = await nftSwapperMaker.approveTokenOrNftByAsset(
        SELLER_ASSET,
        SELLER.address
      );
      var approvalTxReceipt = await approvalTx.wait();
      console.log(
        `Approved boredPunk ${boredPunk.address} contract to swap with 0x. TxHash: ${approvalTxReceipt.transactionHash})`
      );
    }

    const order = nftSwapperMaker.buildOrder(
      [SELLER_ASSET],
      [BUYER_ASSET],
      SELLER.address
    );

    const signedOrder = await nftSwapperMaker.signOrder(order, SELLER.address, SELLER_SIGNER);

    let _nftSwapperMaker = new NftSwap(PROVIDER, BUYER_SIGNER, CHAIN_ID);

    // Check if we need to approve the ERC20 for swapping
    const approvalStatusForUserB = await _nftSwapperMaker.loadApprovalStatus(
      BUYER_ASSET,
      BUYER.address
    );
    // If we do need to approve ERC20 for swapping, let's do that now
    if (!approvalStatusForUserB.contractApproved) {
      const approvalTx = await _nftSwapperMaker.approveTokenOrNftByAsset(
        BUYER_ASSET,
        BUYER.address
      );
      const approvalTxReceipt = await approvalTx.wait();
      console.log(
        `Approved usd ${usd.address} contract to swap with 0x. TxHash: ${approvalTxReceipt.transactionHash})`
      );
    }

    // Taker fills order
    const tx = await _nftSwapperMaker.fillSignedOrder(signedOrder,undefined, {
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
