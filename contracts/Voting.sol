// SPDX-License-Identifier: MIT

pragma solidity 0.8.13;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Voting smart contract
 *
 * @author Jonacity
 *
 * @dev A simple voting system
 */
contract Voting is Ownable {

    struct Voter {
        bool isRegistered;
        bool hasVoted;
        uint votedProposalId;
    }
    struct Proposal {
        string description;
        uint voteCount;
    }
    enum WorkflowStatus {
        RegisteringVoters,
        ProposalsRegistrationStarted,
        ProposalsRegistrationEnded,
        VotingSessionStarted,
        VotingSessionEnded,
        VotesTallied
    }

    uint8 public winningProposalID;
    uint8 maxProposals = 50;
    Proposal[] proposalsArray;
    address[] votersArray;
    mapping (address => Voter) voters;
    WorkflowStatus public workflowStatus;

    event VoterRegistered(address voterAddress);
    event ProposalRegistered(uint proposalId);
    event Voted (address voter, uint proposalId);
    event ResetVote(uint date, uint blockNumber);
    event WorkflowStatusChange(WorkflowStatus previousStatus, WorkflowStatus newStatus);

    /**
     * @dev Constructor: the contract owner is added as voter
     */
    constructor() {
        addVoter(msg.sender);
    }

    /**
     * @dev Check if the sender is a registered voter
     */
    modifier onlyVoters() {
        require(voters[msg.sender].isRegistered, "You're not a voter");
        _;
    }

    // ::::::::::::: GETTERS ::::::::::::: //
    /**
     * @dev Get a voter from an address
     *
     * @param _addr Address of the user
     *
     * @return Voter Voter details
     */
    function getVoter(address _addr) external onlyVoters view returns (Voter memory) {
        return voters[_addr];
    }

    /**
     * @dev Get a proposal from an id
     *
     * @param _id Proposal id
     *
     * @return Proposal Proposal details
     */
    function getOneProposal(uint _id) external onlyVoters view returns (Proposal memory) {
        return proposalsArray[_id];
    }

    /**
     * @dev Get all proposals
     *
     * @return Proposal[] Added proposals list
     */
    function getProposals() external onlyVoters view returns (Proposal[] memory) {
        return proposalsArray;
    }

    /**
     * @dev Get all voters addresses
     *
     * @return address[] Registered voters addresses
     */
    function getVoters() external onlyVoters view returns (address[] memory) {
        return votersArray;
    }

    // ::::::::::::: REGISTRATION ::::::::::::: //
    /**
     * @dev Register a voter and add his address into the votersArray
     *
     * @param _addr Voter address
     */
    function addVoter(address _addr) public onlyOwner {
        require(workflowStatus == WorkflowStatus.RegisteringVoters, 'Voters registration is not open yet');
        require(voters[_addr].isRegistered != true, 'Already registered');

        voters[_addr].isRegistered = true;
        votersArray.push(_addr);
        emit VoterRegistered(_addr);
    }

    /* facultatif
     * function deleteVoter(address _addr) external onlyOwner {
     *   require(workflowStatus == WorkflowStatus.RegisteringVoters, 'Voters registration is not open yet');
     *   require(voters[_addr].isRegistered == true, 'Not registered.');
     *   voters[_addr].isRegistered = false;
     *  emit VoterRegistered(_addr);
    }*/

    // ::::::::::::: PROPOSAL ::::::::::::: //
    /**
     * @dev Create a proposal
     *
     * @param _desc Proposal description
     */
    function addProposal(string memory _desc) external onlyVoters {
        require(workflowStatus == WorkflowStatus.ProposalsRegistrationStarted, 'Proposals are not allowed yet');
        require(keccak256(abi.encode(_desc)) != keccak256(abi.encode("")), 'Vous ne pouvez pas ne rien proposer'); // facultatif
        require(proposalsArray.length <= maxProposals, "For this vote, you are allowed to create 50 proposals max");
        // voir que desc est different des autres

        Proposal memory proposal;
        proposal.description = _desc;
        proposalsArray.push(proposal);
        emit ProposalRegistered(proposalsArray.length-1);
    }

    // ::::::::::::: VOTE ::::::::::::: //
    /**
     * @dev Vote to a proposal
     *
     * @param _id Proposal id
     */
    function setVote( uint _id) external onlyVoters {
        require(workflowStatus == WorkflowStatus.VotingSessionStarted, 'Voting session havent started yet');
        require(voters[msg.sender].hasVoted != true, 'You have already voted');
        require(_id <= proposalsArray.length, 'Proposal not found'); // pas obligé, et pas besoin du >0 car uint

        voters[msg.sender].votedProposalId = _id;
        voters[msg.sender].hasVoted = true;
        proposalsArray[_id].voteCount++;
        emit Voted(msg.sender, _id);
    }

    // ::::::::::::: STATE ::::::::::::: //
    /* on pourrait factoriser tout ça: par exemple:
    *
    *  modifier checkWorkflowStatus(uint  _num) {
    *    require (workflowStatus=WorkflowStatus(uint(_num)-1, "bad workflowstatus");
    *    require (num != 5, "il faut lancer tally votes");
    *    _;
    *  }
    *
    *  function setWorkflowStatus(WorkflowStatus _num) public checkWorkflowStatus( _num) onlyOwner {
    *    WorkflowStatus old = workflowStatus;
    *    workflowStatus = WorkflowStatus(_num);
    *    emit WorkflowStatusChange(old, workflowStatus);
    *   }
    *
    *  ou plus simplement:
    *  function nextWorkflowStatus() onlyOwner{
    *    require (uint(workflowStatus)!=4, "il faut lancer tallyvotes");
    *    WorkflowStatus old = workflowStatus;
    *    workflowStatus= WorkflowStatus(uint (workflowstatus) + 1);
    *    emit WorkflowStatusChange(old, workflowStatus);
    *  }
    *
    */

    /**
     * @dev Start the proposals registering
     */
    function startProposalsRegistering() external onlyOwner {
        require(workflowStatus == WorkflowStatus.RegisteringVoters, 'Registering proposals cant be started now');

        workflowStatus = WorkflowStatus.ProposalsRegistrationStarted;
        emit WorkflowStatusChange(WorkflowStatus.RegisteringVoters, WorkflowStatus.ProposalsRegistrationStarted);
    }

    /**
     * @dev End the proposals registering
     */
    function endProposalsRegistering() external onlyOwner {
        require(workflowStatus == WorkflowStatus.ProposalsRegistrationStarted, 'Registering proposals havent started yet');

        workflowStatus = WorkflowStatus.ProposalsRegistrationEnded;
        emit WorkflowStatusChange(WorkflowStatus.ProposalsRegistrationStarted, WorkflowStatus.ProposalsRegistrationEnded);
    }

    /**
     * @dev Start the voting session
     */
    function startVotingSession() external onlyOwner {
        require(workflowStatus == WorkflowStatus.ProposalsRegistrationEnded, 'Registering proposals phase is not finished');

        workflowStatus = WorkflowStatus.VotingSessionStarted;
        emit WorkflowStatusChange(WorkflowStatus.ProposalsRegistrationEnded, WorkflowStatus.VotingSessionStarted);
    }

    /**
     * @dev End the voting session
     */
    function endVotingSession() external onlyOwner {
        require(workflowStatus == WorkflowStatus.VotingSessionStarted, 'Voting session havent started yet');

        workflowStatus = WorkflowStatus.VotingSessionEnded;
        emit WorkflowStatusChange(WorkflowStatus.VotingSessionStarted, WorkflowStatus.VotingSessionEnded);
    }

    /* function tallyVotesDraw() external onlyOwner {
       require(workflowStatus == WorkflowStatus.VotingSessionEnded, "Current status is not voting session ended");
        uint highestCount;
        uint[5]memory winners; // egalite entre 5 personnes max
        uint nbWinners;
        for (uint i = 0; i < proposalsArray.length; i++) {
            if (proposalsArray[i].voteCount == highestCount) {
                winners[nbWinners]=i;
                nbWinners++;
            }
            if (proposalsArray[i].voteCount > highestCount) {
                delete winners;
                winners[0]= i;
                highestCount = proposalsArray[i].voteCount;
                nbWinners=1;
            }
        }
        for(uint j=0;j<nbWinners;j++){
            winningProposalsID.push(winners[j]);
            winningProposals.push(proposalsArray[winners[j]]);
        }
        workflowStatus = WorkflowStatus.VotesTallied;
        emit WorkflowStatusChange(WorkflowStatus.VotingSessionEnded, WorkflowStatus.VotesTallied);
    } */


    /**
     * @dev Tally the votes and set the proposal winner (winningProposalId)
     */
    function tallyVotes() external onlyOwner {
            require(workflowStatus == WorkflowStatus.VotingSessionEnded, "Current status is not voting session ended");

            uint8 _winningProposalId;
            for (uint8 p = 0; p < proposalsArray.length; p++) {
                if (proposalsArray[p].voteCount > proposalsArray[_winningProposalId].voteCount) {
                    _winningProposalId = p;
                }
            }
            winningProposalID = _winningProposalId;
            workflowStatus = WorkflowStatus.VotesTallied;
            emit WorkflowStatusChange(WorkflowStatus.VotingSessionEnded, WorkflowStatus.VotesTallied);
        }

    /**
     * @dev Reset the voting system restoring all variables to initial values
     */
    function resetVote() public onlyOwner {
        // require(workflowStatus == WorkflowStatus.VotesTallied, "Votes not tallied");

        for (uint n = 0; n < votersArray.length; n ++) {
            delete voters[votersArray[n]];
        }
        delete votersArray;
        delete proposalsArray;
        winningProposalID = 0;
        workflowStatus = WorkflowStatus.RegisteringVoters;
        addVoter(msg.sender);
        emit ResetVote(block.timestamp, block.number);
    }

}
