import React from "react";

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
    
    const renderVotersCount = (count) => <p>{count} registered {count > 1 ? "voters" : "voter"}</p>
    
    const renderVoterButton = () => (
        <div>
            <input value={currentValue} onChange={handleChangeVoter} />
            <button onClick={handleSubmitVoter}>Add voter</button>
        </div>
    )

    return (
        <div>
            {renderVotersCount(count)}
            {status === "0" && renderVoterButton()}
        </div>
    )
}

export default WrapperVoter;
