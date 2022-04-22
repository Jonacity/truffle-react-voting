import React       from "react";
import Button      from 'react-bootstrap/Button';
import InputGroup  from 'react-bootstrap/InputGroup';
import FormControl from 'react-bootstrap/FormControl';
import Card        from 'react-bootstrap/Card';
import Container   from 'react-bootstrap/Container';
import Row         from 'react-bootstrap/Row';
import Col         from 'react-bootstrap/Col';
import Stack       from 'react-bootstrap/Stack';

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

    const renderProposalInput = () => (
        <Stack gap={2} className="col-md-8 mx-auto">
            <InputGroup className="mb-3" value={currentValue} onChange={handleChangeProposal}>
                <FormControl
                    aria-label="Example text with button addon"
                    aria-describedby="basic-addon1"
                />
                <Button
                    id="add-proposal-btn"
                    variant="outline-secondary"
                    onClick={handleSubmitProposal}>
                    Add proposal
                </Button>
            </InputGroup>
        </Stack>
    )
    
    const renderProposals = (proposals) => {
        if (proposals.length === 0) {
          return <p>There is no proposal registered yet...</p>
        }

        return (
            <Container>
                <p>Proposals list:</p>
                <Row xs={1} md={3} className="g-4">
                    {proposals.map((proposal, index) =>
                    <Col>
                        <Card key={index}>
                            <Card.Body>
                                <Card.Text>
                                    {currentUser.hasVoted && parseInt(currentUser.votedProposalId) === index ? <b>{proposal.description}</b> : proposal.description}
                                </Card.Text>
                                {status === "3" && !currentUser.hasVoted &&
                                    <Button variant="primary" onClick={() => vote(index)}>Vote</Button>}
                            </Card.Body>
                            {status === "5" && 
                                <Card.Footer className="text-muted">{proposal.voteCount} {proposal.voteCount > 1 ? "votes" : "vote"}</Card.Footer>}
                        </Card>
                    </Col>)}
                </Row>
            </Container>
        )
    }

    return (
        <div>
            {status === "1" && renderProposalInput()}
            <br />
            {status !== "0" && renderProposals(proposalsList)}
        </div>
    )   
}

export default WrapperProposal;
