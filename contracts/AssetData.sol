pragma solidity ^0.4.24;

import "./Owned.sol";

contract AssetData  {
    
    mapping (address => uint) public assetIdByAddress;
    mapping (uint => address) public addressByAssetId;
                                     
    uint public assetId; //increments after creating new
    address public orderManager; 

    // only let order manager security
    modifier onlyOrderManager() {
        require(orderManager == msg.sender);
        _;
    }


    function save(address _assetAddress) public onlyOrderManager returns (bool success) {
        assetIdByAddress[_assetAddress] = assetId;
        addressByAssetId[assetId] = _assetAddress;
        assetId++;
        return true;
    }  
    
    function getAssetIdByAddress(address _assetAddress) public view returns (uint) {
        return assetIdByAddress[_assetAddress];
    }    
    function getAddressByAssetId(uint _assetId) public view returns (address) {
        return addressByAssetId[_assetId];
    }    

    //after being deployed set order manager so it only has access to write
    function setOrderManager(address _address) onlyOwner public returns (bool) {
        orderManager = _address;
        return true;
    }  

}