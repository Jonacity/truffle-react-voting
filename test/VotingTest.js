const Voting                            = artifacts.require('Voting');
const { expect }                        = require('chai');
const { BN, expectRevert, expectEvent } = require('@openzeppelin/test-helpers');

contract("Voting tests", accounts => {
    const owner = accounts[0];
    const user1 = accounts[1];
    const user2 = accounts[2];
    const user3 = accounts[3];
    const user4 = accounts[4];
    const user5 = accounts[5];
    let votingInstance;

    describe("Add voters", () => {
        // Create a new instance of voting contract
        before(async () => {
            votingInstance = await Voting.new({ from: owner });
        });

        it("Should start at first workflow status", async () => {
            expect(await votingInstance.workflowStatus()).to.bignumber.equal(new BN(0));
        });

        it("Should add voters", async () => {
            await votingInstance.addVoter(user1, { from: owner });
            let user2Data = await votingInstance.getVoter.call(user2, { from: user1 });
            expect(user2Data.isRegistered).to.be.equal(false);

            await votingInstance.addVoter(user2, { from: owner });
            user2Data = await votingInstance.getVoter.call(user2, { from: user1 });
            expect(user2Data.isRegistered).to.be.equal(true);
        });

        it("Should emit an event adding a voter", async () => {
            expectEvent(await votingInstance.addVoter(user3, { from: owner }), "VoterRegistered", { voterAddress: user3 });
        });

        it("Should revert adding a voter already registered", async () => {
            await votingInstance.addVoter(user4, { from: owner });
            await expectRevert(votingInstance.addVoter(user4, { from: owner }), "Already registered");
        });

        it("Should revert adding a voter from a voter", async () => {
            await expectRevert(votingInstance.addVoter(user1, { from: user2 }), "Ownable: caller is not the owner.");
        });
    });

    describe("Get a voter", () => {
        /**
         * Create a new instance of voting contract
         * Add 3 voters from seed addresses
         */
        before(async () => {
            votingInstance = await Voting.new({ from: owner });
            for (n = 1; n <= 3; n ++) {
                await votingInstance.addVoter(accounts[n], { from: owner });
            }
        });

        it("Should get a voter", async () => {
            const user2Data = await votingInstance.getVoter.call(user2, { from: user1 });
            expect(user2Data.isRegistered).to.be.equal(true);
            expect(user2Data.hasVoted).to.be.equal(false);
            expect(new BN(user2Data.votedProposalId)).to.be.bignumber.equal(new BN(0));
        });

        it("Should revert getting a voter from unregistered address", async () => {
            await expectRevert(votingInstance.getVoter(user1, { from: user4 }), "You're not a voter");
        });
    });

    describe("Add proposals", () => {
        /**
         * Create a new instance of voting contract
         * Add 4 voters from seed addresses
         */
        before(async () => {
            votingInstance = await Voting.new({ from: owner });
            for (n = 1; n <= 4; n ++) {
                await votingInstance.addVoter(accounts[n], { from: owner });
            }
        });

        it("Should revert adding proposal before proposal registration", async () => {
            await expectRevert(votingInstance.addProposal("This is a revolution", { from: user1 }), "Proposals are not allowed yet");
        });

        it("Should add a proposal", async () => {
            await votingInstance.startProposalsRegistering({ from: owner });
            await votingInstance.addProposal("This is a revolution", { from: user1 });
            expect(await votingInstance.workflowStatus()).to.bignumber.equal(new BN(1));
        });

        it("Should add another proposal from the same user", async () => {
            await votingInstance.addProposal("This is another revolution", { from: user1 });
        });

        it("Should emit an event adding a proposal", async () => {
            expectEvent(await votingInstance.addProposal("This is a big revolution", { from: user3 }), "ProposalRegistered", { proposalId: new BN(2) });
        });

        it("Should revert adding proposal without description", async () => {
            await expectRevert(votingInstance.addProposal("", { from: user4 }), "Vous ne pouvez pas ne rien proposer");
        });

        it("Should revert adding proposal from unregistered address", async () => {
            await expectRevert(votingInstance.addProposal("Just a simple evolution", { from: user5 }), "You're not a voter");
        });
    });

    describe("Get a proposal", () => {
        /**
         * Create a new instance of voting contract
         * Add 3 voters from seed addresses
         * Start proposals registration
         * Add 3 proposals from added voters
         */
        before(async () => {
            votingInstance = await Voting.new({ from: owner });
            for (n = 1; n <= 3; n ++) {
                await votingInstance.addVoter(accounts[n], { from: owner });
            }
            await votingInstance.startProposalsRegistering({ from: owner });
            for (n = 1; n <= 3; n ++) {
                await votingInstance.addProposal(`Revolution-${n}`, { from: accounts[n] })
            }
        });

        it("Should get a proposal", async () => {
            proposalData = await votingInstance.getOneProposal.call(0, { from: user2 })
            expect(proposalData.description).to.equal("Revolution-1");
        });

        it("Should revert getting proposal from unregistered address", async () => {
            await expectRevert(votingInstance.getOneProposal(99, { from: user4 }), "You're not a voter");
        });
    });

    describe("Set vote", () => {
        /**
         * Create a new instance of voting contract
         * Add 4 voters from seed addresses
         * Start proposals registration
         * Add 4 proposals from added voters
         * End proposals registration
         */
        before(async () => {
            votingInstance = await Voting.new({ from: owner });
            for (n = 1; n <= 4; n ++) {
                await votingInstance.addVoter(accounts[n], { from: owner });
            }
            await votingInstance.startProposalsRegistering({ from: owner });
            for (n = 1; n <= 4; n ++) {
                await votingInstance.addProposal(`Revolution-${n}`, { from: accounts[n] })
            }
            await votingInstance.endProposalsRegistering({ from: owner });
        });

        it("Should revert voting before voting session started", async () => {
            await expectRevert(votingInstance.setVote(0, { from: user2 }), "Voting session havent started yet");
        });

        it("Should emit an event starting the voting session", async () => {
            expectEvent(await votingInstance.startVotingSession({ from: owner }), "WorkflowStatusChange", { previousStatus: new BN(2), newStatus: new BN(3) });
        });

        it("Should emit an event after a vote", async () => {
            expectEvent(await votingInstance.setVote(3, { from: user2 }), "Voted", { voter: user2, proposalId: new BN(3) });
        });

        it("Should revert voting twice", async () => {
            await votingInstance.setVote(2, { from: user1 })
            await expectRevert(votingInstance.setVote(1, { from: user1 }), "You have already voted");
        });

        it("Should increment voteCount on a proposal", async () => {
            proposalData = await votingInstance.getOneProposal.call(1, { from: user3 })
            expect(new BN(proposalData.voteCount)).to.bignumber.equal(new BN(0));

            await votingInstance.setVote(1, { from: user3 })
            proposalData = await votingInstance.getOneProposal.call(1, { from: user3 })
            expect(new BN(proposalData.voteCount)).to.bignumber.equal(new BN(1));
        });

        it("Should revert voting for invalid proposal id", async () => {
            await expectRevert(votingInstance.setVote(99, { from: user4 }), "Proposal not found");
        });

        it("Should revert voting when proposal id equals to proposalsArray length", async () => {
            await expectRevert(votingInstance.setVote(4, { from: user4 }), "Panic: Index out of bounds");
        });

        it("Should update voted proposal id after voting", async () => {
            let user4Data = await votingInstance.getVoter.call(user4, { from: user1 })
            expect(user4Data.hasVoted).to.equal(false);
            expect(new BN(user4Data.votedProposalId)).to.be.bignumber.equal(new BN(0));

            await votingInstance.setVote(2, { from: user4 })
            user4Data = await votingInstance.getVoter.call(user4, { from: user1 })
            expect(user4Data.hasVoted).to.equal(true);
            expect(new BN(user4Data.votedProposalId)).to.be.bignumber.equal(new BN(2));
        });

        it("Should revert voting from unregistered address", async () => {
            await expectRevert(votingInstance.setVote(2, { from: user5 }), "You're not a voter");
        });
    });

    describe("Tally votes", () => {
        /**
         * Create a new instance of voting contract
         * Add 5 voters from seed addresses
         * Start proposals registration
         * Add 5 proposals from added voters
         * End proposals registration
         * Start voting session
         * Set vote using n % 2 to distribute the votes
         */
        beforeEach(async () => {
            votingInstance = await Voting.new({ from: owner });
            for (n = 1; n <= 5; n ++) {
                await votingInstance.addVoter(accounts[n], { from: owner });
            }
            await votingInstance.startProposalsRegistering({ from: owner });
            for (n = 1; n <= 5; n ++) {
                await votingInstance.addProposal(`Revolution-${n}`, { from: accounts[n] })
            }
            await votingInstance.endProposalsRegistering({ from: owner });
            await votingInstance.startVotingSession({ from: owner });
            for (n = 1; n <= 5; n ++) {
                await votingInstance.setVote(n % 2, { from: accounts[n] })
            }
        });

        it("Should revert tally votes before voting session ended", async () => {
            await expectRevert(votingInstance.tallyVotes({ from: owner }), "Current status is not voting session ended");
        });

        it("Should tally votes", async () => {
            await votingInstance.endVotingSession({ from: owner });
            expect(await votingInstance.workflowStatus()).to.bignumber.equal(new BN(4));
            expect(await votingInstance.winningProposalID()).to.bignumber.equal(new BN(0));

            await votingInstance.tallyVotes({ from: owner });
            expect(await votingInstance.winningProposalID()).to.bignumber.equal(new BN(1));
            expect(await votingInstance.workflowStatus()).to.bignumber.equal(new BN(5));
        });

        it("Should emit an event after tally votes", async () => {
            await votingInstance.endVotingSession({ from: owner });
            expectEvent(await votingInstance.tallyVotes({ from: owner }), "WorkflowStatusChange", { previousStatus: new BN(4), newStatus: new BN(5) });
        });

        it("Should revert tallying votes from a voter", async () => {
            await expectRevert(votingInstance.tallyVotes({ from: user1 }), "Ownable: caller is not the owner.");
        });
    });
});
