import React, { useState, useEffect, useRef } from "react";
import VotingContract                         from "./contracts/Voting.json";
import getWeb3                                from "./getWeb3";
import "./App.css";

const App = () => {

  const [w3State, setState] = useState({
    web3: null,
    accounts: null,
    contract: null,
    owner: null
  });

  const [voterInput, setVoterInput] = useState("");
  const [proposalInput, setProposalInput] = useState("");
  const [currentUser, setCurrentUser] = useState({});
  const [workflowStatus, setWorkFlowStatus] = useState("0");
  const [proposals, setProposals] = useState([]);
  const [proposalWinningId, setProposalWinningId] = useState(null);
  const [votersCount, setVotersCount] = useState(0);
  const [isRegistered, setIsRegistered] = useState(false);

  const inputRef = useRef();

  useEffect(() => {
    (async () => {
      try {
        // Get network provider and web3 instance.
        const web3 = await getWeb3();
  
        // Use web3 to get the user's accounts.
        const accounts = await web3.eth.getAccounts();
  
        // Get the contract instance.
        const networkId = await web3.eth.net.getId();
        const deployedNetwork = VotingContract.networks[networkId];
        const instance = new web3.eth.Contract(
          VotingContract.abi,
          deployedNetwork && deployedNetwork.address,
        );
        const owner = await instance.methods.owner().call();
        const workflowStatus = await instance.methods.workflowStatus().call();
          
        setState({
          web3,
          accounts,
          contract: instance,
          owner
        });
        setWorkFlowStatus(workflowStatus);
        
        if (accounts[0] === owner) {
          const currentUser = await instance.methods.getVoter(accounts[0]).call({ from: accounts[0] });
          setCurrentUser(currentUser);
          setIsRegistered(true)
          const voters = await instance.methods.getVoters().call({ from: accounts[0] });
          setVotersCount(voters.length);
          const proposalsList = await instance.methods.getProposals().call({ from: accounts[0] });
          setProposals(proposalsList);
        } else {
          let options = {
            fromBlock: 0,
            toBlock: 'latest'
          };
          const resetData = await instance.getPastEvents("ResetVote", options)
      
          options = {
            // filter: {
            //     value: "address"
            // },
            fromBlock: resetData[resetData.length - 1].returnValues.blockNumber,
            toBlock: 'latest'
          };  
          const votersData = await instance.getPastEvents("VoterRegistered", options)
          // console.log("votersData", votersData);
          votersData.map(async event => {
            if (event.returnValues.voterAddress === accounts[0]) {
              setIsRegistered(true);
              const currentUser = await instance.methods.getVoter(accounts[0]).call({ from: accounts[0] });
              setCurrentUser(currentUser);

              if (parseInt(workflowStatus) >= 1) {
                const proposalsList = await instance.methods.getProposals().call({ from: accounts[0] });
                setProposals(proposalsList);
              }
            }
          });
        }

        await instance.events.VoterRegistered()
          .on("data", async event => {
              const voterAddress = event.returnValues.voterAddress;
              if (voterAddress === accounts[0]) {
                  const currentUser = await instance.methods.getVoter(accounts[0]).call({ from: accounts[0] });
                  setCurrentUser(currentUser);
                  setIsRegistered(true);
              }
              if (accounts[0] === owner) {
                const voters = await instance.methods.getVoters().call({ from: accounts[0] });
                setVotersCount(voters.length);
              }
              console.log("New voter have been registered: " + voterAddress);
          })
          .on("changed", changed => console.log(changed))
          .on("error", err => console.error(err))
          .on("connected", str => console.log(str));

        await instance.events.ProposalRegistered()
          .on("data", async event => {
              const proposalsList = await instance.methods.getProposals().call({ from: accounts[0] });
              setProposals(proposalsList);
              console.log("New proposal pushed.");
          })
          .on("changed", changed => console.log(changed))
          .on("error", err => console.error(err))
          .on("connected", str => console.log(str));
      } catch (error) {
        // Catch any errors for any of the above operations.
        alert(
          `Failed to load web3, accounts, or contract. Check console for details.`,
        );
        console.error(error);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
        // if (state && state.contract && state.contract.methods) {
          if (workflowStatus === "5") {
              const { contract, owner } = w3State;
              const proposalsList = await contract.methods.getProposals().call({ from: owner });
              const proposalWinningId = await contract.methods.winningProposalID().call({ from: owner });
              setProposals(proposalsList);
              setProposalWinningId(proposalWinningId);
          }
    })()
}, [workflowStatus]);

  // useEffect(() => {
  //   (function () {
  //       if (workflowStatus === "0") {
  //           setActiveStep(0);
  //       } else if (
  //           workflowStatus === "1" ||  
  //           workflowStatus === "2"
  //       ) {
  //           setActiveStep(1);
  //       } else if (
  //           workflowStatus === "3" ||  
  //           workflowStatus === "4"
  //       ) {
  //           setActiveStep(2);
  //       } else if (workflowStatus === "5") {
  //           setActiveStep(4);
  //       }
  //   })();
  // }, [workflowStatus]);

  console.log("currentUser2", currentUser);

  const handleChangeVoter = (e) => {
    e.preventDefault();
    setVoterInput(e.target.value);
  }

  const handleChangeProposal = (e) => {
    e.preventDefault();
    setProposalInput(e.target.value);
  }

  const handleSubmitVoter = async () => {
    const { accounts, contract, owner } = w3State;
    await contract.methods.addVoter(voterInput).send({ from: owner });
  }

  const handleSubmitProposal = async () => {
    const { accounts, contract, owner } = w3State;
    await contract.methods.addProposal(proposalInput).send({ from: accounts[0] });
  }

  const syncWorkflowStatus = async () => {
    const workflowStatus = await w3State.contract.methods.workflowStatus().call();
    setWorkFlowStatus(workflowStatus);
  }

  const startProposalsRegistering = async () => {
    const { accounts, contract, owner } = w3State;
    await w3State.contract.methods.startProposalsRegistering().send({ from: owner });
    await syncWorkflowStatus();
  }

  const endProposalsRegistering = async () => {
    const { accounts, contract, owner } = w3State;
    await contract.methods.endProposalsRegistering().send({ from: owner });
    await syncWorkflowStatus();
  }

  const startVotingSession = async () => {
    const { accounts, contract, owner } = w3State;
    await contract.methods.startVotingSession().send({ from: owner });
    await syncWorkflowStatus();
  }

  const endVotingSession = async () => {
    const { accounts, contract, owner } = w3State;
    await contract.methods.endVotingSession().send({ from: owner });
    await syncWorkflowStatus();
  }

  const tallyVotes = async () => {
    const { accounts, contract, owner } = w3State;
    await contract.methods.tallyVotes().send({ from: owner });
    await syncWorkflowStatus();
  }

  const resetVote = async () => {
    const { accounts, contract, owner } = w3State;
    await contract.methods.resetVote().send({ from: owner });
    await syncWorkflowStatus();
    setProposals([]);
    const voters = await contract.methods.getVoters().call({ from: accounts[0] });
    setVotersCount(voters.length);
  }

  const isOwner = () => w3State.accounts[0] === w3State.owner;

  const renderLoggedUser = () => {
    if (isOwner()) {
      return "owner";
    }

    if (isRegistered) {
      return "registered";
    }

    return "not registered";
  };

  const renderVotersCount = () => <p>{votersCount} registered {votersCount > 1 ? "voters" : "voter"}</p>

  const renderStepButton = () => {
    switch (workflowStatus) {
      case "0":
        return <button onClick={startProposalsRegistering}>Start proposal registration</button>;
      case "1":
        return <button onClick={endProposalsRegistering}>End proposal registration</button>;
      case "2":
        return <button onClick={startVotingSession}>Start voting session</button>;
      case "3":
        return <button onClick={endVotingSession}>End voting session</button>;
      case "4":
        return <button onClick={tallyVotes}>Tally votes</button>;
      case "5":
        return <button onClick={resetVote}>Reset vote</button>;
    }
  }

  const vote = async index => {
    const { accounts, contract } = w3State;
    await contract.methods.setVote(index).send({ from: accounts[0] });
    const currentUser = await contract.methods.getVoter(accounts[0]).call();
    setCurrentUser(currentUser);
  }

  const renderVoterButton = () => {
    return (
      <div>
        <br /><br />
        <input value={voterInput} onChange={handleChangeVoter} />
        <button onClick={handleSubmitVoter}>Add voter</button>
      </div>
    )
  }

  const wrapperProposal = () => {
    return (
      <div>
        {workflowStatus === "1" && (
          <>
            <input value={proposalInput} onChange={handleChangeProposal} />
            <button onClick={handleSubmitProposal}>Add proposal</button>
          </>
        )}
        {workflowStatus !== "0" && renderProposals(proposals)}
      </div>
    )
  }

  const renderProposals = (proposals) => {
    if (proposals.length === 0) {
      return <p>There is no proposal registered yet.</p>
    }
  
    return (
      <div>
        {proposalWinningId && <p><b>The winner proposal is: {proposals[proposalWinningId].description}</b></p>}
        Proposals:
        {proposals.map((proposal, index) =>
          <div key={index}>
            <p>{proposal.description}</p>
            {workflowStatus === "3" && !currentUser.hasVoted &&
            <button onClick={() => vote(index)}>Vote</button>}
            {workflowStatus === "5" &&
            <div>{proposal.voteCount} {proposal.voteCount > 1 ? "votes" : "vote"}</div>}
          </div>
        )}
      </div>
    )
  }

  if (w3State.web3 === null) {
    return <div>Loading Web3, accounts, and contract...</div>;
  }

  return (
    <div className="App">
      <h1>Voting dApp project</h1>
      <p>Truffle react box example</p>
      <p><strong>You are {renderLoggedUser()} ({w3State.accounts[0]})</strong></p>
      {isOwner() &&
      <>
        <br />
        <button onClick={resetVote}>Reset vote</button>
        <br />
      </>}
      {isOwner() && renderVotersCount(votersCount)}
      {isOwner() && renderStepButton()}
      {isOwner() && workflowStatus === "0" && renderVoterButton()}
      {isRegistered && wrapperProposal()}
    </div>
  );
}

export default App;
