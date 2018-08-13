pragma solidity ^0.4.24;

import './Asset.sol';  //change to interface later
import './Owned.sol';  //change to interface later

contract Arbitration is Owned {
    
    enum Reasons { SPAM, BROKEN, NOTRECIEVED, NOREASON }
    enum Winners { UNDECIDED, REPORTER, SELLER  }
    enum Statuses { REPORTED, SELLER_STAKED_2X, REPORTER_STAKED_2X, RESOLVED, UNRESOLVED }

    bytes12 public arbitrationId;
    address public reporter;
    Reasons public reason;
    
    uint public baseStake;
    uint public reporterStakeTotal;
    uint public sellerStakeTotal;
    
    Winners public winner;
    Statuses public status;

    address public asset;
    address public arbitrator;

    modifier onlyArbitrator() {
        require(arbitrator == msg.sender);
        _;
    }

    modifier onlyReporter() {
        require(msg.sender == reporter);
        _;
    }
    modifier onlyStatus(Statuses _status) {
        require(_status == status);
        _;
    }

    constructor(address _assetAddress, bytes12 _arbitrationId, Reasons _reason, address _reporter, uint _stakeAmount) public {
        arbitrationId = _arbitrationId;
        reason = _reason;
        reporter = _reporter;
        reporterStakeTotal = _stakeAmount;
        baseStake = _stakeAmount;

        status = Statuses.REPORTED;
        asset = _assetAddress;

        owner = msg.sender;
    }  
    
    //@desc selected arbitrator gets to decide case
    //Arbitrator can select winner only after reporter 2x
    function setWinner(Winners _winner) public onlyOwner onlyStatus(Statuses.REPORTER_STAKED_2X) {
        winner = _winner;
        status = Statuses.RESOLVED;
    }    

    function getWinner() public view returns (Winners) {
        return winner;
    }    


    //@desc set arbitrator so that person resolves this arbitration
    function setArbitrator(address _arbitrator) public onlyOwner {
        arbitrator = _arbitrator;
    } 

    //@desc get arbitrator
    function getArbitrator() public view returns (address) {
       return arbitrator;
    } 

    //@desc seller disputes reporter by staking initial stake amount
    //@desc initial stake is asset contract
    function set2xStakeBySeller() public onlyOwner {
        sellerStakeTotal += baseStake; //match reported stake by seller
        status = Statuses.SELLER_STAKED_2X;
        // splytManager.internalContribute (asset.seller(), this, baseStake); 
        // emit Success(4, address(arbitration)); 
    }      

    //@desc report puts in 2x stake
    function set2xStakeByReporter() public onlyOwner {
        reporterStakeTotal += baseStake;
        //match reported stake by seller
        status = Statuses.REPORTER_STAKED_2X;
        // splytManager.internalContribute (reporter, this, baseStake); 
        // emit Success(4, address(arbitration)); 
    }     
    
    function getSeller() public view returns (address) {
        return Asset(asset).seller();
    }  

}