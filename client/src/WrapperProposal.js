import React from "react";

const WrapperProposal = props => {
    const status = props.status;
    const proposalsList = props.proposalsList;
    const currentUser = props.currentUser;
    const handleSubmitProposal = props.handleSubmitProposal;
    const vote = props.vote;
    const currentValue = props.currentValue;
    const setValue = props.setValue;
    
    const handleChangeProposal = (e) => {
        e.preventDefault();
        setValue(e.target.value);
    }
    
    const renderProposals = (proposals) => {
        if (proposals.length === 0) {
          return <p>There is no proposal registered yet.</p>
        }
      
        return (
          <div>
            Proposals:
            {proposals.map((proposal, index) =>
              <div key={index}>
                <p>{proposal.description}</p>
                {status === "3" && !currentUser.hasVoted &&
                <button onClick={() => vote(index)}>Vote</button>}
                {status === "5" &&
                <div>{proposal.voteCount} {proposal.voteCount > 1 ? "votes" : "vote"}</div>}
              </div>
            )}
          </div>
        )
    }

    return (
        <div>
            {status === "1" && (
            <div>
                <input value={currentValue} onChange={handleChangeProposal} />
                <button onClick={handleSubmitProposal}>Add proposal</button>
            </div>
            )}
            {status !== "0" && renderProposals(proposalsList)}
        </div>
    )   
}

export default WrapperProposal;
