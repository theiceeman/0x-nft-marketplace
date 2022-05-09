// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "erc721a/contracts/ERC721A.sol";
import {Base64} from "./libraries/Base64.sol";

contract BOREDPUNK is ERC721A {
  string public baseTokenUri;


    constructor() ERC721A("BoredPunk", "BOREDPUNK") {}

    function _baseURI() internal view virtual override returns (string memory) {
        return baseTokenUri;
    }

    function mint(uint256 quantity, bytes32 data) external payable {
        // Get all the JSON metadata in place and base64 encode it.
        string memory json = Base64.encode(
            bytes(string(abi.encodePacked(data)))
        );
        // Just like before, we prepend data:application/json;base64, to our data.
        string memory finalTokenUri = string(
            abi.encodePacked("data:application/json;base64,", json)
        );
        // _safeMint's second argument now takes in a quantity, not a tokenId.
        _safeMint(msg.sender, quantity);
    }
}
