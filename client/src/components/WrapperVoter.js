import React       from "react";
import Button      from 'react-bootstrap/Button';
import InputGroup  from 'react-bootstrap/InputGroup';
import FormControl from 'react-bootstrap/FormControl';
import Badge       from 'react-bootstrap/Badge';

const WrapperVoter = props => {
    const status = props.status;
    const count = props.count;
    const handleSubmitVoter = props.handleSubmitVoter;
    const currentValue = props.currentValue;
    const setValue = props.setValue;

    const handleChangeVoter = (e) => {
        e.preventDefault();
        setValue(e.target.value);
    }
    
    const renderVotersCount = (count) => (
        <Badge pill bg="success">{count} registered {count > 1 ? "voters" : "voter"}</Badge>
    )
    
    const renderVoterInput = () => (
        <InputGroup className="mb-3" value={currentValue} onChange={handleChangeVoter}>
            <FormControl
                aria-label="Example text with button addon"
                aria-describedby="basic-addon1"
            />
            <Button
                id="add-voter-btn"
                variant="outline-secondary"
                onClick={handleSubmitVoter}>
                Add voter
            </Button>
        </InputGroup>
    )

    return (
        <div>
            {renderVotersCount(count)}
            <br /><br />
            {status === "0" && renderVoterInput()}
        </div>
    )
}

export default WrapperVoter;
