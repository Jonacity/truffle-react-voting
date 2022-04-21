import React, { useState, useEffect, useRef } from "react";
import VotingContract                         from "../contracts/Voting.json";
import getWeb3                                from "../getWeb3";
import WrapperProposal                        from "./WrapperProposal";
import WrapperVoter                           from "./WrapperVoter";
import Header                                 from "./Header";
import Content                                from "./Content";
import Footer                                 from "./Footer";
import Button                                 from 'react-bootstrap/Button';
import Container                              from 'react-bootstrap/Container';
import Spinner                                from 'react-bootstrap/Spinner';
import Stack                                  from 'react-bootstrap/Stack';
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

  // const inputRef = useRef();

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

          if (workflowStatus === "5") {
            const proposalWinningId = await instance.methods.winningProposalID().call();
            setProposalWinningId(proposalWinningId);
          }
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
          votersData.map(async event => {
            if (event.returnValues.voterAddress === accounts[0]) {
              setIsRegistered(true);
              const currentUser = await instance.methods.getVoter(accounts[0]).call({ from: accounts[0] });
              setCurrentUser(currentUser);

              if (parseInt(workflowStatus) >= 1) {
                const proposalsList = await instance.methods.getProposals().call({ from: accounts[0] });
                setProposals(proposalsList);
              }

              if (workflowStatus === "5") {
                const proposalWinningId = await instance.methods.winningProposalID().call();
                setProposalWinningId(proposalWinningId);
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
        if (workflowStatus === "5" && isRegistered) {
          const { accounts, contract } = w3State;
          const proposalsList = await contract.methods.getProposals().call({ from: accounts[0] });
          setProposals(proposalsList);
          const proposalWinningId = await contract.methods.winningProposalID().call();
          setProposalWinningId(proposalWinningId);
        }
    })()
  }, [workflowStatus]);

  const handleSubmitVoter = async () => {
    const { contract, owner } = w3State;
    await contract.methods.addVoter(voterInput).send({ from: owner });
  }

  const handleSubmitProposal = async () => {
    const { accounts, contract } = w3State;
    await contract.methods.addProposal(proposalInput).send({ from: accounts[0] });
  }

  const syncWorkflowStatus = async () => {
    const workflowStatus = await w3State.contract.methods.workflowStatus().call();
    setWorkFlowStatus(workflowStatus);
  }

  const startProposalsRegistering = async () => {
    const { contract, owner } = w3State;
    await contract.methods.startProposalsRegistering().send({ from: owner });
    await syncWorkflowStatus();
  }

  const endProposalsRegistering = async () => {
    const { contract, owner } = w3State;
    await contract.methods.endProposalsRegistering().send({ from: owner });
    await syncWorkflowStatus();
  }

  const startVotingSession = async () => {
    const { contract, owner } = w3State;
    await contract.methods.startVotingSession().send({ from: owner });
    await syncWorkflowStatus();
  }

  const endVotingSession = async () => {
    const { contract, owner } = w3State;
    await contract.methods.endVotingSession().send({ from: owner });
    await syncWorkflowStatus();
  }

  const tallyVotes = async () => {
    const { contract, owner } = w3State;
    await contract.methods.tallyVotes().send({ from: owner });
    await syncWorkflowStatus();
    const proposalsList = await contract.methods.getProposals().call({ from: owner });
    setProposals(proposalsList);
  }

  const resetVote = async () => {
    const { accounts, contract, owner } = w3State;
    await contract.methods.resetVote().send({ from: owner });
    await syncWorkflowStatus();
    setProposals([]);
    const voters = await contract.methods.getVoters().call({ from: accounts[0] });
    setVotersCount(voters.length);
    setProposalWinningId(null);
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

  const renderStepButton = () => {
    switch (workflowStatus) {
      case "0":
        return <Button onClick={startProposalsRegistering}>Start proposal registration</Button>;
      case "1":
        return <Button onClick={endProposalsRegistering}>End proposal registration</Button>;
      case "2":
        return <Button onClick={startVotingSession}>Start voting session</Button>;
      case "3":
        return <Button onClick={endVotingSession}>End voting session</Button>;
      case "4":
        return <Button onClick={tallyVotes}>Tally votes</Button>;
      case "5":
        return <Button onClick={resetVote}>Reset vote</Button>;
    }
  }

  const vote = async index => {
    const { accounts, contract } = w3State;
    await contract.methods.setVote(index).send({ from: accounts[0] });
    const currentUser = await contract.methods.getVoter(accounts[0]).call();
    setCurrentUser(currentUser);
  }

  const displayWinner = () => proposalWinningId && proposals[proposalWinningId];

  if (w3State.web3 === null) {
    return (
      <Container className="text-center">
         <br /> <br />
        <h3>Loading Web3, accounts, and contract...</h3>
        <Spinner animation="border" />
      </Container>
    )
  }

  return (
    <div className="App">
      <Header userAddress={w3State.accounts[0]} userType={renderLoggedUser()} />
      <Container>
        <Content />
        {/* {isOwner() &&
        <div>
          <Button onClick={resetVote}>Reset vote</Button>
          <br /><br />
        </div>} */}
        <Stack gap={2} className="col-md-4 mx-auto">
          {isOwner() && renderStepButton()}
          {isOwner() &&
            <WrapperVoter
              status={workflowStatus}
              count={votersCount}
              handleSubmitVoter={handleSubmitVoter}
              currentValue={voterInput}
              setValue={setVoterInput}
            />}
        </Stack>
        {displayWinner() && (
          <>
            <br />
            <p><b>🔥 The winner proposal is: {proposals[proposalWinningId].description} 🔥</b></p>
          </>
        )}
        {isRegistered &&
          <WrapperProposal
            status={workflowStatus}
            proposalsList={proposals}
            currentUser={currentUser}
            handleSubmitProposal={handleSubmitProposal}
            vote={vote}
            currentValue={proposalInput}
            setValue={setProposalInput}
          />}
        </Container>
        <Footer />
    </div>
  );
}

export default App;
